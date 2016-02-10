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
    console.log( req.body, req.params );
    Comments.collectByTopic( req.body.topic, function(err, docs){
    	res.send( Comments.jqueryCommentsTransform( docs ));
    }); 

//    res.send( [ req.body ] );
}

exports.postComment = function(req, res){
    if( !req.isAuthenticated() )
	res.send( 403 );

    var query = null;

    console.log( req.body );
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
	if( err || !doc ) req.send(404);
	
	var subject = null;
	if( doc.username ) subject =  doc.username +"'s account";
	else if( ( doc.displaySettings || {}).title ) subject = doc.displaySettings.title;
	else subject = 'New comment';

	var comment = {
	    body: req.body.body,
	    subject: subject
	}
	

	var comment = req.user.leaveComment( doc, subject, req.body.body, function(commentError){ 
	    
	    res.send( Comments.jqueryCommentsTransform( [ comment ] )[0] );
	    req.user.save(function(err){
		// handle error somehow
	    });
	});
    });
}

exports.deleteComment  = function(req, res){
    if( !req.isAuthenticated() )
	res.send( 403 );
    
    var query = {
	'_id': req.params.commentID,
	'parent.id': req.user._id,
	'parent.collectionName': req.user.__t
    };
    
    Comments.findOne( query, function(err, doc){
	if( err || !doc ) return res.send( 403 );
	
	doc.remove( function(removeError){
	    if( removeError ) res.send( 500 );
	    else res.send( 200 );
	})
    });
}



exports.editComment  = function(req, res){
    if( !req.isAuthenticated() )
	res.send( 403 );
    
    var query = {
	'_id': req.body.id,
	'parent.id': req.user._id,
	'parent.collectionName': req.user.__t
    };
    
    Comments.findOne( query, function(err, doc){
	if( err || !doc ) return res.send( 403 );
	doc.body = req.body.body;
	
	doc.save( function(saveError){
	    if( saveError ) res.send( 500 );
	    else res.send( 200 );
	});
    });
}
