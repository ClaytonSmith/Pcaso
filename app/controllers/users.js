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
	_id: req.params.userID
    };
    
    Users.findOne( query, function(err, doc){
	if( err ) {
	    res.redirect('/500');
	    throw new Error( err );
	}
	
	if( !doc ) return res.redirect('/404');

	var isOwner = req.isAuthenticated() && req.user._id.toString() === req.params.userID;
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
	
	// No place to display comments yet so don't load them
	//asyncCollect.add( function(parellelCB){ FileContainers.find( fcQuery,  parellelCB ); }, 'files' );
	//asyncCollect.add( function(parellelCB){ Comments.collectByParent( doc, parellelCB ); }, 'comments' );
	
	//if( isOwner )
	  //  asyncCollect.add( function(parellelCB){ Notifications.find( noteQuery, parellelCB ); }, 'notifications' );
			  
	
	async.parallel( asyncCollect.getQueries(), function(asyncErr, results){
	    asyncCollect.merge( results );
	    
	    res.render('profile.ejs', {
		profile: doc,				
		user : req.user,
		isOwner: isOwner, 
		name: {name: 'name'}
	    });
	    
	});	       
    });   
}


exports.getNotifications = function(req, res){
    
    if( !req.isAuthenticated() )
	return res.redirect('/sign-in');
    
    var noteQuery = {
	'parent.id': req.user._id,
 	'parent.collectionName': req.user.__t
    };
    
    Notifications.find( noteQuery, function(err, docs){
	
	res.render('notifications-display.ejs', {
	    user: req.user,
	    notifications: docs
	})
    });
}

exports.getUserProfileComments = function(req, res){
    
    Users.findOne( { _id: req.params.userID }, function(err, doc){
	if( err || !doc ) return res.send(404);

	
	Comments.collectByParent( doc, function(cmmtErr, comments){
	    if( cmmtErr || !comments ) return res.send(404);
	    res.send( Comments.jqueryCommentsTransform( comments ) );	    
	});	
    });
}

exports.postUserProfileComment = function(req, res){
    if( !req.isAuthenticated() )
	return res.status( 403 ).send({err: "Forbidden"});
    
    var query = {
	_id: req.params.userID
    };
    
    Users.findOne( query, function(err, doc){
	if( err ) {
	    res.status( 500 ).send({err: "Server rrror"});
	    throw new Error( err );
	}
	
	if( !doc )  return res.status( 404 ).send({err: "User not found"});
	
	var comment = {
	    body: req.body.body,
	    subject: doc.name.first +" "+  doc.name.last + "'s account",
	}
	
	req.user.leaveComment(doc, comment.subject, comment.body, function(commentError){ 
	    res.send( comment.body );	    
	});
    });
}

exports.deleteAccount = function(req, res){
    if( !req.isAuthenticated() ) 
	return res.redirect('/sign-in');
    
    var isOwner = req.user && req.user._id.toString() === req.params.userID;
    
    if( !isOwner )
	return res.redirect('/profile');
    

    var query = {
	_id: req.params.userID
    };
    
    Users.findOne( query, function(err, doc){
	if( err ) {
	    res.redirect('/500' );
	    throw new Error( err );
	}
	
	if( !doc )  return res.redirect('/404' );
	

	user.remove(function(err){ 
	    if( err ){
		res.redirect('/500');
		throw new Error( err );
	    } else {
		req.logout();
		res.redirect('/');
	    }
	});
    });  
}

// Moves user accounts from the 'Unauthenticated' collection to the regular user space 
exports.authenticateAccount = function(req, res){
   
    var query = { _id: req.params.authenticationCode };
    
    UnauthenticatedUsers.findOne( query, function(err, unauthenticatedUser){
	if( err ){
	    res.redirect('/500');
	    throw new Error( err );
	    
	} else if( !unauthenticatedUser ){
	    return res.redirect('/404');

	} else {
	    
	    // Copy unauthenticated user to regular user collection
	    var newUser = Users.convert( unauthenticatedUser );
	    
	    newUser.save(function(err) {
		if (err) {
		    res.redirect('/500');
		    throw new Error( err );
		}
		
		// Delete temp account
		unauthenticatedUser.remove();
		res.redirect('/sign-in');
	    });	    	    
	}
    });
}

