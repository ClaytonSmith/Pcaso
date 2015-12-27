// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var FileContainers = mongoose.model('FileContainer');

// define the schema for our user model
var UserSchema = mongoose.Schema({
    
    // User accound and reg
    local: {
        email: String,
        password: String
    },
    facebook: {
        id: String,
        token: String,
        email: String,
        name: String
    },
    twitter: {
        id: String,
        token: String,
        displayName: String,
        username: String
    },
    google: {
        id: String,
        token: String,
        email: String,
        name: String
    },
    userInformation: {
	firstName: String,
	lastName: String,
	avitar: String	
    },

    // account info 
    dateAdded:       { type: Number, default: Date.now },            // Join date
    lastUpdated:     { type: Number, default: Date.now },            // Last seen
    fileIDs:         { type: [], default: [] },                      // List of mongoId for containers
    notifications:   { new: [], all: [] },                           // List of new and all notifications, hide this
    comments:        { type: [], default: [] },                      // Comments left by user
    settings: {
	defaultVisibility: {type: String, default: 'PRIVATE'},
	accountVisivility: {type: String, default: 'PRIVATE'}  
    }    
});


UserSchema.method({

    // Saves file's ID in the users list of files
    attachFile: function(fileID){
	// Trusts that the ID given is real 
	// TODO: ensure ID is real
	//
	// Returns the result of push. 

	return this.fileIDs.push(fileID);
    },

    // Removes a file from the user's list of files
    deleteFile: function(fileID){
	console.log('USER: in deleteFile');
	var index = this.fileIDs.indexOf( fileID );
	if( index !== -1 ){
	    // log
	    
	    FileContainers.find({ _id: fileID }).remove().exec();
	    
	    // Return deleted IDs. All other IDs left untouched
	    return this.fileIDs.splice( index, 1);
	} else {
	    // Err: just return empty array
	    return [];
	}
    },
    
    // Add new notification to list of all notifications
    addNotification: function(notificationID){
	// Trust that the ID given is real 
	// TODO: ensure ID is real
	//
	// Returns the result of push. 
	
	this.notifications.new.push(notificationID);
	this.notifications.all.push(notificationID);
	
	return null;
    },
    markNotificationAsRead: function(notificationID){
	var index = this.notifications.new.indexOf( notificationID );
	if( index !== -1 ){
	    
	    // Return deleted IDs. All other IDs left untouched
	    return this.notifications.new.splice( index, 1);
	} else {
	    // Err: just return empty array
	    return [];
	}
    },
    
    deleteNotification: function(notificationID){
	var index;
	
	// Remove from new notifications array
	index = this.notifications.new.indexOf( notificationID );
	if( index !== -1 )
	    this.notifications.new.splice( index, 1);
    	
	// Remove from general notifications array 
	index = this.notifications.all.indexOf( notificationID );
	if( index !== -1 ){
	    
	    //Commentes.find({ _id: notificationID }).remove().exec();
	    
	    // Return deleted IDs. All other IDs left untouched
	    return this.notifications.all.splice( index, 1);
	} else {
	    // Err: just return empty array
	    return [];
	}
    },
    updateEmail: function( newEmail ){
	this.email = newEmail;
    },
    
    /******* Security *******/
    generateHash: function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },
    
    validPassword: function(password) {
	return bcrypt.compareSync(password, this.local.password);
    },
    
    isTempAccount: function(){
	return false;
    }
});
				 
// Update dates 
UserSchema.pre('save', function(next) {
    this.lastUpdated = Date.now();

    next();
});

// Before a user deletes their account, remove all of their files and directory
UserSchema.pre('remove', function(next) {
    console.log('USER: in remove')
    var user = this;
    
    user.fileIDs.forEach( function(file){
	// delete every file
	user.deleteFile( file );
    }); 
    
    //user.notifications.new.forEach( function(notification){
    // delete every notification 
    //user.deleteNotification( notification );
    //}); 

    //user.comments.forEach( function(comment){
    // delete every comment 
    //user.deleteComment( comment );
    //});

    next();
});



// hides sensitive information
// Used when sharing data externaly
/*
  ToDo: http://stackoverflow.com/questions/11160955/how-to-exclude-some-fields-from-the-document

  userSchema.methods.clean = function() {
    var cleanData = this.toObject();

    delete cleanData.password;
    
    return cleanData;
} */

// create the model for users and expose it to our app
module.exports = mongoose.model('User', UserSchema);
