'use strict'

var mongoose = require('mongoose');

var files      = require('./controllers/fileContainers');
var users      = require('./controllers/users');
var comments   = require('./controllers/comments'); 

module.exports = function(app, passport) {

    // normal routes ===============================================================
    
    // show the home page (will also have our login links)
    app.get( '/', function(req, res) {
        res.render('index.ejs', { user: req.user });
    });   
        

    app.get('/profile', users.getProfile);
    
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


    					     
    app.get('/authenticate-account/:authenticationCode', users.authenticateAccount);
    
    app.get('/sign-out', function(req, res) {
        req.logout();
        res.redirect('/');
    });
    
    app.get('/upload', function(req, res){
	res.render('upload.ejs', { message: req.flash('uploadMessage'), user: req.user });	
    });
    
    app.post( '/upload-dataset', users.createDataset);
    
    app.get(    '/user/:username',          users.getUserProfile );
    //app.post(   '/user/:username/update', users.updateProfile );
    //app.delete( '/user/:username/delete', users.deleteAccount);

    //app.get(    '/user/:username/datasets/',                         files.displayUserDatasets );
    app.get(    '/user/:username/datasets/:fileLink',                files.displayDataset );
    app.get(    '/user/:username/datasets/:fileLink/csv',            files.datasetGetCSV );
    app.get(    '/user/:username/datasets/:fileLink/config',         files.datasetGetLegacyConfig );

    //app.post(   '/user/:username/datasets/:fileLink/update',         files.updateDataset );
    //app.get(    '/user/:username/datasets/:fileLink/download',       files.downloadDataset);    
    //app.delete( '/user/:username/datasets/:fileLink/delete',         users.deleteDataset );
    app.post(   '/user/:username/datasets/:fileLink/request-access', files.requestAccess );    
    
    //app.get( '/gallery', files.displayGallery );    

    app.get( '/about', function(req, res){
	res.render('about', { user: req.user });
    });
 
    // Ajax does some awful stuff that forces the 'get' to be a 'post'
    // I miss angular's `http` so much :(
    app.post(   '/api/comments/get',        comments.getComments);
    app.post(   '/api/comments/create',     comments.postComment);
    app.post(   '/api/comments/edit',       comments.editComment);
    app.delete( '/api/comments/:commentID', comments.deleteComment );
 

   //    app.get( '*',  function(req, res){
    //	res.render('/404.ejs', { user: req.user });
    //   });
    
    //    app.get('/:bullet', files.isBullet, files.displayFile);
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    
    res.redirect('/');
}

