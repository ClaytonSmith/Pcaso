'user strict'

var formidable            = require('formidable');
var mongoose              = require('mongoose');
var grid                  = require('gridfs-stream');
var fs                    = require('fs');
var util                  = require('util');
var multipart             = require('multipart');
var config                = require('../../config/config');
var async                 = require('async');
var AsyncCollect          = require('../helpers/async-collect').asyncCollect;

// Load other models
var Users                 = mongoose.model('User');
var UnauthenticatedUsers  = mongoose.model('UnauthenticatedUser');
var FileContainers        = mongoose.model('FileContainer');
var Comments              = mongoose.model('Comment');
var Notifications         = mongoose.model('Notification');

grid.mongo = mongoose.mongo;
var conn   = mongoose.createConnection(config.db);

exports.get = function(req, res){

    // Make sure an authenticated user is making the request
    if( !req.isAuthenticated() && 
	req.query.parentID === req.user._id.toString() )
	res.sendCode(403);
    
    var query = {
	'parent.id': req.query.parentID,
	'parent.collectionName': req.query.parentCollectionName
    };

    console.log( query );
    Notifications.find( query , function(err, docs){
	
	if( err ) return res.sendCode( 500 );
    	res.send( docs );
    });
}

exports.redirect = function(req, res){

    // Make sure an authenticated user is making the request
    if( !req.isAuthenticated())
	res.render('/');
    
    var query = {
	_id: req.params.notificationID
    };
    
    Notifications.findOne( query , function(err, doc){
	if( err )  return res.render( '500.ejs' );
    	if( !doc ) return res.render( '404.ejs' );
	if( doc.parent.id !== req.user.id )
	    return res.render( '403.ejs' );
	
	doc.read = true;

	doc.save(function(saveErr){
	    if( saveErr ) return res.render( '500.ejs' );
	    
	    res.redirect( doc.links.link );
	});
    });
}

exports.remove = function(req, res){
    
    // Make sure an authenticated user is making the request
    if( !req.isAuthenticated())
	res.render('/');
    
    var query = {
	_id: req.body.notificationID
    };
    
    console.log(req.body)
    Notifications.findOne( query , function(err, doc){
	if( err )  return res.sendStatus( 500 );
    	if( !doc ) return res.sendStatus( 404 );
	if( doc.parent.id !== req.user.id )
	    return res.sendStauts( 403 );
	
	doc.remove(function(saveErr){
	    if( saveErr ) return res.sendStatus( 500 );
	    
	    res.sendStatus( 200 );
	});
    });
}
