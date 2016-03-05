'use strict'

var mongoose     = require('mongoose');
var util         = require('util');
var extend       = require('mongoose-schema-extend')

var config       = require('../../config/config');

//var BaseSchema   = mongoose.model("BaseSchema");

var UnlockSchema = new mongoose.Schema({
    dateAdded:      { type: Date,  default: Date.now, expires: config.accounts.passwordRecoveryExpiration * 60 * 60 }, // hours until document removal }
    lastUpdated:    { type: Date,  default: Date.now },         // Last seen
    
    parent: {
        collectionName:  { type: String,  required: true },     // collection
        id:              { type: String,  required: true, unique: true, dropDups: true }, // Uniquenes ensures only one unclock doc per account
	name:            { type: mongoose.Schema.Types.Mixed, default: undefined }, // name
    },
    links: {
	parent:          { type: String,  required: true },
	link:            { type: String,  required: true, unique: true },        // Unique links prvent users from having two files with 
	local:           { type: String,  required: true, unique: true }         // files with the same name having the same link
    }
    
}).extend({});


UnlockSchema.method({    
    
});

UnlockSchema.static({
    register: function(user){

	var documentId = mongoose.Types.ObjectId();        		
	var recoveryDoc = new this({
	    _id: documentId,
	    parent: {
		id: user.id,
		collectionName: user.__t,
		name: user.name
	    },
	    links: {
		parent: user.links.local,
		link: config.service.domain +"recover-account/"+ documentId,
		local: "/recover-account/"+ documentId
	    }
	});

	return recoveryDoc;
    }
});

UnlockSchema.set('versionKey', false);

UnlockSchema.pre('save', function( next ){
    var unlock = this;
    unlock.lastUpdated = Date.now();    
    next();
});

                  
UnlockSchema.pre('remove', function( next ){
    console.log('I am being removed! WOW');
    next();
});

module.exports = mongoose.model('UnlockAccount', UnlockSchema);
