'user strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var grid         = require('gridfs-stream');
var fs           = require('fs');
var util         = require('util');
var multipart    = require('multipart');
var config       = require('../../config/config');
var async        = require('async');

// Load other models
var Users                 = mongoose.model('User');
var UnauthenticatedUsers  = mongoose.model('UnauthenticatedUser');
var FileContainers        = mongoose.model('FileContainer');
var Comments              = mongoose.model('Comment');
var Notifications         = mongoose.model('Notification');

grid.mongo = mongoose.mongo;
var conn   = mongoose.createConnection(config.db);

exports.getUsers = function(req, res){
   Users.findOne( {}, function(err, doc){
       if( err )  return res.render('500');
       if( !doc ) return res.render('user-not-found');
       res.send( doc );	       
   });
}

exports.getUserProfile = function(req, res){
    // Renders user account page
    // If user is signed on, then additional items will be rendered. Note `isOwner`
        
    Users.findOne( req.param.username, function(err, doc){
	if( err )  return res.render('500.ejs', { user: req.user });
	if( !doc ) return res.render('404.ejs', { user: req.user });
	
	var isOwner = req.isAuthenticated() && req.user.username === req.params.username
	var fcQuery   = {
	    'parent.id': doc._id,
 	    'parent.collectionName': doc.__t,
	    $or: [ {'displaySettings': "PUBLIC"} ]
	}
	
	if( isOwner ) fcQuery.$or.push( {'displaySettings': "PRIVATE"} );
		
	var noteQuery = {
	    'parent.id': doc._id,
 	    'parent.collectionName': doc.__t,
	    read: true
	};
	
	
	function helper(docCollection){
	    var ids = {};
	    docCollection.forEach(function(d, i){  ids[ d._id ] = i; });

	    return function(id){
		return ids[ id ] !== undefined ? docCollection[ ids[ id ] ] : undefined ;  
	    }
	}
	
	async.parallel(
	    [
		function(parellelCB){ FileContainers.find( fcQuery,  parellelCB ); },
		function(parellelCB){ Comments.collectByParent( doc, parellelCB ); },
		function(parellelCB){ Notifications.find( noteQuery, parellelCB ); }
	    ],
	    function(err, results){
		var docFinder = null;

		docFinder = helper( results[0] );
		doc.files = doc.files.map( docFinder ).filter( Boolean );

		docFinder = helper( results[1] );
		doc.files = doc.userComments.map( docFinder ).filter( Boolean );
		
		docFinder = helper( results[2] );
		doc.files = doc.notifications.map( docFinder ).filter( Boolean );

		console.log(doc);
		res.render('profile.ejs', {
		    user : req.user,
		    account: doc,
		    isOwner: isOwner 
		});
	    });	       
    });   
}

exports.getProfile = function(req, res){
    // Renders user account page
    // If user is signed in and is account owner, then additional items will be rendered. Note `isOwner`
    
    if( !req.isAuthenticated() )
	return res.redirect('/sign-in');
 
    Users.findOne( { username: req.user.username }, function(err, doc){
	if( err )  return res.render('500.ejs', { user: req.user });
	if( !doc ) return res.render('404.ejs', { user: req.user });
	
	var isOwner = true;
	var fcQuery   = {
	    'parent.id': doc._id,
 	    'parent.collectionName': doc.__t,
	    $or: [ {'displaySettings.visibility': "PUBLIC"} ]
	}
	
	if( isOwner ) fcQuery.$or.push( {'displaySettings.visibility': "PRIVATE"} );
	
	var noteQuery = {
	    'parent.id': doc._id,
 	    'parent.collectionName': doc.__t,
	    read: true
	};
	
	
	function helper(docCollection){
	    var ids = {};
	    docCollection.forEach(function(d, i){  ids[ d._id ] = i; });
	    return function(id){
		return ids[ id ] !== undefined ? docCollection[ ids[ id ] ] : undefined ;  
	    }
	}
	
	async.parallel(
	    [
		function(parellelCB){ FileContainers.find( fcQuery,  parellelCB ); },
		function(parellelCB){ Comments.collectByParent( doc, parellelCB ); },
		function(parellelCB){ Notifications.find( noteQuery, parellelCB ); }
	    ],
	    function(err, results){
		var docFinder = null;

		docFinder = helper( results[0] );
		doc.files = doc.files.map( docFinder ).filter( Boolean );

		docFinder = helper( results[1] );
		doc.userComments = doc.userComments.map( docFinder ).filter( Boolean );
		
		docFinder = helper( results[2] );
		doc.notifications = doc.notifications.map( docFinder ).filter( Boolean );

		console.log(doc);
		res.render('profile.ejs', {
		    user : req.user = doc,
		    account: doc,
		    isOwner: isOwner 
		});
	    });	       
    });   
}

exports.deleteAccount = function(req, res){
    console.log('Account being deleted');
    
    req.user.remove(function(err){ /*Log or handle*/});

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
	    console.log( unauthenticatedUser );
	    var newUser = Users.convert( unauthenticatedUser );
	    
	    newUser.save(function(err) {
		if (err) {
		    console.log('BAD ERROR', err );
		    return new Error( err ) ;}
	    });	    	    
	    
	    // Delete temp account
	    unauthenticatedUser.remove();
	    
	    res.render('sign-in.ejs', {
		message: req.flash('loginMessage'), 
		user: req.user
	    });
	}
    });
}

exports.createDataset = function(req, res){
    var form = new formidable.IncomingForm();
    console.log(req.body, 'This is a cool test');
    form.uploadDir = __dirname + "../../../data/temp";
    form.keepExtensions = true;
    
    // var fileInfo = // check req	
    form.parse(req, function(err, fields, files) {
	
    	if (err) throw new Error( err );
	
        Users.findOne( {_id: req.user._id }, function( err, user ){  
	    console.log( user ); 

  	    if( err ) return handleError( err ) ;
    	    if( !user ) return res.send( 504 );
	    
	    var form = JSON.parse( fields.revertUponArival );

    	    var fileContainer = user.registerFile( files.file, form, function(fileRegErr){
		if( fileRegErr ) {
		    console.log( fileRegErr );
		    throw new Error( error );
		}
	
		user.save(function(userSaveErr){
		    if( userSaveErr ) {
			console.log( userSaveErr );		    
			throw new Error( error );
		    }
		    
		    res.redirect( fileContainer.links.local );
    		});
	    });    	    
        });   
    });
}
