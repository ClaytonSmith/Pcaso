// load the things we need
var mongoose       = require('mongoose');
var bcrypt         = require('bcrypt-nodejs');
var extend         = require('mongoose-schema-extend')
var FileContainers = mongoose.model('FileContainer');

var BaseUserSchema = mongoose.Schema({    
    // User accound and reg
    
    email:          { type: String, required: true },
    password:       { type: String, required: true },
    name: { 
        first:          { type: String, required: true },
	last:           { type: String, required: true }
    },
    dateAdded:      { type: Number, default: Date.now },            // Join date
    lastUpdated:    { type: Number, default: Date.now },            // Last seen
    fileIDs:        { type: [],     default: [] },                  // List of mongoId for containers
    comments:       { type: [],     default: [] },                  // Comments left by user
    notifications:  { new:  [], all: [] },                          // List of new and all notifications, hide this   
    settings: {
	defaultVisibility: {type: String, default: 'PRIVATE'},
	accountVisivility: {type: String, default: 'PRIVATE'}  
    }    
});

var UnauthenticatedUserSchema  = BaseUserSchema.extend({});
var UserSchema                 = BaseUserSchema.extend({});

UnauthenticatedUserSchema.method({
    /******* Security *******/
    generateHash: function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },
    
    validPassword: function(password) {
	return bcrypt.compareSync(password, this.password);
    }
});
    


UserSchema.method({

    // Saves file's ID in the users list of files
    attachFile: function(fileID){
	// Trusts that the ID given is real 
	// TODO: ensure ID is real
	//
	// Returns the result of push. 
	console.log('I should be called when adding a new file');
	return this.fileIDs.push(fileID);
    },

    // Removes a file from the user's list of files
    deleteFile: function(fileID){
	console.log('USER: in deleteFile', fileID);
	
	var index = this.fileIDs.indexOf( fileID );
	if( index !== -1 ){
	    // log
	    
	    FileContainers.findOne({ _id: fileID }, function(err, doc){
		console.log('Found the doc');
		doc.remove();
	    });
	    
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
	return bcrypt.compareSync(password, this.password);
    }

});

// Update dates 
UserSchema.pre('save', function(next) {
    this.lastUpdated = Date.now();

    next();
});

// Before a user deletes their account, remove all of their files and directory
UserSchema.pre('remove', function(next) {
    var user = this; 
    
    // Keep deleting util everything is gone
    // Can't use for( ) loop
    while( user.fileIDs.length !== 0 ){
	console.log('Deleting file', user.fileIDs[0]);
	user.deleteFile( user.fileIDs[0] );
    }; 
    
    // while( user.notifications.all.length !== 0 ){
    // 	console.log('Deleting notification', user.notifications.all.length[0]);
    // 	user.deleteNotification( user.notifications.all.length[0] );
    // }; 
    
    // while( user.comments.length !== 0 ){
    // 	console.log('Deleting comment', user.comment.length[0]);
    // 	user.deletecomment( user.comments.length[0] );
    // };


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

//});

// create the model for users and expose it to our app
module.exports = mongoose.model('User', UserSchema);

// User accounts are stored here untill they click the registration link
module.exports = mongoose.model('UnauthenticatedUser', UnauthenticatedUserSchema);
