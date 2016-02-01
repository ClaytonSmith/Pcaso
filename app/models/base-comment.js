'use strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var util         = require('util');
var extend       = require('mongoose-schema-extend')

var config       = require('../../config/config');

//var BaseSchema   = mongoose.model("BaseSchema");

var CommentableSchema = new mongoose.Schema({
    comments:   { type: [],     default: [] },            // Comments on comment
});


CommentableSchema.method({
    
    addComment: function(commentID){
        if( !this.settings.commentable )
            return new Error( 'Commenting is disallowed on this' + this.__t);
        return this.comments.push( commentID );
    },
    
    deleteComment: function( commentID ){
        var index = this.comments.indexOf( commentID );
        return ( index >= 0 ) ? this.comments.splice( index, 1 ) : [] ;
    },
    
    removeComment: function( commentID, callback ){
        var Comments = mongoose.model('Comment');
	
        var deleted = this.deleteComment( commentID );
        
        if( deleted.length && this._id !== commentID ){
	    Comments.findOne({ _id: commentID }, function(err, doc){
                if( err )  return callback( err );
                if( !doc ) return callback( false );
                
		doc.remove( callback ); 
	    });
	}
        
        return deleted;
    }
});

CommentableSchema.pre('save', function( next ){
    var comment = this;
    comment.lastUpdated = Date.now();
    
    next();
});

                  
CommentableSchema.pre('remove', function( next ){
    
    // pop pop pop
    while( comment.comments.length !== 0 ){
	comment.removeComment( comment.comments[0], function(err){
	    if( err ) next( err );
	});
    };
    
    next();
});

module.exports = mongoose.model('Commentable', CommentableSchema);
