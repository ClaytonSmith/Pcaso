'use strict'

var formidable        = require('formidable');
var mongoose          = require('mongoose');
var util              = require('util');
var extend            = require('mongoose-schema-extend')
var async             = require('async');
var mongoosePaginate  = require('mongoose-paginate');

var config            = require('../../config/config');
var asyncRemove       = require('../helpers/async-remove');
//var BaseSchema   = mongoose.model("BaseSchema");

var NotificationSchema = new mongoose.Schema({
    dateAdded:   { type: Number,  default: Date.now },     // Join date
    lastUpdated: { type: Number,  default: Date.now },     // Last seen
    parent: {                                                 // Entity being notified
        collectionName: { type: String,  required: true },    // collection
        id:             { type: String,  required: true }     // id
    },
    event: {                                                  // Event that warrented a notification
	collectionName: { type: String,  required: true },    // collection
	id:             { type: String,  required: true }     // id
    },
    title:       { type: String,  required: true },
    links:{
	link:        { type: String,  required: true },           // Link to the event
	local:        { type: String,  required: true },           // Link to the event
    },
    read:        { type: Boolean, default: false }
}).extend({});

NotificationSchema.plugin(mongoosePaginate);

//NotificationSchema

NotificationSchema.static({
    
    // Title is optional
    
    register: function(parent, event, title){

	
	var note = new this({      
	    parent: {
		id: ( parent.parent || parent ).id || parent._id,
		collectionName: ( parent.parent || parent ).collectionName || parent.__t, 
	    },
	    event: {
		id: event._id,
		collectionName: event.__t
	    },	
	    title: title,
	    links: {
		link: event.links.link,
		local: event.links.local
	    }
	});
	
	return note;
    }    
});

// Update dates 
NotificationSchema.pre('save', function(next) {
    var note = this;
    var parentCollection = null;
   
    note.lastUpdated = Date.now();    
    
    if( note.isNew ){
	parentCollection = mongoose.model( note.parent.collectionName );
	parentCollection.findOne( { _id: note.parent.id }, function( err, doc ){
	    if( err || !doc ) next( err, doc );
	    doc.addNotification( note._id );
	    
	    // Not really sure what this does but Stack-O claims it helps with
	    // multiple instances of document being checked-out. Need to investigate
	    doc.markModified("notifications");
	       
	    doc.save( next );
	});

    } else next();
});

NotificationSchema.pre('remove', function(next) {

    var note = this;

    var parentCollection  = mongoose.model( note.parent.collectionName );    
    function deleteFrom( collection, searchQuery, callback ){
        collection.findOne( { _id: searchQuery }, function( err, doc ){
            
            if( err ) return callback( err );
	    
            // Parent has been removed
            if( !doc ) return callback( null );
            
            // Make sure doc deletes the comment
            // if doc is the caller, then the comment has allready been deleted.
	    doc.deleteNotification( note._id );
	    doc.save( callback );
        });
    };

    
    async.parallel(
	[
	    function(parellelCB){
		deleteFrom( parentCollection, note.parent.id, parellelCB );
	    }	    
	], next );	    
});

module.exports = mongoose.model('Notification', NotificationSchema);
