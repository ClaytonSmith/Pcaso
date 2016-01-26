'user strict'

var formidable     = require('formidable');
var mongoose       = require('mongoose');
var grid           = require('gridfs-stream');
var fs             = require('fs');
var util           = require('util');
var multipart      = require('multipart');
var async          = require('async');
var config         = require('../../config/config');
var BaseSchema     = require('./base-schema');
var Comments       = require('./comments');

var FileContainerSchema = new mongoose.Schema({
    
    dateAdded:       { type: Number,  default: Date.now },     // Join date
    lastUpdated:     { type: Number,  default: Date.now },     // Last seen
    parent: {
        collectionName:  { type: String,  required: true },     // collection
        id:              { type: String,  required: true }      // id
    },
    file: {
     	name:            { type: String,  required: true },              // Path to file
	path:            { type: String,  required: true },              // Path to file
     	id:              { type: Object, default: mongoose.Types.ObjectId().toString() } 
    },     
    fileOptions: {
	keepFile:        { type: Boolean, default: false }, 
    },
    sharedWith:      { type: [],      default: [] },
    comments:        { type: [],      default: [] },
    metaData:        { type: Object,  default: {} },
    statistics: {
	viewCount:       { type: Number, default: 0 }      // File metadata
    },
    displaySettings: {
	visibility:      { type: String,  default: 'PRIVATE', required: true},  // Visibility
	parentLink:      { type: String,  required: true },
	customURL:       { type: String,  required: true },
	bulletLink:      { type: String,  required: true },
	link:            { type: String,  required: true },
    }
}).extend({});


FileContainerSchema.method({

    // Adds new comment ID to list of comments IFF commenting is enabled
    addComment: function(commentID){
        return this.comments.push( commentID );
    },
    
    deleteComment: function( commentID ){
	var index = this.comments.indexOf( commentID );     
        return ( index >= 0 ) ? this.comments.splice( index, 1) : [] ;
    },
    
    removeComment: function(commentID, callback){	

	var deleted = this.deleteComment( commentID );
	if( deleted.length > 0 ){
	    Comments.findOne( {  _id: commentID }, function(err, doc){
		if( err  ) return callback( err );
		if( !doc ) return callback( null );
		
		doc.remove( callback );
	    });   
	    
	} else {
	    callback( null );
	}

	return deleted;
    },
    
    // Should only be given mongo documents that have been extended
    // with the .extend({}) method.
    // { _id: ---, __t: ---} 
    addSharedEntity: function( sharedEntity ){
	//TODO: error checking
	
	// Email if entity is user
	this.sharedWith.push( sharedEntity );
	// email user
    },

    deleteSharedEntity: function( sharedEntity ){
	var index = this.sharedWith.indexOf( sharedEntity );
	return ( index >= 0 ) ? this.sharedWith.splice( index, 1) : [] ;
    },
    
    saveDisplaySettings: function( newSettings ){
	// Maybe want to keep history 
        // array of objects perhaps?
	
	var settings = JSON.parse(JSON.stringify( newSettings ));
	
	// If/when more settings are added, this method will become more usefull
	settings.visibility = newSettings.visibility || this.displaySettings.visibility;
	

	this.displaySettings = settings;
    
	return this.displaySettings;
    },
    
    getFile: function( dest ){
	
	grid.mongo  = mongoose.mongo;
        var conn    = mongoose.createConnection(config.db);
        var options = { _id: this.file.id, root: 'uploads'};    
	
	conn.once('open', function () {
	    var gfs = grid(conn.db);
	    
	    var read = gfs.createReadStream( options );
	    
	    read.on('error', function(err){ });
	    
	    read.pipe(dest);
	});
	
	this.statistics.viewCount += 1;
    },
    
    viewableTo: function(entity){ 
        var fileContainer = this;
        
        // Is file public 
	if( fileContainer.displaySettings.visibility === 'PUBLIC') return true;
	
        // Does entity exist and is it an entity
        if( !entity || typeof( entity ) !== 'object' || !entity._id ) return false ;

	// Entity is owner 
        // Stringify and compaire because we don't know if `entity._id` will be ObjectID or String	
	if( String( fileContainer.parent.id ) === entity._id.toString() &&
	    fileContainer.parent.collectionName === entity.__t ) return true;
	
        // File is private and entity is on the shared list
        var idIndex         = fileContainer.sharedWith.map( function(e){ return String( e._id ) } ).indexOf( String( entity._id ));
	var collectionIndex = fileContainer.sharedWith.map( function(e){ return e.__t } ).indexOf( entity.__t );

        if( idIndex !== -1 && idIndex === collectionIndex ) return true
        
	return false;
        // TODO: Error checking for not public or private 
    }    
});

