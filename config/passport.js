// load all the things we need
var LocalStrategy         = require('passport-local').Strategy;
var Async                 = require('async');
var mongoose              = require('mongoose');

var Users                 = mongoose.model('User');
var UnauthenticatedUsers  = mongoose.model('UnauthenticatedUser');


var config                = require('./config');
// load the auth variables
var configAuth            = require('./auth'); // use this one for testing

var mailer                = require('./mailer');

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
        Users.findById(id, done );
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
	    if( email )	    
		process.nextTick(function() {
		    Users.findOne({ 'email' : email.toLowerCase() }, function(err, user) {
			
			if( err ) return done(err);
			
			if( !user ) return done(null, false, req.flash('signInMessage', 'Bad username or password.'));
			
			if( !user.validPassword(password)) return done(null, false, req.flash('signInMessage', 'Bad username or password.'));
			
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
	    console.log('Local signup');
	    if (email)
		
		process.nextTick(function() {
		    if (!req.user) {	
			var query = {
			    $or: [
				{ email : email.toLowerCase() },
				{ username: new RegExp( ["^", req.body.username, "$"].join(""), "i" ) } // Store the original but search for similar 
			    ]                   
			};
			
			Async.parallel(
			    [
				// Search users for email
				function(callback){
				    Users.findOne( query, callback );
				},
				
				// Search UnauthenticatedUsers for email 
				function(callback){
				    UnauthenticatedUsers.findOne( query, callback );
				},
			    ],
			    
			    // Gather the results from the callbacks
			    function(err, results){
				if( err ) return done(err); 
				
				var emails   = results.filter( function(result){ return ( result !== null && result.email    === req.body.email ) });
				var username = results.filter( function(result){ return ( result !== null && result.username === req.body.username ) });
				
				// Make sure no users exist in users or unauthenticated users with this email
				if( emails.length || username.length ){
				    var errorString = 'The ' 
					+ ( ( emails.length ) ? 'email' : '' )
					+ ( ( emails.length && username.length ) ? ' and ' : '' )
					+ ( ( username.length ) ? 'username' : '' )
					+ ' provided have already in use.';
				    
				    console.log(errorString);
				    return done(null, false, req.flash('signUpMessage', errorString )); 
				}

				// Make account
				var newUser = UnauthenticatedUsers.register(
				    req.body.firstName,
				    req.body.lastName,
				    email.toLowerCase(),
				    password,
				    req.body.username
				);
				
				console.log('Made', newUser);
				newUser.save(function(err) {
				    if (err) return done(err);   
				    mailer.useTemplate( 'authenticate-new-user', newUser, function(mailError){
					done(mailError, newUser, req.flash('signInMessage', config.service.domain + 'authenticate-account/' + newUser._id )); 
					//done(mailError, newUser, req.flash('signInMessage', 'An authentication link will be sent to your email account shortly.')); 
				    }); 
				});
	
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
				done(err, user);
			    });			    
			});
		    } else {
			// user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
			return done(null, req.user);
		    }
		});
	}));
};

