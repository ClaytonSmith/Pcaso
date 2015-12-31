'user strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var grid         = require('gridfs-stream');
var fs           = require('fs');
var util         = require('util');
var multipart    = require('multipart');
var config       = require('../../config/config');

// Load other models
var Users                 = mongoose.model('User');
var UnauthenticatedUsers  = mongoose.model('UnauthenticatedUser');
var FileContainers        = mongoose.model('FileContainer');

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
    var query = { _id: req.body._id };
    
    Users.find( query, function(err, user){
	if( err ){
	    res.render('520.ejs'); 
	    return handleError( err );
	    
	} else if( !user ){
	    res.send('404.ejs');
	
	} else {

	    req.body.files.forEach( function(file){ user.deleteFile( file ); });	
	    res.send(200);
	}
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

// Moves user accounts from the 'Unauthenticated' collection to the regular user space 
exports.authenticateAccount = function(req, res){
    var query = { _id: req.params.authenticationCode };
    console.log( query );
    UnauthenticatedUsers.findOne( query, function(err, unauthenticatedUser){
	if( err ){
	    //res.render('520.ejs');
	    console.log('error :(');
	    res.render('index.ejs');
	    return handleError( err );
	    
	} else if( !unauthenticatedUser){
	    console.log('not found');
	    //res.render('404.ejs');
	    res.render('index.ejs');

	} else {
	    
	    // Copy unauthenticated user to regular user collection
	    var newUser = new Users( unauthenticatedUser );
	    
	    newUser.save(function(err) {
		if (err) return handleError( err );
	    });	    	    
	    
	    // Delete temp account
	    unauthenticatedUser.remove();
	    
	    res.render('login.ejs', {
		message: req.flash('loginMessage') 
	    });
	}
    });
}
