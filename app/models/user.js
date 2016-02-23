'use strict'

// load the things we need
/*
  File containes two schemas: user and unauthenticatedUser
  
  An unauthenticated user contains the same fields as the regular user
  but has none of the associated methods. Being an unauthenticated user 
  means that the a user has registered but has not cliked the registration link 
  sent via email. Unauthenticated users will be unable to do anything until
  they click the registration link.

  Users can:
  
  - add files
  - remove files 
  - transfer ownership of files 
  - add comments
  - remove comments
  - 


*/



var mongoose          = require('mongoose');
var bcrypt            = require('bcrypt-nodejs');
var extend            = require('mongoose-schema-extend');
var async             = require('async');
var config            = require('../../config/config');
var mailer            = require('../../config/mailer');
var asyncRemove       = require('../helpers/async-remove');
var copyFiles         = require('../helpers/copy-files');
var mongoosePaginate  = require('mongoose-paginate');
var util              = require('util');
var mkdirp            = require('mkdirp');
var rimraf            = require('rimraf');

var FileContainers    = mongoose.model('FileContainer');
var Comments          = mongoose.model('Comment');
var Notification      = mongoose.model('Notification');


var BaseUserSchema = new mongoose.Schema({// BaseSchema.extend({    
    // User accound and reg

    dateAdded:      { type: Number,  default: Date.now },            // Join date
    lastUpdated:    { type: Number,  default: Date.now },            // Last seen
    
    // Personal data
    email:          { type: String,  required: true, unique : true, dropDups: true },
    password:       { type: String,  required: true },
    name: { 
        first:          { type: String, required: true },
	last:           { type: String, required: true }
    },
    username: { type: String,  required: true, unique : true, dropDups: true },
});

var UnauthenticatedUserSchema  = BaseUserSchema.extend({});

UnauthenticatedUserSchema.plugin(mongoosePaginate);

UnauthenticatedUserSchema.method({

    /******* Security *******/
    generateHash: function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },
    
    validPassword: function(password) {
	return bcrypt.compareSync(password, this.password);
    }
});


// Regular users can have files
var UserSchema                 = BaseUserSchema.extend({
    googleCredentials: {
	accessToken:          { type: String, unique: true },                        // List of mongoId for containers	
	accessTokenSecret:    { type: String, unique: true }                         // List of mongoId for containers	
    }, 
    files:          { type: [], default: [] },                        // List of mongoId for containers
    fileSettings: {
	defaults: {
	    visibility:  { type: String,  'default': 'PUBLIC'},      // default file visibility, set for every future upload
	    commentable:        { type: Boolean, 'default': true }    // default commenting on account
	},
    },
    comments:       { type: [], default: [] },                        // List of mongoId for comments left by user
    userComments:   { type: [], default: [] },                        // List of mongoId for comments left by user
    notifications:  { type: [], default: [] },                        // List of new and all notifications, hide this
    localDataPath:  { type: String, default: '' },
    publicDataPath: { type: String, default: '' },    
    profileSettings: {
	displayEmail: { type: Boolean, default: true }
    },
    links: {
	avatar:        { type: String, default: '' },
	link:          { type: String, required: true },
	local:         { type: String, required: true }
    }	
});

UserSchema.plugin(mongoosePaginate);

