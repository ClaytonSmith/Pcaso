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
        collection:    { type: String,  required: true },    // collection
        _id:           { type: String,  required: true }     // id
    },
    subject: {                                               // What comment is on
        collection:    { type: String,  required: true },    // collection
        _id:           { type: String,  required: true }     // id
    },
    children:   { type: [],     required: true },            // Comments on comment
    from:       { type: String, required: true },
    body:       { type: String, required: true },
    settings: {
        acceptFiles:   { type: Boolean, 'default': true },
        commentable:   { type: Boolean, 'default': true }
    }
});


CommentSchema.method({
    
    deleteComment: function( commentID ){
        var index = this.children.indexOf( commentID );
        return ( index >= 0 ) ? this.children.splice( index, 1 ) : [] ;
    },
    
    removeComment: function( commentID ){
        var Comments = mongoose.model('Comments');
	
        var deleted = deleteComment( commentID );
        
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
    
    var parentCollection  = mongoose.model( comment.parent.collection );
    var subjectCollection = mongoose.model( comment.subject.collection );
    
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

    // remove from parent and subject
    deleteFrom( parentCollection,   { _id: comment.parent._id  } );
    deleteFrom( subjecctCollection, { _id: comment.subject._id } );

    // pop pop pop
    while( comment.children.length !== 0 ){
	console.log('Deleting comment', children[0]);
	comment.deleteComment( comment.children[0] );
    };
        

});

module.exports = mongoose.model('Comment', CommentSchema);
