'use strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var util         = require('util');
var extend       = require('mongoose-schema-extend')
var async        = require('async');
var config       = require('../../config/config');
var mailer       = require('../../config/mailer');
//var BaseSchema   = mongoose.model("BaseSchema");

var NotificationSchema = new mongoose.Schema({
    dateAdded:      { type: Number,  default: Date.now },     // Join date
    lastUpdated:    { type: Number,  default: Date.now },     // Last seen
    regarding: {                                                 // who left comment
        collectionName: { type: String,  required: true },    // collection
        id:             { type: String,  required: true }     // id
    },
    target: {                                                 // What comment is on
        collectionName: { type: String,  required: true },    // collection
        id:             { type: String,  required: true }     // id
    },
    subject:    { type: String, default: '' },            // Used to generate the title
    title:      { type: String, required: true },
    read:       { type: Boolean, default: false },
    settings: {
        acceptFiles:   { type: Boolean, 'default': true },
        commentable:   { type: Boolean, 'default': false }
    }
}).extend({});

var notificationTitleDict = {
    "TEST": "Title used for testing",
    "USER_AUTH" : "Welcome to Pcaso" ,
    "COMMENT": "New comment"
}

NotificationSchema.method({
   
});

NotificationSchema.static({
    register: function(entity, subject, regarding, customTitle){
	var notification = new this({
	    target: {
		id: entity._id,
		collectionName: entity.__t
	    },
	    regarding: {
		id: regarding._id,
		collectionName: regarding.__t
	    },
	    subject: subject,
	    title: customTitle || notificationTitleDict[ subject ]
	});
	
	entity.addNotification( notification._id );
	
	return notification;
    },
    
    getTitleDict: function(){
	return notificationTitleDict;
    }
});

NotificationSchema.pre('save', function( next ){
    var notification = this;
    notification.lastUpdated = Date.now();

    if( notification.isNew ){
	// Goes in save
	if( notification.regarding === "USER_AUTH" ){

	    // Model should be User or Unauthenticated user
	    var model = mongoose.model( target.collectionName );
	    
	    model.findOne( { _id: target._id }, function(err, doc){
		if( err || !doc ) next( err, doc );	
		
		mailer.useTemplate( 'test', doc, next) ;
	    });
	} else{ 
	    next( null );   
	}
    }
})


module.exports = mongoose.model('Notification', NotificationSchema);
