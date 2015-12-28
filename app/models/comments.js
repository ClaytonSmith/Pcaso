'use strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var util         = require('util');
var config       = require('../../config/config');

var CommentSchema = mongoose.Schema({
    parentID:   { type: Object, required: true },
    subjectID:  { type: Object, required: true },
    childeren:  { type: [ ],    required: true },
    body:       { type: String, required: true },
});


CommentSchema.method({
    
});
