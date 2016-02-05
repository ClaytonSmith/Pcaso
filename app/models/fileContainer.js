'user strict'

var formidable        = require('formidable');
var mongoose          = require('mongoose');
var grid              = require('gridfs-stream');
var fs                = require('fs');
var util              = require('util');
var multipart         = require('multipart');
var async             = require('async');
var mongoosePaginate  = require('mongoose-paginate');

var config            = require('../../config/config');
var asyncRemove       = require('../helpers/async-remove');
var mailer            = require('../../config/mailer');
var BaseSchema        = require('./base-schema');
var Comments          = require('./comments');
var Notification      = require('./notification');

var FileContainerSchema = new mongoose.Schema({
    
    dateAdded:       { type: Number,  default: Date.now },     // Join date
    lastUpdated:     { type: Number,  default: Date.now },     // Last seen
    parent: {
        collectionName:  { type: String,  required: true },     // collection
        id:              { type: String,  required: true },     // id
	name:            { type: mongoose.Schema.Types.Mixed, default: undefined }, // name
	username:        { type: String,  default: '' },        // username
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
	localLink:       { type: String,  required: true }
    }
}).extend({});

FileContainerSchema.plugin(mongoosePaginate);

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
    addSharedEntity: function( sharedEntity, callback ){
	//TODO: error checking
	// Reformat this to reduce number of branches
	var fileContainer = this;

	// If user account is given, notify and save email
	if( sharedEntity.__t === "User" ){
	    var notificationTitle = fileContainer.file.name + " has shared with you ";
	    var notification = Notification.register( sharedEntity, this, notificationTitle );

	    this.sharedWith.push( sharedEntity.email );
  	    
	    notification.save( function(err){
		if( err ) return callback( err );
		// TODO: move this into notificationx
		mailer.useTemplate( 'shared-dataset', sharedEntity, fileContainer, callback );
	    });
	
	} else if( typeof sharedEntity ===  'string' || sharedEntity instanceof String ){
	    
	    User.findOne( { email: sharedeeEntity }, function(err, doc){
		if( err )  callback( err );
		if( !doc ){
		    // Not user. Email non-user and save email 
		    this.sharedWith.push( sharedeeEntity );
		    mailer.useTemplate( 'shared-dataset-with-unregistered-user', sharedEntity, fileContainer, callback );
		    
		} else {
		    
		    this.sharedWith.push( sharedEntity.email );
		    
		    var notificationTitle = "A new dataset has been shared with you";
		    var notification = Notification.register( doc, this, notificationTitle );
		    
		    notification.save( function(err){
			if( err ) return callback( err );
			
			// TODO: move this into notificationx
			mailer.useTemplate( 'shared-dataset', sharedEntity, callback );
		    });	    
		}
	    });
	    
	} else {
	    shared = { id: sharedEntity._id, collectionName: sharedEntity.__t };
	    this.sharedWith.push( shared  );
	    callback( null );
	}
    },

    deleteSharedEntity: function( sharedEntity ){
	if( sharedEntity.__t === "User" || typeof sharedEntity ===  'string' || sharedEntity instanceof String ){
	    var index = this.sharedWith.indexOf( sharedEntity.email );
	    return ( index >= 0 ) ? this.sharedWith.splice( index, 1) : [] ;
	} else {
            var idIndex         = this.sharedWith.map( function(e){ return String( e.id ) } ).indexOf( String( sharedEntity._id ));
	    var collectionIndex = this.sharedWith.map( function(e){ return e.collectionName } ).indexOf( sharedEntity.__t );
	    return ( idIndex !== -1 && idIndex === collectionIndex ) ? this.sharedWith.splice( index, 1) : [] ;
	}
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
        var idIndex         = fileContainer.sharedWith.map( function(e){ return String( e.id ) } ).indexOf( String( entity._id ));
	var collectionIndex = fileContainer.sharedWith.map( function(e){ return e.collectionName } ).indexOf( entity.__t );
	var emailIndex      = fileContainer.sharedWith.indexOf( entity.email );
	
        if( emailIndex !== -1 || idIndex !== -1 && idIndex === collectionIndex ) return true
        
	return false;
        // TODO: Error checking for not public or private 
    },
    addNotification: function( id ){
	throw new Error( 'FileContainer should not be given notifications' );
    }
});

FileContainerSchema.static({
    register: function(parent, file, settings){
	
	var fileContainer = new this({
	    parent: {
		id: parent._id,
		collectionName: parent.__t,
		name: parent.name,
		username: parent.username
	    },
	    file: {
		name: file.name,
		path: file.path
	    },
	    metaData: settings.metaData,
	    displaySettings: settings.displaySettings,
	    fileOptions: settings.fileOptions
	});
	fileContainer.displaySettings.parentLink = parent.displaySettings.link,	
	fileContainer.displaySettings.bulletLink = Math.random().toString(36).substring(5) 
	
	fileContainer.displaySettings.customURL = fileContainer.displaySettings.customURL 
	    || fileContainer.displaySettings.bulletLink
	
	fileContainer.displaySettings.link = 
	    parent.displaySettings.link
	    + "/datasets/"
	    + fileContainer.displaySettings.customURL
	
	
	fileContainer.displaySettings.localLink = 
	    parent.displaySettings.localLink
	    + "/datasets/"
	    + fileContainer.displaySettings.customURL
	
	fileContainer.displaySettings.deleteLink = 
	    parent.displaySettings.localLink
	    + "/datasets/"
	    + fileContainer.displaySettings.customURL
	    + '/delete'
	
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
		asyncRemove.asyncRemove(fileContainer.comments, function(id, callback){    		
		    fileContainer.removeComment( id, callback );
		}, parellelCB );
	    },
	    
	    function(parellelCB){
		conn.once('open', function () {
		    grid(conn.db).remove( fileQuery, parellelCB );	
		});
	    },
	    function(parellelCB){
		deleteFrom( parentCollection, fileContainer.parent.id, parellelCB );
	    }
	], next );
});


module.exports = mongoose.model('FileContainer', FileContainerSchema);
