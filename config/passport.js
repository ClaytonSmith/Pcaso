// load all the things we need

// Passport strategies
var LocalStrategy         = require('passport-local').Strategy;
var GoogleStrategy        = require('passport-google-oauth').OAuth2Strategy;


var Async                 = require('async');
var mongoose              = require('mongoose');


var Users                 = mongoose.model('User');
var UnauthenticatedUsers  = mongoose.model('UnauthenticatedUser');


var config                = require('./config');
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
			
			if( !user ) return done(null, false, req.flash('signInMessage', 'Bad email or password. Sorry! '));
			
			if( !user.validPassword(password)) return done(null, false, req.flash('signInMessage', 'Bad email or password. Sorry! '));
			
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
			var query = {
			    email : email.toLowerCase()
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
				
				// Make sure no users exist in users or unauthenticated users with this email
				if( emails.length ){
				    var errorString = 'The email provided is already in use.' 
				    return done(null, false, req.flash('signUpMessage', errorString )); 
				}
				
				// Make account

				var newUser = UnauthenticatedUsers.register(
				    req.body.firstName,
				    req.body.lastName,
				    email.toLowerCase(),
				    password
				);

				done(null, newUser, req.flash('signInMessage', 'An authentication link will be sent to your email account shortly.'));
				
				newUser.save(function(saveErr) {
				    if (err) throw new Error( saveErr );   
				    mailer.useTemplate( 'authenticate-new-user', newUser, function(mailError){
					//done(mailError, newUser, req.flash('signInMessage', config.service.domain + 'authenticate-account/' + newUser._id )); 
				    }); 
				});
				
			    });
		    } else {
			// user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
			return done(null, req.user);
		    }
		});
	}));


    passport.use(new GoogleStrategy(
	{
	    // TODO: use config.secrets. ...
            clientID        : configAuth.googleAuth.clientID,
            clientSecret    : configAuth.googleAuth.clientSecret,
            callbackURL     : configAuth.googleAuth.callbackURL,
            passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
	    
	},
	function(req, token, refreshToken, profile, done) {
	    	    
	    // asynchronous
	    process.nextTick(function() {

		// check if the user is already logged in
		if (!req.user) {
		    
		    Users.findOne({ email: profile.emails[0].value }, function(err, user) {
			if (err) return done(err);
			
			if (user) {
			    
			    // if there is a user id already but no token (user was linked at one point and then removed)
			    if (!user.google.token) {
				user.google.token = token;
				user.google.name  = profile.displayName;
				user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
				
				user.save( done );
			    } else {
				done(null, user);
			    }
			    		    
			} else {

			    var newUser          = Users.register(
				profile.name.givenName,
				profile.name.familyName,
				profile.emails[0].value,
				profile.id // Use as password. 
			    );
			    
			    newUser.links.avatar = profile._json.picture;
			    newUser.google.id    = profile.id;
			    newUser.google.token = token;
			    newUser.google.refreshToken = refreshToken; 
			    
			    newUser.save( done );
			}
		    });
		    
		} else {
		    // user already exists and is logged in, we have to link accounts
		    var user               = req.user; // pull the user out of the session

		    user.google.id    = profile.id;
		    user.google.token = token;

		    user.save( done );

		}

	    });

	}));

};

