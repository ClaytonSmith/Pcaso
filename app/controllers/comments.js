'user strict'

var formidable            = require('formidable');
var mongoose              = require('mongoose');
var grid                  = require('gridfs-stream');
var fs                    = require('fs');
var util                  = require('util');
var multipart             = require('multipart');
var config                = require('../../config/config');
var async                 = require('async');

var Comments              = mongoose.model('Comment');


exports.getComments  = function(req, res){
   
    var query = {
	id: req.query.id,
	collectionName: req.query.collectionName
    };

    Comments.collectByTopic( query , function(err, docs){
    	res.send( Comments.jqueryCommentsTransform( docs ));
    });
    
}

exports.postComment = function(req, res){
    if( !req.isAuthenticated() )
	res.sendStatus( 403 );

    var query = null;

    if( req.body.target !== '' ){
	query = {
	    '_id':  req.body.target,
	    '__t':  'Comment'
	}
    } else { 
	query = {
	    '_id':  req.body.topic.id,
	    '__t':  req.body.topic.collectionName
	};
    }	 
	
    
    var collection = mongoose.model( query.__t );

    collection.findOne( query, function(err, doc){
	if( err || !doc ) req.sendStatus(404);
	
	
	var subject = null;
	if( doc.username ) subject =  doc.username +"'s account";
	else if( ( doc.displaySettings || {}).title ) subject = doc.displaySettings.title;
	else subject = 'New comment';

	var comment = {
	    body: req.body.body,
	    subject: subject
	}
	
	console.log('Hello');
	var comment = req.user.leaveComment( doc, subject, req.body.body, function(commentError){ 	    
	    console.log(commentError, "heyyyyyyyyy"); 
	    req.user.save(function(err){
		if( err ) res.sendStatus(500);
		res.send( Comments.jqueryCommentsTransform( [ comment ] )[0] );
		// handle error somehow
	    });
	});
    });
}

exports.deleteComment  = function(req, res){
    if( !req.isAuthenticated() )
	res.sendStatus( 403 );
    
    var query = {
	'_id': req.params.commentID,
	'parent.id': req.user._id,
	'parent.collectionName': req.user.__t
    };
    
    Comments.findOne( query, function(err, doc){
	if( err || !doc ) return res.sendStatus( 403 );
	
	doc.remove( function(removeError){
	    if( removeError ) res.sendStatus( 500 );
	    else res.sendStatus( 200 );
	})
    });
}



exports.editComment  = function(req, res){
    if( !req.isAuthenticated() )
	res.sendStatus( 403 );
    
    var query = {
	'_id': req.body.id,
	'parent.id': req.user._id,
	'parent.collectionName': req.user.__t
    };
    
    Comments.findOne( query, function(err, doc){
	if( err || !doc ) return res.sendStatus( 403 );
	doc.body = req.body.body;
	
	doc.save( function(saveError){
	    if( saveError ) res.sendStatus( 500 );
	    else res.sendStatus( 200 );
	});
    });
}
