// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

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
    datasetIDs:      { type: [], default: [] },                      // List of mongoId for data sets
    notifications:   { new: [], all: [] },                           // List of new and all notifications, hide this
    settings         : {
	defaultVisibility: {type: String, default: 'PRIVATE'},
	accountVisivility: {type: String, default: 'PRIVATE'}  
    }    
});


UserSchema.method({

    // Saves dataset's ID in the users list of datasets
    attachFile: function(fileID){
	// Trusts that the ID given is real 
	// TODO: ensure ID is real
	//
	// Returns the result of push. 

	return this.dataSetIDs.push(fileID);
    },

    // Removes a dataset from the user's list of datasets
    deleteDataSet: function(dataSetID){
	// Returns the result of push. 
	
	var index = this.dataSetIDs.indexOf( dataSetID );
	if( index !== -1 ){
	    
	    // Return deleted IDs. All other IDs left untouched
	    return this.dataSetIDs.splice( index, 1);
	} else {
	    // Err: just return empty array
	    return [];
	}
    },

    // Add new notification to list of all notifications
    addNotification: function(notificationID){
	// Trusts that the ID given is real 
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
    
    deleteNotifications: function(notificationID){
	var index = this.notifications.new.indexOf( notificationID );
	if( index !== -1 ){
	    
	    // Return deleted IDs. All other IDs left untouched
	    return this.notifications.new.splice( index, 1);
	} else {
	    // Err: just return empty array
	}

	index = this.notifications.all.indexOf( notificationID );
	if( index !== -1 ){
	    
	    // Return deleted IDs. All other IDs left untouched
	    return this.notifications.all.splice( index, 1);
	} else {
	    // Err: just return empty array
	    return [];
	}
	
    },

    updateEmail: function( newEmail ){
	// Log
	this.email = newEmail;
    },
    

    /******* Security *******/
    generateHash: function(password) {

	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },
    
    validPassword: function(password) {

	return bcrypt.compareSync(password, this.local.password);
    }
});
				 
// Update dates 
UserSchema.pre('save', function(next) {
    // Before every user.save()... keep track of when a save took place
    this.lastUpdated = Date.now();

    next();
});

// Before a user deletes their account, remove all of their files and directory
UserSchema.pre('remove', function(next) {
    // Delete datasets
    // Delete directory    
    
    // Goodby user! 
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
