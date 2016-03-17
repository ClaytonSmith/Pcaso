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


exports.get = function(req, res){

    // Make sure an authenticated user is making the request
    if( !req.isAuthenticated() &&  req.user &&
	req.query.parentID === req.user._id.toString() )
	return res.status(403).send({err: "Forbidden"});
    
    var query = {
	'parent.id': req.query.parentID,
	'parent.collectionName': req.query.parentCollectionName
    };

    Notifications.find( query , function(err, docs){	
	if( err ) return res.status(500).send({err: "Server error"});
    	else res.send( docs );
    });
}

exports.redirect = function(req, res){

    // Make sure an authenticated user is making the request
    if( !req.isAuthenticated())
	return res.redirect('/');
    
    var query = {
	_id: req.params.notificationID
    };
    
    Notifications.findOne( query , function(err, doc){
	if( err ){
	    res.redirect( '/500' );
    	    throw new Error( err );
	}
	if( !doc ) return res.redirect( '/404' );
	if( doc.parent.id !== req.user.id )
	    return res.redirect( '/403' );
	
	doc.read = true;

	doc.save(function(saveErr){
	    if( saveErr ) return res.redirect( '/500' );
	    
	    res.redirect( doc.links.link );
	});
    });
}

exports.remove = function(req, res){
    
    // Make sure an authenticated user is making the request
    if( !req.isAuthenticated())
	return res.render('/');
    
    var query = {
	_id: req.body.notificationID
    };
    
    Notifications.findOne( query , function(err, doc){
	if( err ){
	    res.status( 500 ).send({err: "Server error"});
	    throw new Error( err );
	}
    	if( !doc ) return res.status( 404 ).send({err: "Notification not found"});

	if( doc.parent.id !== req.user.id )
	    return res.status( 403 ).send({err: "Forbidden"});

	doc.remove(function(saveErr){
	    if( saveErr ) res.status( 500 ).send({err: "Server error"});
	    else res.sendStatus( 200 );
	});
    });
}
