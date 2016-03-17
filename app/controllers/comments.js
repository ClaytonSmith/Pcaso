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
    	if( err ){
	    res.status( 500 ).send({err: "Server err"});
	    throw new Error( err );
	}
	else res.send( Comments.jqueryCommentsTransform( docs ));
    });
    
}

exports.postComment = function(req, res){
    if( !req.isAuthenticated() )
	return  res.status( 403 ).send({err: "Forbidden"});

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
	if( err ) {
	    res.status(500).send({err: "Server error"})
	    throw new Error( err );
	}
	
	if( !doc ) return res.status(404).send({err: "Document not found"});

	var subject = null;
	if( doc.name ) subject =  doc.name.first +' '+ doc.name.last +"'s account";
	else if( ( doc.displaySettings || {}).title ) subject = doc.displaySettings.title;
	else subject = 'New comment';

	var comment = {
	    body: req.body.body,
	    subject: subject
	}
	
	var comment = req.user.leaveComment( doc, subject, req.body.body, function(commentError){ 	    
	    if( commentError ){
		res.status(500).send({err: "Server error", message: commentError });
		throw new Error( err );
	    }

	    req.user.save(function(saveErr){
		if( saveErr ) {
		    res.status(500).send({err: "Server error"})
		    throw new Error( saveErr );
		} 
		
		res.send( Comments.jqueryCommentsTransform( [ comment ] )[0] );
	    });
	});
    });
}

exports.deleteComment  = function(req, res){
    if( !req.isAuthenticated() )
	return res.status( 403 ).send({err: "Forbidden"});
    
    var query = {
	'_id': req.params.commentID,
	'parent.id': req.user._id,
	'parent.collectionName': req.user.__t
    };
    
    Comments.findOne( query, function(err, doc){
	if( err ){
	    res.status(500).send({err: "Server error"})
	    throw new Error( err );
	} 
	
	if( !doc ) return res.status(404).send({err: "Comment not found"});

	doc.remove( function(removeError){
	    if( removeErr ) {
		res.status(500).send({err: "Server error"})
		throw new Error( removeErr );
	    
	    } else res.sendStatus( 200 );
	})
    });
}



exports.editComment  = function(req, res){

    if( !req.isAuthenticated() )
	return res.status( 403 ).send({err: "Forbidden"});
    
    var query = {
	'_id': req.body.id,
	'parent.id': req.user._id,
	'parent.collectionName': req.user.__t
    };
    
    Comments.findOne( query, function(err, doc){
	if( err ){
	    res.status(500).send({err: "Server error"})
	    throw new Error( err );
	} 
	
	if( !doc ) return res.status(404).send({err: "Comment not found"});
	
	doc.body = req.body.body;
	
	doc.save( function(saveError){
	    if( saveError ) {
		res.status(500).send({err: "Server error"})
		throw new Error( saveErr );
		
	    }  else res.status( 200 ).send({message: "OK"});
	});
    });
}