// Unregistered users dont get these cool features. They get nothing 
UserSchema.method({

    attachFile: function(fileID){
	return this.files.push( fileID );
    },

    // Saves file's ID in list of files
    registerFile: function(file, settings, callback){

	var user = this;
	var options = JSON.parse(JSON.stringify( settings ));
	
	// deep copy 
	options.displaySettings = JSON.parse(JSON.stringify( settings.displaySettings || {} )) ;
	options.fileOptions     = JSON.parse(JSON.stringify( settings.fileOptions     || {} )) ;
	
	options.displaySettings.visibility = options.displaySettings.visibility 
	    || this.fileSettings.defaults.visibility;

	var fileContainer = FileContainers.register(this, file, options);

	fileContainer.save(function(err){
	    if( err ) callback( err ) ;
	    
	    user.attachFile( fileContainer._id );
	    callback( null );	    
	});
	
	return fileContainer;
    },
    
  
    // Removes a file from the user's list of files    
    deleteFile: function( fileID ){
        var index = this.files.indexOf( fileID );
        return ( index >= 0 ) ? this.files.splice( index, 1) : [] ; 
    },
    
    // file will be removed from DB
    removeFile: function(fileID, callback){	
        var deleted = this.deleteFile( fileID, callback );        
        if( deleted.length ){
	    FileContainers.findOne({ '_id': fileID, 'parent.id': this._id }, function(err, doc){
		if( err  ) return callback( err );
		if( !doc ) return callback( null );
		doc.remove( callback );
	    });
	} else {
	    callback( null );
	}
	    
	return deleted;
    },

    // Adds new comment ID to list of comments IFF commenting is enabled
    addComment: function(commentID){
	return this.comments.push( commentID );
    }, 
    
    leaveComment: function( entity, subject, commentBody, callback ){
	var user = this;
	var comment = Comments.register( user, entity, this.username, subject, commentBody);
	
	comment.save(function(err){
	    if( err ) callback( err ) ;
	    user.userComments.push( comment._id );	
	    
	    entity.save( function(entSaveErr){
		if( entSaveErr ) callback( entSaveErr ) ;	
		
		if( entity._id.toString() === user._id.toString() ||
		    ( entity.parent || {}).id === user._id.toString() ){
		    
		    // Relax, user is commenting on there own stuff. No 
		    // need to bother them with emails and other notifications.
		    
		    return callback( entSaveErr );	
		}
		
		// Full name
		//var notificationTitle = user.name.first +" "+ user.name.last +" has commented on your " + Comments.commentMap( entity.__t );
		
		// Username
		var notificationTitle = user.username +" has commented on your " + Comments.commentMap( entity.__t );


		var notification = Notification.register( entity, comment, notificationTitle );

		notification.save( function(noteSaveErr){
		    if( noteSaveErr ) throw new Error(noteSaveErr);
		    
		    callback( noteSaveErr );
		    if( entity.__t === "User" ){
			// Entity is a user account,
			// We do not need to query for it
			
			mailer.useTemplate('new-comment', entity, {comment: comment, notification: notification}, function(mailErr){
			    if( mailErr ) throw new Error( mailErr );
			});
			
		    } else { 
			// Entity is not a user so the parent must be queried
			
			var model = mongoose.model(entity.parent.collectionName);
			model.findOne({_id: entity.parent.id}, function(qreErr, doc){
			    if( qreErr ) throw new Error( qreErr );
			    mailer.useTemplate('new-comment', doc, {comment: comment, notification: notification}, function(mailErr){
				if( mailErr ) throw new Error( mailErr );
			    });
	    		});
		    }
		});		
	    });
	});
	
	return comment;
    },
    
    deleteComment: function( commentID ){
	
	var indexA = this.comments.indexOf( commentID );     
	var indexB = this.userComments.indexOf( commentID );
	
	var deletedA = ( indexA >= 0 ) ? this.comments.splice( indexA, 1) : [ ] ;
	var deletedB = ( indexB >= 0 ) ? this.userComments.splice( indexB, 1) : [ ] ;
	
	return deletedA.concat( deletedB );
    },
    
    
    removeComment: function(commentID, callback){	
	var deleted = this.deleteComment( commentID );
	
	if( deleted.length > 0 ){
	    Comments.findOne( { _id: commentID }, function(err, doc){
		if( err || !doc ) return callback( err, doc );		
		doc.remove( callback );
	    });       
	} else  callback( null );
	
	return deleted;
    },
    
    // Add new notification to list of all notifications
    addNotification: function(notificationID){
        this.notifications.push( notificationID );
    },
    
    markNotificationAsRead: function(notificationID, callback){
        Notifications.findOne({ _id: notificationID }, function( err, doc ){
            if( err || !doc ) return callback( err, doc );
            doc.read = true;
            doc.save( callback );
        });
    },
    
    // remove notification ID from notification list
    deleteNotification: function(notificationID){
        var index = this.notifications.indexOf( notificationID );
        return ( index >= 0 ) ? this.notifications.splice( index, 1): []; 
    },
    
    // deletes the notification 
    removeNotification: function(notificationID, callback){
	var user = this;
	var deleted = user.deleteNotification( notificationID );
	if( deleted.length > 0 ){
	    Notification.findOne( { _id: notificationID }, function(err, doc){
		if( err || !doc ) return callback( err, doc );		
		doc.remove( callback );
	    });
	} else callback( null );	
	
	return deleted;
    },
    
    // updateEmail: function( newEmail ){
    // MAYBE: Send authentication email to users old email account
    // confirming the change
    // this.email = newEmail;
    /// },

    /******* Security *******/
    generateHash: function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },
    
    validPassword: function(password) {
	return bcrypt.compareSync(password, this.password);
    }

});