exports.createDataset = function(req, res){
    var form = new formidable.IncomingForm();
    form.uploadDir = __dirname + "../../../data/temp";
    form.keepExtensions = true;
    
    // var fileInfo = // check req	
    form.parse(req, function(err, fields, files) {
	if (err) {
	    console.log(err);
	    res.status(500).send({err: "Server error" });
	    //res.sendStatus(500);
	    throw new Error( err );
	}
	
	if( !files.file ) return res.status(500).send({err: "No file provided" });;


        Users.findOne( {_id: req.user._id }, function( userErr, user ){  	    
  	    if( userErr ) {
		res.status(500).send({err: "Server error" });
		return handleError( userErr ) ;
	    }
    	    if( !user ) return res.status( 404 ).send({err: "User not found"});
	    
	    var form = JSON.parse( fields.revertUponArival );
	    
    	    var fileContainer = user.registerFile( files.file, form, function(fileRegErr){
		if( fileRegErr ) {
		    res.status(500).send({err: "Server error" });
		    throw new Error( fileRegErr );
		}
		
		user.save(function(userSaveErr){
		    if( userSaveErr ) {
			res.status(500).send({err: "Server error" });
			throw new Error( userSaveErr );
		    }
		    
		    res.send( fileContainer.links.link );
    		});
	    });    	    
        });   
    });
}

exports.profileSettings = function(req, res){
    var isOwner = req.isAuthenticated() && req.user && req.user._id.toString() === req.params.userID;
    
    if( !isOwner )
	return res.redirect('/');
    
    var query = {
	_id: req.user._id
    }
    
    Users.findOne( query, function(err, doc){
	if( err  ) {
	    res.redirect('/500');
	    throw new Error( err );
	}
	if( !doc ) return res.redirect('/404');
	
	res.render('profile-settings.ejs', {user: req.user, profile: doc });
    });
}

// TODO: do not res.render 
exports.editProfileSettings = function(req, res){
    var isOwner = req.isAuthenticated() &&
	req.user !== undefined && 
	req.user._id.toString() === req.params.userID;
    
    if( !isOwner )
	return res.status(403).send({err: "Forbidden"});
    
    var query = {
	_id: req.user._id
    }
    
    var form = new formidable.IncomingForm();
    form.uploadDir = __dirname + "../../../data/temp";
    form.keepExtensions = true;
    
    // var fileInfo = // check req	
    form.parse(req, function(err, fields, files) {
	if( err  ) {
	    res.status(500).send({err: "Server error" });
	    throw new Error( err );
	}
	
	Users.findOne( query, function(userErr, doc){
	    if( userErr) {
		res.status(500).send({err: "Server error" });
		throw new Error( userErr );
	    }
	    if( !doc ) return res.status(404).send({err: "User not found" });

	    // Boolean are not converted so check string true or false
	    doc.profileSettings.displayEmail     = fields.displayEmail === 'true';
	    doc.fileSettings.defaults.visibility = fields.defaultVisibility;
	    
	    // If a new password has been provided
	    if( fields.newPassword && fields.newPassword !== '' ){
		
		console.log('fields.newPassword: ',fields.newPassword);
		doc.password = Users.generateHash( fields.newPassword );  
	    }
	    
	    if( files.file ){
		fs.rename( files.file.path, doc.localDataPath + '/imgs/avatar', function(writeErr){
		    doc.links.avatar = doc.publicDataPath + '/imgs/avatar';
		    
		    if( writeErr ){
			res.status(500).send({err: "Server error" });
			throw new Error( 500 );
		    }
		    
		    doc.save(function(saveErr){
			if( saveErr ){
			    res.status(500).send({err: "Server error" });
			    throw new Error( saveErr );
			}
			res.send(doc.links.local);
		    });
		});
	    } else {  
		doc.save(function(saveErr){
		    if( saveErr ){
			res.status(500).send({err: "Server error" });
			throw new Error( saveErr );
		    }
		    
		    res.send(doc.links.local);
		});
	    }
	});
    });
}
