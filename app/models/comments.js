'use strict'

var formidable     = require('formidable');
var mongoose       = require('mongoose');
var util           = require('util');
var extend         = require('mongoose-schema-extend')
var async          = require('async');
var config         = require('../../config/config');
var asyncRemove    = require('../helpers/async-remove');

//var BaseSchema   = mongoose.model("BaseSchema");

var CommentSchema = new mongoose.Schema({
    dateAdded:      { type: Number,  default: Date.now },     // Join date
    lastUpdated:    { type: Number,  default: Date.now },     // Last seen
    
    parent: {                                                 // who left comment/owner
        collectionName: { type: String,  required: true },    // collection
        id:             { type: String,  required: true }     // id
    },
    target: {                                                 // What comment is on
        collectionName: { type: String,  required: true },    // collection
        id:             { type: String,  required: true }     // id
    },
    subject:    { type: String,  required: true },
    children:   { type: [],     default: [] },                // Comments on comment
    from:       { type: String, required: true },
    body:       { type: String, required: true },
    displaySettings: {
	parentLink:     { type: String, required: true },
	link:           { type: String, required: true }
    }
}).extend({});


CommentSchema.method({
    
    addComment: function(commentID){
        return this.children.push( commentID );
    },
    
    deleteComment: function( commentID ){
        var index = this.children.indexOf( commentID );
        return ( index >= 0 ) ? this.children.splice( index, 1 ) : [ ] ;
    },
    
    removeComment: function( commentID, callback ){
        var Comments = mongoose.model('Comment');
	
        var deleted = this.deleteComment( commentID );
        
        if( deleted.length && this._id !== commentID ){
	    Comments.findOne({ _id: commentID }, function(err, doc){
                if( err ) return callback( err );
                if( !doc ) return callback( null );
                
		doc.remove( callback );
	    });
	}
        
        return deleted;
    },
    addNotification: function( id ){
	throw new Error( 'Comments should not be given notifications' );
    }
    
});

CommentSchema.static({
    register: function(parent, target, from, subject, body){

	var newComment = new this({
	    parent: {
		id: parent._id,
		collectionName: parent.__t
	    },
	    target: {
		id: target._id,
		collectionName: target.__t
	    },
	    from: from,
	    subject: subject,
	    body: body,
	    displaySettings: {
		parentLink: parent.displaySettings.link,
		link: target.displaySettings.link, // Will add comment direct link
	    }
	});
	
	target.addComment( newComment._id );
	
	return newComment;
    }    
});

CommentSchema.set('versionKey', false);

CommentSchema.pre('save', function( next ){
    var comment = this;
    comment.lastUpdated = Date.now();
    
    next();
});

                  
CommentSchema.pre('remove', function( next ){
    
    var comment = this;
    var parentCollection  = mongoose.model( comment.parent.collectionName );
    var subjectCollection = mongoose.model( comment.target.collectionName );
    
    function deleteFrom( collection, searchQuery, callback ){
        collection.findOne( { _id: searchQuery }, function( err, doc ){
            
            if( err ) return callback( err );

            // Parent has been removed
            if( !doc ) return callback( null );
            
            // Make sure doc deletes the comment
            // if doc is the caller, then the comment has allready been deleted.
	    doc.deleteComment( comment._id );
	    doc.save( callback );
        });
    };
    
    async.series(
	[
	    function(parellelCB){	
		asyncRemove.asyncRemove(comment.children, function(id, callback){
		    comment.removeComment( id, callback );
		}, parellelCB );
	    },

	    function(parellelCB){	
		deleteFrom( parentCollection, comment.parent.id, parellelCB );
	    },

	    function(parellelCB){	
		deleteFrom( subjectCollection, comment.target.id, parellelCB );
	    },

	], next );
});		  


module.exports = mongoose.model('Comment', CommentSchema);
