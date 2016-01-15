'user strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var grid         = require('gridfs-stream');
var fs           = require('fs');
var util         = require('util');
var multipart    = require('multipart');
var config       = require('../../config/config');

var BaseSchema   = require('./base-schema');
var Comments     = require('./comments');

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
    keepFile:        { type: Boolean, default: false }, 
    visibility:      { type: String,  default: 'PRIVATE' },  // Visibility
    sharedWith:      { type: [],      default: [] },
    comments:        { type: [],      default: [] },
    statistics:      { type: Object,  default: {} },
    metaData: {
	veiws:            { type: Number, default: 0 }      // File metadata
    },
    displaySettings:  { type: Object, default: {} },         // Display settings.
    bulletLink:       { type: String },
    settings: {
        acceptFiles:      { type: Boolean, default: false },
        commentable:      { type: Boolean, default: true }
    }
});


FileContainerSchema.method({

    // Adds new comment ID to list of comments IFF commenting is enabled
    addComment: function(commentID){
        if( !this.settings.commentable )
            return new Error( 'Commenting is disallowed on this' + this.__t);
        return this.comments.push( commentID );
    },
    
    deleteComment: function( commentID ){
	var index = this.comments.indexOf( commentID );     
        return ( index >= 0 ) ? this.comments.splice( index, 1) : [] ;
    },
    
    removeComment: function(commentID){	
	var deleted = this.deleteComment( commentID );
        if( deleted.length && this._id !== commentID ){
            Comments.findOne({ _id: commentID }, function(err, doc){
		if( err ) throw new Error( err );
		if( !doc ) return true; 
		doc.remove();
	    });   
	}

	return deleted;
    },
    
    addSharedEntity: function( sharedEntity ){
	this.sharedWith.push( sharedEntity );
	// email user
    },

    deleteSharedEntity: function( sharedEntity ){
	var index = this.sharedWith.indexOf( sharedEntity );
	return ( index >= 0 ) ? this.sharedWith.splice( index, 1) : [] ;
    },
    
    updateSettings: function( newSettings ){
	// Maybe want to keep history 
        // array of objects perhaps?
        return this.settings = newSettings; 
    },
    
    getFile: function( dest ){
	
	grid.mongo  = mongoose.mongo;
        var conn    = mongoose.createConnection(config.db);
        var options = {_id: this.file.id, root: 'uploads'};    
	
	conn.once('open', function () {
	    var gfs = grid(conn.db);
	    gfs.createReadStream( options ).pipe(dest);
        });

	this.metaData.views += 1;
    },
    
    viewableTo: function( entity ){ 
        var fileContainer = this;
        
        // Is file public 
	if( fileContainer.visibility === 'PUBLIC') return true;

        // Does entity exist and is it an entity
        if( !entity || typeof( entity ) !== 'object' || !entity._id ) return false ;

	// Entity is owner 
        // Stringify and compaire because we don't know if `entity._id` will be ObjectID or String	
	if( String( fileContainer.parent.id ) === String( entity._id ) &&
	    fileContainer.parent.collectionName === entity.__t ) return true;
	
        // File is private and entity is on the shared list
        var idIndex         = fileContainer.sharedWith.map( function(e){ return e.id } ).indexOf( entity._id );
	var collectionIndex = fileContainer.sharedWith.map( function(e){ return e.collectionName } ).indexOf( entity.__t );
	
        if( idIndex === collectionIndex && idIndex !== -1 ) return true
        
	return false;
        // TODO: Error checking for not public or private 
    }
    
});

//FileContainerSchema.pre('init', function(next){
  //  console.log)

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
	    
	    fs.createReadStream(fileContainer.file.path).pipe(writestream);
	    
	    // May want to keep some files around
	    if( !fileContainer.keepFile ) fs.unlinkSync(fileContainer.file.path);	    
	});
    }
    
    next();
});

// Before a user deletes their account, remove all of their files and directory

FileContainerSchema.pre('remove', function(next) {
    var fileContainer = this;
    
    grid.mongo = mongoose.mongo;
    var conn   = mongoose.createConnection(config.db);
    var fileQuery = {_id: fileContainer.file.id, root: 'uploads'};
    
    // Delete file
    conn.once('open', function () {
	grid(conn.db).remove( fileQuery, function (err) {
	    if (err) return handleError(err);
	    // console.log('File removed', options._id);
	});	
    });
    
    // pop pop pop
    // while( fileContainer.comments.length !== 0 ){
    // console.log('Deleting file', fileContainer.comments[0]);
    // fileContainer.removeComment( user.files[0] );
    // };     
    
    next();
});

module.exports = mongoose.model('FileContainer', FileContainerSchema);
