'user strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var grid         = require('gridfs-stream');
var fs           = require('fs');
var util         = require('util');
var multipart    = require('multipart');
var config       = require('../../config/config');

var FileContainerSchema = mongoose.Schema({
    parentId:      { type: Object,  required: true },       // Owner
    fileId:        { type: Object,  required: true },       // File itself
    visibility:    { type: String, 'default': 'PRIVATE' },  // Visibility
    sharedWith:    { type: [],     'default': [] },         // List of users who can view the file
    dateAdded:     { type: Number, 'default': Date.now },   // Date added
    lastUpdated:   { type: Number, 'default': Date.now },   // Last modified 
    comments  :    { type: [],     'default': [] },         // List of comment IDs
    statistics:    { type: Object, 'default': {} }, 
    settings:      { type: Object, 'default': {} },         // Display settings. Don't know what ths will look like yet
    bulletLink:    { type: String } 
});


/**
 * Methods
 */

FileContainerSchema.method({
    addSharedUser: function( newSharedUserID ){
	return this.sharedWithIDs.push( newSharedUserID );
    },

    removeSharedUser: function( sharedUserID ){
	var index = this.sharedWithIDs.indexOf( sharedUserID );
	if( index !== -1 ){
	    
	    // Return deleted IDs. All other IDs left untouched
	    return this.sharedWithIDs.splice( index, 1);
	} else {

	    // Err: just return empty array
	    return [];
	}
    },

    addComment: function( newCommentID ){
	return this.commentIDs.push( newCommentID );
    },

    deleteComment: function( commentID ){
	var index = this.commentIDs.indexOf( commentID );
	if( index !== -1 ){
	    
	    // Return deleted IDs. All other IDs left untouched
	    return this.commentIDs.splice( index, 1);
	} else {

	    // Err: just return empty array
	    return [];
	}
    },

    updateSettings: function( newSettings ){
	return this.settings = newSettings; 
    },
    
    getFile: function(){
	// update view count
	
    }
    
});


// Update dates 
FileContainerSchema.pre('save', function(next){
    this.lastUpdated = Date.now();
    
    // this.bulletLink = 
    next();
});


FileContainerSchema.post('save', function(){
    
});


// Before a user deletes their account, remove all of their files and directory

FileContainerSchema.pre('remove', function(next) {
    var options = {_id: this.fileId, root: 'uploads'};
    var fileContainer = this;
    console.log(options);
    console.log('FILECONTAINER: in remove');
    
    grid.mongo = mongoose.mongo;
    var conn   = mongoose.createConnection(config.db);
    
    // Delete file
    conn.once('open', function () {
	grid(conn.db).remove( options, function (err) {
	    if (err) return handleError(err);
	   console.log('File removed', options._id);
	});	
    });
    
    
    //fileContainer.comments.forEach( function(comment){
    // delete every comment 
    //fileContainer.deleteComment( comment );
    //});
    
       
    next();
});

module.exports = mongoose.model('FileContainer', FileContainerSchema);
