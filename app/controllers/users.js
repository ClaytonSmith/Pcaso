'user strict'

var formidable            = require('formidable');
var mongoose              = require('mongoose');
var grid                  = require('gridfs-stream');
var fs                    = require('fs');
var util                  = require('util');
var multipart             = require('multipart');
var config                = require('../../config/config');
var async                 = require('async');
var AsyncCollect          = require('../helpers/async-collect').asyncCollect;


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
        
    var query = {
	username: req.params.username
    };
    
    Users.findOne( query, function(err, doc){
	if( err )  return res.render('500.ejs', { user: req.user });
	if( !doc ) return res.render('404.ejs', { user: req.user });
	

	console.log( AsyncCollect ); 
	var isOwner = req.isAuthenticated() && req.user.username === req.params.username;
	var asyncCollect = new AsyncCollect( doc );
	var noteQuery = null;	
    	var fcQuery   = {
    	    'parent.id': doc._id,
    	    'parent.collectionName': doc.__t,
    	    $or: [ {'displaySettings.visibility': "PUBLIC"} ]
    	}
	
	
	// If owner, also look for private files 
	if( isOwner ) { 
	    fcQuery.$or.push( {'displaySettings.visibility': "PRIVATE"} );
	
	// Any new notes?
	    
	    var noteQuery = {
		'parent.id': doc._id,
 		'parent.collectionName': doc.__t,
		read: true
	    };
	}
	
	asyncCollect.add( function(parellelCB){ FileContainers.find( fcQuery,  parellelCB ); }, 'files' );
	//asyncCollect.add( function(parellelCB){ Comments.collectByParent( doc, parellelCB ); }, 'comments' );
	
	if( isOwner )
	    asyncCollect.add( function(parellelCB){ Notifications.find( noteQuery, parellelCB ); }, 'notifications' );
			  
	
	async.parallel( asyncCollect.getQueries(), function(err, results){
	    asyncCollect.merge( results );
	    
	    //console.log( 
	    res.render('profile.ejs', {
		profile: doc,				
		user : req.user,
		isOwner: isOwner, 
		name: {name: 'name'}
	    });
	    
	});	       
    });   
}



exports.getProfile = function(req, res){
    if( !req.isAuthenticated() )
	return res.redirect('/sign-in');

    return res.redirect( '/user/' + req.user.username );
    
}

exports.getUserProfileComments = function(req, res){
    
    Users.findOne( { username: req.params.username }, function(err, doc){
	if( err || !doc ) return res.send(404);

	
	Comments.collectByParent( doc, function(cmmtErr, comments){
	    if( cmmtErr || !comments ) return res.send(404);
	    console.log( cmmtErr, comments );
	    res.send( Comments.jqueryCommentsTransform( comments ) );	    
	});	
    });
}

exports.postUserProfileComment = function(req, res){
    if( !req.isAuthenticated() )
	res.send( 403 );
    
    var query = {
	username: req.params.username
    };
    
    Users.findOne( query, function(err, doc){
	if( err )  return res.render('500.ejs', { user: req.user });
	if( !doc ) return res.render('404.ejs', { user: req.user });
	
	var comment = {
	    body: req.body.body,
	    subject: doc.username+"'s account",
	}
	
	req.user.leaveComment(doc, comment.subject, comment.body, function(commentError){ 
	    console.log('no errors please', err);
	    
	    res.send( 200 );
	    
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
		    
		    res.send( fileContainer.links.link );
    		});
	    });    	    
        });   
    });
}
