'user strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var grid         = require('gridfs-stream');
var fs           = require('fs');
var util         = require('util');
var multipart    = require('multipart');
var config       = require('../../config/config');

// Load other models
var Users          = mongoose.model('User');
var FileContainers = mongoose.model('FileContainer');

grid.mongo = mongoose.mongo;
var conn   = mongoose.createConnection(config.db);

exports.deleteAccount = function(req, res){
    console.log('Account being deleted');
    
    req.user.remove();
    req.logout();
    res.redirect('/');
}

// deletion link:
exports.deleteFile = function(req, res){
    req.user.deleteFile( user.req.params.fileID )	
    res.send(200);
}

// API: can delete many files at once
exports.deleteFiles = function(req, res){
    // is owner?
    // log
    Users.find({_id: req.body ._id}, function(err, user){
	if( err || !user ) return handleError( err );
	req.body.files.forEach( function(file){ user.deleteFile( file ); });	
	res.send(200);
    });
}

exports.displayAccountPage = function(req, res){
    var username = req.params.username;
    
    console.log(req.isAuthenticated());
    
    User.find({})
    res.render('profile.ejs', {
        user : req.user
    });
}


