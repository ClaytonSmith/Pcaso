'use strict'

var mongoose = require('mongoose');

var files      = require('./controllers/fileContainers');
var users      = require('./controllers/users'); // not yet 

module.exports = function(app, passport) {

    // normal routes ===============================================================
    
    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });
    
    // PROFILE SECTION ========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user
        });
    });
    
    app.get('/profile2', isLoggedIn, function(req, res) {
        res.render('profile2.ejs', {
            user : req.user
        });
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
    
    // Filename or bullet works here
    //app.get('/user/:userName/:fileName', files.displayFile);
    
    //app.get('/user/:username', user.displayAccountPage);
    
    
    app.get('/delete-account', users.deleteAccount);
    
    app.post('/upload-file', files.upload);
    
    app.get('/download/:fileId', files.download);
    
    app.get('/delete-file/:fileId',  users.deleteFile);   
    
    app.get('/authenticate-account/:authenticationCode', users.authenticateAccount)									     
    
    app.get('/authentication-login', function(req, res){
	req.logout();
	res.render('login.ejs', { message: req.flash('loginMessage', 'Please check your email for an authentication link.') });
    });

    /*== API =================================================================================*/   
    //app.delete('/api/delete-files',  users. -- );   
    //app.delete('/api/delete-account', users. -- );


    // API
    //api.get('/api/get-user-info' user.getAccount);  
    
    //app.get('/api/get-all-containers', files.getAllFileContainers);
    
    //app.get('/api/get-file', files.getFile);
    
    //app.post('/api/upload-file', files.upload);   
    
    
    //==============================================================================
    //= AUTHENTICATE (FIRST LOGIN) ==================================================
    //===============================================================================

    // locally --------------------------------
    // LOGIN ===============================
    // show the login form
    app.get('/login', function(req, res) {
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });
    
    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // SIGNUP =================================
    // show the signup form
    app.get('/signup', function(req, res) {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });
    
    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/authentication-login', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =============================================================================
    // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
    // =============================================================================

    // locally --------------------------------
    app.get('/connect/local', function(req, res) {
        res.render('connect-local.ejs', { message: req.flash('loginMessage') });
    });
    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // facebook -------------------------------

//    app.get('/:bullet', files.isBullet, files.displayFile);
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    
    
    res.redirect('/');
}