UnauthenticatedUserSchema.static({
    /******* Security *******/
    generateHash: function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },
    
    validPassword: function(password) {
	return bcrypt.compareSync(password, this.password);
    },

    register: function(first, last, email, pass, username){
	var user = new this({
	    name: {
		first: first,
		last: last,
	    },
	    email: email,
	    password: this.generateHash( pass ),
	    username: username
	});	
	
	return user;
    }   
});

UserSchema.static({
    /******* Security *******/
    generateHash: function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },
    
    validPassword: function(password) {
	return bcrypt.compareSync(password, this.password);
    },

    register: function( first, last, email, pass, username){
	var user = new this({
	    name: {
		first: first,
		last: last,
	    },
	    email: email,
	    password: this.generateHash( pass ),
	    username: username,
	    localDataPath:  config.root +'/public/users-public-data/'+ username,
	    publicDataPath: config.service.domain +'users-public-data/'+ username,
	    links: {
		avatar: config.service.domain +'users-public-data/'+ username +'/imgs/avatar',	   
		link:   config.service.domain + "user/" + username,
		local:  "/user/" + username
	    }
	});	
	
	return user;
    },

    convert: function(unauthenticatedUser){

	var user = new this({
	    name: {
		first: unauthenticatedUser.name.first,
		last:  unauthenticatedUser.name.last,
	    },
	    email: unauthenticatedUser.email,
	    password: unauthenticatedUser.password, // Pass is already encrypted 
	    username: unauthenticatedUser.username,
	    localDataPath:  config.root +'/public/users-public-data/'+ unauthenticatedUser.username,
	    publicDataPath: config.service.domain +'users-public-data/'+ unauthenticatedUser.username,
	    links: {
		avatar: config.service.domain +'users-public-data/'+ unauthenticatedUser.username +'/imgs/avatar',
		link:   config.service.domain + "user/" + unauthenticatedUser.username,
		local:  "/user/" + unauthenticatedUser.username
	    }
	});	
	
	return user;
    }
});

UserSchema.set('versionKey', false);
UnauthenticatedUserSchema.set('versionKey', false);

// Update dates 
UserSchema.pre('save', function(next) {
    var user = this;
    user.lastUpdated = Date.now();    


    
    // On first save
    if( user.isNew ){


	var publicDir = config.root + '/public/users-public-data/'+ user.username +'/';
	//create public directory for things like avatars
		
	async.series(
	[
	    function(parellelCB){
		// covers both images and avatar directory
		mkdirp( publicDir + "imgs/", parellelCB );
	    },
	    function(parellelCB){
		copyFiles( config.defaultAvatarPath, user.localDataPath +'/imgs/avatar', parellelCB );
	    }
	    
	], next );	    
		
    } else next();
});

// Before a user deletes their account, remove all of their files and directory
UserSchema.pre('remove', function(next) {
    var user = this; 

    async.parallel(
	[
	    function(parellelCB){
		asyncRemove.asyncRemove(user.comments, function(id, mapCB){    		
		    user.removeComment( id, mapCB );
		}, parellelCB );
	    },
	    
	    function(parellelCB){
		asyncRemove.asyncRemove(user.userComments, function(id, mapCB){
    		    user.removeComment( id, mapCB );
		}, parellelCB );
	    },
	    
	    function(parellelCB){
		asyncRemove.asyncRemove(user.files, function(id, mapCB){
    		    user.removeFile( id, mapCB );
		}, parellelCB );
	    },	
	    function(parellelCB){
		asyncRemove.asyncRemove(user.notifications, function(id, streamCB){
		    user.removeNotification( id, streamCB );
		}, parellelCB );
	    },
	    function(parellelCB){
		rimraf( user.localDataPath, parellelCB );
	    }
	    
	], next );	    
});


// hides sensitive information
// Used when sharing data externaly
/*
  ToDo: http://stackoverflow.com/questions/11160955/how-to-exclude-some-fields-from-the-document

  userSchema.methods.clean = function() {
  var cleanData = this.toObject();
  } */



// create the model for users and expose it to our app
module.exports = mongoose.model('User', UserSchema);

// User accounts are stored here untill they click the registration link
module.exports = mongoose.model('UnauthenticatedUser', UnauthenticatedUserSchema);
