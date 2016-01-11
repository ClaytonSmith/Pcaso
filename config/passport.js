// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;
var Async            = require('async');

//var OpenIDStrategy   = requrie('passpot-openid').Strategy;
// load up the user model


var mongoose     = require('mongoose');


var Users                         = mongoose.model('User');
var UnauthenticatedUsers          = mongoose.model('UnauthenticatedUser');

// load the auth variables
var configAuth                    = require('./auth'); // use this one for testing

module.exports = function(passport) {

    //===========================================================================
    //= passport session setup ==================================================
    //===========================================================================
    // used to serialize the user
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        Users.findById(id, function(err, user) {
            done(err, user);
        });
    });
    
    //===========================================================================
    //= LOCAL LOGIN =============================================================
    //===========================================================================
    passport.use('local-login', new LocalStrategy(
	{
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true
	},
	function(req, email, password, done) {
	    if (email)	    
		process.nextTick(function() {
		    Users.findOne({ 'email' : email.toLowerCase() }, function(err, user) {
			
			if (err) return done(err);
			
			if (!user) return done(null, false, req.flash('loginMessage', 'Bad email or password.'));
			
			if (!user.validPassword(password)) return done(null, false, req.flash('loginMessage', 'Bad email or password.'));
			
			return done(null, user);
		    });
		});
	}));
    
    passport.use('local-signup', new LocalStrategy(
	{
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true
	},
	function(req, email, password, done){
	    if (email)
		process.nextTick(function() {
		    if (!req.user) {	
			
			Async.parallel(
			    [
				// Search users for email
				function(callback){
				    var query = Users.findOne({ 'email' : email.toLowerCase() })
				    query.exec(function(err, user) {
					if(err) callback( err );
					callback( null, user);
				    });
				},
				
				// Search UnauthenticatedUsers for email 
				function(callback){
				    var query = UnauthenticatedUsers.findOne({ 'email' : email.toLowerCase() })
				    query.exec(function(err, user) {
					if(err) callback( err );
					callback( null, user);
				    });
				},
			    ],
			    
			    // Gather the results from the callbacks
			    function(err, results){
				if( err ) return done(err); 
				
				// Make sure no users exist in users or unauthenticated users with this email
				if( !results.reduce(function(predicate, result){ return predicate && result === null; }, true) )
				    return done(null, false, req.flash('signupMessage', 'That email is already in use.')); 
				
				// Make account
				var newUser         = new UnauthenticatedUsers();
				
				console.log('REQ BODY**************************\n', req.body)
				newUser.email       = email.toLowerCase();
				newUser.password    = newUser.generateHash(password);
				newUser.name.first  = req.body.firstName;
				newUser.name.last   = req.body.lastName;
				
				newUser.save(function(err) {
				    if (err) return done(err);    
				    return done(null, newUser); 
				});
				

				console.log('/authenticate-account/' + newUser._id );
				//return done(null, false, req.flash('signupMessage', 'That email is already in use.')); 
				console.log('Time to send the email');
				// Send email
			    });
			
			// if the user is logged in but has no local account...
		    } else if ( !req.user.email ) {
			
			console.log('CASE 3 of signup');
			console.log('if the user is logged in but has no local account...');
			
			Users.findOne({ 'email' :  email.toLowerCase() }, function(err, user) {
			    if (err) return done(err);

			    if (user) return done(null, false, req.flash('loginMessage', 'That email is already taken.'));
			    
			    var user       = req.user;
			    
			    user.email     = email.toLowerCase();
			    user.password  = user.generateHash(password);
			    user.name      = req.user.name;
			    
			    user.save(function (err) {
				if (err) return done(err);
				return done(null,user);
			    });
			    
			    // email
			    
			});
		    } else {
			// user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
			return done(null, req.user);
		    }
		});
	}));
};

