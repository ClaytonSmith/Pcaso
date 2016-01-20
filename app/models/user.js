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



var mongoose       = require('mongoose');
var bcrypt         = require('bcrypt-nodejs');
var extend         = require('mongoose-schema-extend');

//var BaseSchema     = mongoose.model('BaseSchema');
var FileContainers = mongoose.model('FileContainer');
var Comments       = mongoose.model('Comment');

var BaseUserSchema = new mongoose.Schema({// BaseSchema.extend({    
    // User accound and reg

    dateAdded:      { type: Number,  default: Date.now },            // Join date
    lastUpdated:    { type: Number,  default: Date.now },            // Last seen
    
    // Personal data
    email:          { type: String,  required: true },
    password:       { type: String,  required: true },
    name: { 
        first:          { type: String, required: true },
	last:           { type: String, required: true }
    }
});

var UnauthenticatedUserSchema  = BaseUserSchema.extend({});

// Regular users can have files
var UserSchema                 = BaseUserSchema.extend({
    files:          { type: [], default: [] },                        // List of mongoId for containers
    comments:       { type: [], default: [] },                        // List of mongoId for comments left by user
    userComments:   { type: [], default: [] },                        // List of mongoId for comments left by user
    notifications:  { type: [], default: [] },                         // List of new and all notifications, hide this       
    settings: {
	defaultVisibility:  { type: String,  'default': 'PRIVATE'},   // default file visibility, set for every future upload
	accountVisivility:  { type: String,  'default': 'PRIVATE'},   // Account visibility, who can see this profile
        commentable:        { type: Boolean, 'default': true },             // default commenting on account
        acceptFiles:        { type: Boolean, 'default': true }              // Will tell whether commenting is allowed, it is not by default
    }
});

UnauthenticatedUserSchema.method({

    /******* Security *******/
    generateHash: function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },
    
    validPassword: function(password) {
	return bcrypt.compareSync(password, this.password);
    }
});
    

// Unregistered users dont get these cool features. They get nothing 
UserSchema.method({

    attachFile: function(fileID){
	return this.files.push( fileID );
    },

    // Saves file's ID in list of files
    addFile: function(file, settings, callback){
	
	var user = this;
	var fileContainer = FileContainers.register(this, file, settings);
	
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
    removeFile: function(fileID){	
        var deleted = this.deleteFile( fileID );        
        if( deleted.length ){
	    FileContainers.findOne({ '_id': fileID, 'parent.id': this._id }, function(err, doc){
		
		if( err )  return handleError( err );
                if( !doc ) return true;
                doc.remove();
	    });
	}
        
	return deleted;
    },

    // Adds new comment ID to list of comments IFF commenting is enabled
    addComment: function(commentID){
        if( !this.settings.commentable ){	    
            //new Error( 'Commenting is not allowed on this object' );
	    return false;
	}
	
	// add notification
	
	return this.comments.push( commentID );
    },
    
    
    leaveComment: function( entity, subject, commentBody, callback ){
	var user = this;
	var comment = Comments.register( user, entity, this.name.first, subject, commentBody);

	comment.save(function(err){
	    if( err ) callback( err ) ;
	    
	    user.userComments.push( comment._id );	
	    
	    entity.save( callback );	    
	});
	
	return comment;
    },
    
    deleteComment: function( commentID ){
	//console.log('I %s have been asked to remove %s', this.name.first, commentID);
	var indexA = this.comments.indexOf( commentID );     
	var indexB = this.userComments.indexOf( commentID );
	
	var deletedA = ( indexA >= 0 ) ? this.comments.splice( indexA, 1) : [ ] ;
	var deletedB = ( indexB >= 0 ) ? this.userComments.splice( indexB, 1) : [ ] ;
	
	return deletedA.concat( deletedB );
    },
    
    
    removeComment: function(commentID, callback){	
	var deleted = this.deleteComment( commentID );
	
	if( deleted.length > 0 ){
	    Comments.findOne( {  _id: commentID }, function(err, doc){
		if( err  ) return callback( err );
		if( !doc ) return callback( null );
		
		//console.log('USER: calling remove on comment', deleted);
		doc.remove( callback );
	    });   
	    
	} else {
	    callback( null );
	}

	return deleted;
    },
    
    // Add new notification to list of all notifications
    addNotification: function(notificationID){
        this.notifications.push( notificationID );
	return null;
    },
    
    markNotificationAsRead: function(notificationID){
        // Notifications.findOne({ _id: notificationID }, function( err, doc ){
        // if( err ) return handleError( err );
        // if( !doc ) return true;
        // doc.read = true;
        // doc.save();
        // });
    },
    
    // remove notification ID from notification list
    deleteNotification: function(notificationID){
        var index = this.notifications.indexOf( notificationID );
        return ( index >= 0 ) ? notifications.splice( index, 1): []; 
    },
    
    // deletes the notification 
    removeNotification: function(notificationID){

        var deleted = this.deleteNotification( notificationID );
        
        if( deleted.length ){
            // Commentes.findOne({ _id: notificationID }function( err, doc ){
            // if( err ) return handleError( err );
            // if( !doc ) return true;
            // doc.remove();
	}
        
        return deleted;
    },
    
    updateEmail: function( newEmail ){
	
        // MAYBE: Send authentication email to users old email account
        // confirmiing the change
        this.email = newEmail;
    },
    
    /******* Security *******/
    generateHash: function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },
    
    validPassword: function(password) {
	return bcrypt.compareSync(password, this.password);
    }
});

// Update dates 
UserSchema.pre('save', function(next) {
    var user = this;
    user.lastUpdated = Date.now();    
    next();
});

// Before a user deletes their account, remove all of their files and directory
UserSchema.pre('remove', function(next) {
    var user = this; 
   
       // pop pop pop
    while( user.files.length !== 0 ){
	user.removeFile( user.files[0]);//, function(err){});
    };
    
    // pop pop pop
    while( user.comments.length !== 0 ){
	user.removeComment( user.comments[0], function(err){});
    }; 
    
    while( user.userComments.length !== 0 ){
	user.removeComment( user.userComments[0], function(err){});
    };
    
    
    // pop pop pop
    // while( user.notifications.all.length !== 0 ){
    //     console.log('Deleting notification', user.notification.all[0]);
    //     user.deleteNotification( user.notification.all[0] );
    // };

    // Remove comments left by user
    // Remove notifications
    
    // Send goodby email

    next();
});




// hides sensitive information
// Used when sharing data externaly
/*
  ToDo: http://stackoverflow.com/questions/11160955/how-to-exclude-some-fields-from-the-document

  userSchema.methods.clean = function() {
  var cleanData = this.toObject();

  delete cleanData.password;
x  
  return cleanData;
  } */

//});

// create the model for users and expose it to our app
module.exports = mongoose.model('User', UserSchema);

// User accounts are stored here untill they click the registration link
module.exports = mongoose.model('UnauthenticatedUser', UnauthenticatedUserSchema);
