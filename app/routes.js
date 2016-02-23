'use strict'

var mongoose = require('mongoose');

var files          = require('./controllers/fileContainers');
var users          = require('./controllers/users');
var comments       = require('./controllers/comments'); 
var notifications  = require('./controllers/notifications'); 

module.exports = function(app, passport) {

    // normal routes ===============================================================
    
    // show the home page (will also have our login links)
    app.get( '/', function(req, res) {
        res.render('index.ejs', { user: req.user });
    });   
        
    app.get('/profile', isLoggedIn, function(req, res){
	res.redirect( req.user.links.local );
    });
    
    app.get('/sign-in', function(req, res){
	res.render('sign-in.ejs', { message: req.flash('signInMessage'), user: req.user });	
    });
    
    app.post('/sign-in', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/sign-in', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    
    app.get('/sign-up', function(req, res){
	res.render('sign-up.ejs', { message: req.flash('signUpMessage'), user: req.user });	
    });

    app.post('/sign-up', passport.authenticate('local-signup', {
        successRedirect : '/sign-in', // redirect to the secure profile section
        failureRedirect : '/sign-up',     // redirect back to the signup page if there is an error
        failureFlash : true               // allow flash messages
    }));

    app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
    
    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
            passport.authenticate('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));
    
    
    
    app.get('/authenticate-account/:authenticationCode', users.authenticateAccount);
    
    app.get('/sign-out', function(req, res) {
        req.logout();
        res.redirect('/');
    });
   
    app.get('/upload', function(req, res){
	res.render('upload-datascape.ejs', { message: req.flash('uploadMessage'), user: req.user });	
    });
    
    app.post(   '/upload-datascape',        users.createDataset);

    app.get(    '/notifications',           users.getNotifications);
    app.get(    '/notifications/:notificationID', notifications.redirect );
    
    app.get(    '/u/:userID',          users.getUserProfile );
    app.get(    '/u/:userID/settings', users.profileSettings );
    app.post(   '/u/:userID/settings', users.editProfileSettings );
    //app.delete( '/u/:userID/delete', users.deleteAccount);
    //app.get(    '/u/:userID/datasets/',                         files.displayUserDatasets );
    
    app.get(    '/u/:userID/datascapes/:datascape',                files.displayDatascape );
    app.get(    '/u/:userID/datascapes/:datascape/csv',            files.datascapeGetCSV );
    app.get(    '/u/:userID/datascapes/:datascape/config',         files.datascapeGetLegacyConfig );
    app.get(    '/u/:userID/datascapes/:datascape/settings',       files.getDatascapeSettings );
    app.get(    '/u/:userID/datascapes/:datascape/access-grant/:sharedUserID',
		files.addSharedUser );
    app.post(   '/u/:userID/datascapes/:datascape/settings',       files.postDatascapeSettings );
 
    //app.delete( '/u/:userID/datascapes/:datascape/delete',         users.deleteDataset );
    app.post(   '/u/:userID/datascapes/:datascape/request-access', files.requestAccess );    
    
    app.get(    '/api/datascapes',          files.getFileContainer);
    app.get(    '/api/datascapes/source',   files.getFileContainerSource);
    app.get(    '/api/datascapes/paginate', files.getPaginatedFiles);
    //app.delete( '/api/fileContainer/:fileContaienrID', files.getFileContainer);
    
    app.get(    '/api/comments',            comments.getComments);
    app.post(   '/api/comments/create',     comments.postComment);
    app.post(   '/api/comments/edit',       comments.editComment);
    app.delete( '/api/comments/:commentID', comments.deleteComment );
    
    app.get(    '/api/notifications',       notifications.get);
    app.delete( '/api/notifications',       notifications.remove);
    
    app.get(    '/api/*',  function(req, res){ res.sendStatus(404) });
    app.post(   '/api/*',  function(req, res){ res.sendStatus(404) });
    app.put(    '/api/*',  function(req, res){ res.sendStatus(404) });
    app.delete( '/api/*',  function(req, res){ res.sendStatus(404) });

    //app.get( '/gallery', files.displayGallery );    

    app.get( '/about', function(req, res){
	res.render('about.ejs', { user: req.user });
    });

    app.get('/:bullet',        files.displayDatascape);
    app.get('/:bullet/config', files.datascapeGetLegacyConfig);
    app.get('/:bullet/csv',    files.datascapeGetCSV);
    
    app.get( '*',  function(req, res){
    	res.render('404.ejs', { user: req.user });
    });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    
    res.redirect('/');
}

