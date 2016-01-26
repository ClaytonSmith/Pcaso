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
    subject:    { type: String,  required: true },
    link:        { type: String,  required: true },
}).extend({});


//NotificationSchema
