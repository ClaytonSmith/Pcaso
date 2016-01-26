'use strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var util         = require('util');
var extend       = require('mongoose-schema-extend')
var async        = require('async');
var config       = require('../../config/config');

//var BaseSchema   = mongoose.model("BaseSchema");

var NotificationSchema = new mongoose.Schema({
    dateAdded:      { type: Number,  default: Date.now },     // Join date
    lastUpdated:    { type: Number,  default: Date.now },     // Last seen
    parent: {                                                 // Entity being notified
        collectionName: { type: String,  required: true },    // collection
        id:             { type: String,  required: true }     // id
    },
    event: {                                                  // Event that warrented a notification
	collectionName: { type: String,  required: true },    // collection
	id:             { type: String,  required: true }     // id
    },
    title:     { type: String,  required: true },
    link:        { type: String,  required: true },           // Link to the event
    read:        { type: Boolean, default: false }
}).extend({});


//NotificationSchema

NotificationSchema.static({
    
    // Title is optional
    register: function(parent, event, title){
	var note = new this({      
	    parent: {
		id: parent._id || parent.id,
		collectionName: parent.__t || parent.collectionName
	    },
	    event: {
		id: event._id,
		collectionName: event.__t
	    },	
	    title: title,
	    link: event.displaySettings.link
	});

	//parent.addNotification( note._id ); 
	
	return note;
    }    
});

// Update dates 
NotificationSchema.pre('save', function(next) {
    var note = this;
    note.lastUpdated = Date.now();    
    next();
});

module.exports = mongoose.model('Notification', NotificationSchema);
