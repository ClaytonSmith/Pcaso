'user strict'

var formidable        = require('formidable');
var mongoose          = require('mongoose');
var grid              = require('gridfs-stream');
var fs                = require('fs');
var util              = require('util');
var multipart         = require('multipart');
var async             = require('async');
var mongoosePaginate  = require('mongoose-paginate');
var mkdirp            = require('mkdirp');
var rimraf            = require('rimraf');

var config            = require('../../config/config');
var asyncRemove       = require('../helpers/async-remove');
var generateThumbnail = require('../helpers/generate-datascape-thumbnail');
var mailer            = require('../../config/mailer');
var Comments          = require('./comments');
var Notification      = require('./notification');


var FileContainerSchema = new mongoose.Schema({
    
    dateAdded:       { type: Number,  default: Date.now },     // Join date
    lastUpdated:     { type: Number,  default: Date.now },     // Last seen
    parent: {
        collectionName:  { type: String,  required: true },     // collection
        id:              { type: String,  required: true },     // id
	name:            { type: mongoose.Schema.Types.Mixed, default: undefined }, // name
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
    statistics: {
	viewCount:       { type: Number, default: 0 }      // File metadata
    },
    displaySettings: {
	visibility:      { type: String,  default: 'PRIVATE', required: true},  // Visibility
	title:           { type: String,  required: true },                     // Display title
	
	caption:         { type: String,  default: ''    },                     // description
	display:         { type: Object,  required: true, default: {}},         // Tells the painter how to interpret the data
	legacy:          { type: Object,  required: true, default: {}},         // Tells OLD painter how to interpret the data
    },
    localDataPath:  { type: String, required: true },
    publicDataPath: { type: String, required: true },
    links: {
	parent:          { type: String,  required: true },
	thumbnail:       { type: String,  required: true },
	custom:          { type: String,  required: true },
	bullet:          { type: String,  required: true, unique: true },        // Should never have two identicle bullets
	link:            { type: String,  required: true, unique: true },        // Unique links prvent users from having two files with 
	local:           { type: String,  required: true, unique: true },        // files with the same name having the same link
	base:            { type: String,  required: true }                       // /u/USER_ID/dataset/
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
		mailer.useTemplate( 'shared-datascape', sharedEntity, fileContainer, callback );
	    });
	
	} else if( typeof sharedEntity ===  'string' || sharedEntity instanceof String ){
	    
	    User.findOne( { email: sharedeeEntity }, function(err, doc){
		if( err )  callback( err );
		if( !doc ){
		    // Not user. Email non-user and save email 
		    this.sharedWith.push( sharedeeEntity );
		    mailer.useTemplate( 'shared-datascape-with-unregistered-user', sharedEntity, fileContainer, callback );
		    
		} else {
		    
		    this.sharedWith.push( sharedEntity.email );
		    
		    var notificationTitle = "A new datascape has been shared with you";
		    var notification = Notification.register( doc, this, notificationTitle );
		    
		    notification.save( function(err){
			if( err ) return callback( err );
			
			// TODO: move this into notificationx
			mailer.useTemplate( 'shared-datascape', sharedEntity, callback );
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
    
    updateSettings: function( newSettings, callback ){
	// Maybe want to keep history 
        // array of objects perhaps?
	var fileContainer = this;

	// Diff the `sharedWith` list to get the newly added users
	var newSharedUsers = newSettings.sharedWith.filter(function(email){ return fileContainer.sharedWith.indexOf( email ) === -1; })
	
	fileContainer.sharedWith = newSettings.sharedWith;

	fileContainer.displaySettings.display     = ( newSettings.displaySettings || {} ).display     || fileContainer.displaySettings.display;
	fileContainer.displaySettings.title       = ( newSettings.displaySettings || {} ).title       || fileContainer.displaySettings.title;
	fileContainer.displaySettings.caption     = ( newSettings.displaySettings || {} ).caption     || fileContainer.displaySettings.caption;
	fileContainer.displaySettings.visibility  = ( newSettings.displaySettings || {} ).visibility  || fileContainer.displaySettings.visibility;	    
	    
	fileContainer.displaySettings.legacy =
	    fileContainer.constructor.convertDisplaySettingsToLegacy( fileContainer.displaySettings );

	// Summon on the fly because including up-top would 
	// create a circular dependany
	Users = mongoose.model('User');

	async.each(
	    newSharedUsers, 
	    function(email, eachCB){
		Users.findOne({email: email}, function(err, doc){
		    if( err ) return eachCB( err );
		    if( doc ) {
			console.log('NEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEW', "User\n\n\n\n\n\n\n\n");
			mailer.useTemplate('shared-with-authenticated-user', doc, { datascape: fileContainer }, eachCB );
		    } else
			mailer.useTemplate('shared-with-unauthenticated-user', email, { datascape: fileContainer }, eachCB );
		});
	    },
	    callback );	
	
	return fileContainer.displaySettings;
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

    // Converts form inputs into something recognizable to the legacy painter
    convertDisplaySettingsToLegacy: function( displaySettings ){
	var lagacySettings = {
	    "fields-pca":     [],
	    "fields-meta":    [],
	    "fields-meta-id": [],
	    'omit':           [],
	    "caption": displaySettings.caption
	}
	
	displaySettings.display.columnTypes.forEach(function(column, index){
	    var bucket = null;
	    
	    if( column === 'id' )         bucket = "fields-meta-id";
	    else if( column === 'meta' )  bucket = "fields-meta";
	    else if( column === 'omit' )  bucket = "omit";
	    else                          bucket = "fields-pca";
	    
	    lagacySettings[ bucket ].push( index +1 );
	});
	
	return lagacySettings;
    },
    
    register: function(parent, file, settings){
	
	console.log( 'Register', file );
	var documentId = mongoose.Types.ObjectId();        		
	var fileId = mongoose.Types.ObjectId();        		
	var fileContainer = new this({
	    _id: documentId,
	    parent: {
		id: parent._id,
		collectionName: parent.__t,
		name: parent.name,
	    },
	    file: {
		id: fileId,
		name: file.name,
		path: file.path
	    },
	    sharedWith: settings.sharedWith ? settings.sharedWith : [], 
	    fileOptions: settings.fileOptions,	    
	    displaySettings: settings.displaySettings,
	    localDataPath:  parent.localDataPath,
	    publicDataPath: parent.publicDataPath,
	    links: {
		thumbnail: parent.publicDataPath + "/files/thumbnails/" + documentId +".png",
		parent: parent.links.link,
		bullet: Math.random().toString(36).substring(5) 
	    }
	});
	fileContainer.displaySettings.title = fileContainer.displaySettings.title || file.name;	    	
	fileContainer.displaySettings.legacy = this.convertDisplaySettingsToLegacy( fileContainer.displaySettings );
	
	fileContainer.links.custom = (settings.links || {}).customURL || fileContainer.links.bullet;
	fileContainer.links.link  = parent.links.link  + "/datascapes/" + fileContainer.links.custom;
	fileContainer.links.local = parent.links.local + "/datascapes/" + fileContainer.links.custom;
	fileContainer.links.base  = parent.links.local + "/datascapes/";

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
		
		
		// create thumbnail path and thumbnail
		mkdirp( fileContainer.localDataPath + "/files/thumbnails/", function(mkdirErr){
		    if( mkdirErr ) return next( mkdirErr );
		    
		    generateThumbnail( fileContainer.localDataPath + "/files/thumbnails/" + fileContainer._id +".png", next );

		});
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
		    console.log("Removal:",fileQuery);
		    grid(conn.db).remove( fileQuery, parellelCB );	
		});
	    },
	    function(parellelCB){
		deleteFrom( parentCollection, fileContainer.parent.id, parellelCB );
	    }
	], next );
});


module.exports = mongoose.model('FileContainer', FileContainerSchema);
