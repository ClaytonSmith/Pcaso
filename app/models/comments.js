'use strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var util         = require('util');
var extend       = require('mongoose-schema-extend')

var config       = require('../../config/config');

//var BaseSchema   = mongoose.model("BaseSchema");

var CommentSchema = new mongoose.Schema({
    dateAdded:      { type: Number,  default: Date.now },            // Join date
    lastUpdated:    { type: Number,  default: Date.now },             // Last seen
    
    parent: {                                                // who left comment
        collectionName: { type: String,  required: true },    // collection
        id:             { type: String,  required: true }     // id
    },
    subject: {                                               // What comment is on
        collectionName: { type: String,  required: true },    // collection
        id:             { type: String,  required: true }     // id
    },
    children:   { type: [],     default: [] },            // Comments on comment
    from:       { type: String, required: true },
    body:       { type: String, required: true },
    settings: {
        acceptFiles:   { type: Boolean, 'default': true },
        commentable:   { type: Boolean, 'default': true }
    }
});


CommentSchema.method({
    
    addComment: function(commentID){
        if( !this.settings.commentable )
            return new Error( 'Commenting is disallowed on this' + this.__t);
        return this.children.push( commentID );
    },
    
    deleteComment: function( commentID ){
        var index = this.children.indexOf( commentID );
        return ( index >= 0 ) ? this.children.splice( index, 1 ) : [] ;
    },
    
    removeComment: function( commentID ){
        var Comments = mongoose.model('Comment');
	
        var deleted = this.deleteComment( commentID );
        
        if( deleted.length && this._id !== commentID ){
	    Comments.findOne({ _id: commentID }, function(err, doc){
                if( err ) return handleError( err );
                if( !doc ) return true;
                
		doc.remove();
	    });
	}
        
        return deleted;
    }
});

CommentSchema.pre('save', function( next ){
    var comment = this;
    comment.lastUpdated = Date.now();
    
    next();
});

                  
CommentSchema.pre('remove', function( next ){

    var comment = this;
    
    var parentCollection  = mongoose.model( comment.parent.collectionName );
    var subjectCollection = mongoose.model( comment.subject.collectionName );
    
    function deleteFrom( collection, searchQuery ){
        
        collection.findOne( searchQuery, function( err, doc ){
            
            if( err ) handelError( err );
            
            // Parent has been removed
            if( !doc ) return true;
            
            // Make sure doc deletes the comment
            // if doc is the caller, then the comment has allready been deleted.
            doc.deleteComment( comment._id );
        });
    };
    
    // TODO: night need asyn to 
    // remove from parent and subject
    deleteFrom( parentCollection,  { _id: comment.parent.id  } );
    deleteFrom( subjectCollection, { _id: comment.subject.id } );

    // pop pop pop
    while( comment.children.length !== 0 ){
	comment.deleteComment( comment.children[0] );
    };
    
    next();
});

module.exports = mongoose.model('Comment', CommentSchema);
