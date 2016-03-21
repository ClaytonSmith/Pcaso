'user strict'

var formidable            = require('formidable');
var mongoose              = require('mongoose');
var grid                  = require('gridfs-stream');
var fs                    = require('fs');
var util                  = require('util');
var multipart             = require('multipart');
var config                = require('../../config/config');
var async                 = require('async');
var mailer                = require('../../config/mailer');
 
var AccountRecovery       = mongoose.model('UnlockAccount');
var Users                 = mongoose.model('User');


exports.requestRecoveryEmailForm = function(req, res){
    // Send the user on there way, they do not 
    // need to wait for the rest of the stuff to happen
    if( req.isAuthenticated() ) return res.redirect('/profile');
    else res.render('account-recovery-form', { user: req.user });
}

exports.requestRecoveryEmail = function(req, res){
    
    // Send the user on there way, they do not 
    // need to wait for the rest of the stuff to happen

    if( req.isAuthenticated() ) return res.redirect('/profile');
    else res.render('account-recovery-confirmation-sent', {user: req.user, email: req.body.email });
    
    // Query for the user
    var query = {
	email: req.body.email
    };

    // Find user in question by given email
    Users.findOne( query , function(queryErr, user){
	if( queryErr ) {
	    res.redirect('/500');
	    throw new Error( queryErr );
	}
	if( !user ) return res.redirect('/'); // Do nothing
	
	// Create recovery doc. Remember, it will expire after some time
	var recoveryDoc = AccountRecovery.register(user);	
	
	// save recovery doc
	recoveryDoc.save(function(saveErr){
	    if( saveErr ) {
		res.redirect('/500');
		throw new Error( saveErr );
	    }   

	    // Only one recovery doc can be assigned.
	    // An error will be thrown if users make multiple requests
	    // This type of behavior is ok so we ignore errors
 	    //if( saveErr ) throw new Error( saveErr );
	    
	    // send email to user's email 
	    mailer.useTemplate('password-recovery', user, {recovery: recoveryDoc}, function(mailErr){
		if( mailErr ) throw new Error( mailErr );
	    });
	});
    });
}

exports.resetAccountPasswordForm = function(req, res){ 
    if( req.isAuthenticated() ) return res.redirect('/profile');
    else res.render('password-reset-form', { user: req.user, recoveryID: req.params.recoveryID }); 
}

exports.resetAccountPassword = function(req, res){
    
    // If a user is logged in, they should not 
    // be accessing this page. Send them away
    if( req.isAuthenticated() )
	return res.redirect('/403'); // 403 or maybe profile
    
    
    var recoveryQuery = {
	_id :  req.params.recoveryID
    }	
    
    // Find the recovery Doc 
    AccountRecovery.findOne( recoveryQuery, function( recErr, recoveryDoc){
	if( recErr ) {
	    res.redirect('/500');
	    throw new Error( recErr );
	}
	
	if( !recoveryDoc ) return res.redirect('/404');
	
	// Get the ID from the recovery Doc
	// Get the email from the user
	var userQuery = {
	    _id: recoveryDoc.parent.id,
	    email: req.body.email.toLowerCase() // only lowercase emails are stored in the DB 
	};
	
	// If the ID and email do not belong to the same user account,
	// then no user will be found.
	Users.findOne(userQuery, function(userErr, user){
	    if( userErr ){
		res.redirect('/500');
		throw new Error( userErr );
	    }
	    if( !user ) return res.redirect('/404');

	    user.password = Users.generateHash( req.body.password );
	    
	    // save user with new password
	    user.save(function(userSaveErr){
		if( userSaveErr ) {
		    res.redirect('/500');
		    throw new Error( userSaveErr );
		}
		
		// Redirect after save to ensure update
		res.redirect( '/sign-in' );
		
		// Remove recovery doc as it no longer needed
		recoveryDoc.remove(function(removeErr){
		    if( removeErr ) throw new Error( removeErr );
		});
	    }); 
	});
    });
}