FileContainerSchema.static({
    register: function(parent, file, settings){
	
	var fileContainer = new this({
	    parent: {
		id: parent._id,
		collectionName: parent.__t
            },
	    file: {
		name: file.name,
		path: file.path
	    },
	    displaySettings: settings.displaySettings,
	    fileOptions: settings.fileOptions
	});
	fileContainer.displaySettings.parentLink = parent.displaySettings.link,	
	fileContainer.displaySettings.bulletLink = Math.random().toString(36).substring(5) 
	
	fileContainer.displaySettings.customURL = fileContainer.displaySettings.customURL 
	    || fileContainer.displaySettings.bulletLink
	
	fileContainer.displaySettings.link = 
	    parent.displaySettings.link
	    + "/"
	    + fileContainer.displaySettings.customURL

	return fileContainer;
    } 
});	

FileContainerSchema.set('versionKey', false);

// Update dates 
FileContainerSchema.pre('save', function(next){
    // TODO error checking

    var fileContainer = this;
    fileContainer.lastUpdated = Date.now();
    
    if( fileContainer.isNew ){
	
	grid.mongo = mongoose.mongo;
	var conn   = mongoose.createConnection(config.db);
	var documentId = mongoose.Types.ObjectId();        		

        conn.once('open', function(){
	    
	    var gfs = grid(conn.db);
	    
	    var writestream = gfs.createWriteStream({
		_id: fileContainer.file.id,
		parent: {
		    id: fileContainer._id,
		    collection: fileContainer.__t
		},
 		filename: fileContainer.file.name,
		create: Date.now,
		root: 'uploads',
	 	mode: 'w'		    
	    });
	    
	    var read = fs.createReadStream(fileContainer.file.path)
	     
	    // TODO
	    //read.on('error', );
	    //writestream.on('error', throw new Error);
	    writestream.on('finish', function(){
		if( !fileContainer.fileOptions.keepFile ) fs.unlinkSync(fileContainer.file.path);	    
		next();
	    });
	    
	    read.pipe(writestream);
	});
    } else { 	
	next();
    }
});

// Before a user deletes their account, remove all of their files and directory

FileContainerSchema.pre('remove', function(next) {
    var fileContainer = this;
    
    grid.mongo = mongoose.mongo;
    var conn   = mongoose.createConnection(config.db);
    var fileQuery = {_id: fileContainer.file.id, root: 'uploads'};


    var parentCollection  = mongoose.model( fileContainer.parent.collectionName );    
    function deleteFrom( collection, searchQuery, callback ){
        collection.findOne( { _id: searchQuery }, function( err, doc ){
            
            if( err ) return callback( err );
	    
            // Parent has been removed
            if( !doc ) return callback( null );
            
            // Make sure doc deletes the comment
            // if doc is the caller, then the comment has allready been deleted.
	    doc.deleteFile( fileContainer._id );
	    doc.save( callback );
        });
    };

    // Delete file
    async.parallel(
	[
	    function(parellelCB){
		async.map(fileContainer.comments, function(id, mapCB){    		
		    fileContainer.removeComment( id, mapCB );
		}, function(err, results){
		    // No need for error checking here
		    parellelCB( err, results );
		});
	    },
	    
	    function(parellelCB){
		conn.once('open', function () {
		    grid(conn.db).remove( fileQuery, function(err){
			parellelCB(err, null);
		    });	
		});
	    },
	    function(parellelCB){
		deleteFrom( parentCollection, fileContainer.parent.id, function(err, results){
		    parellelCB( err, results );
		});
	    }
	],
	function(err, results){
	    next(err, results);
	});
});


module.exports = mongoose.model('FileContainer', FileContainerSchema);
