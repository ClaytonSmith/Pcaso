'user strict'

var formidable           = require('formidable');
var mongoose             = require('mongoose');
var grid                 = require('gridfs-stream');
var fs                   = require('fs');
var util                 = require('util');
var multipart            = require('multipart');
var Promise              = require('bluebird');
var config               = require('../../config/config');
var mailer               = require('../../config/mailer');


// Load other models
var Users          = mongoose.model('User');
var FileContainers = mongoose.model('FileContainer');

exports.displayGallery = function(req, res){
}

// GET
exports.download = function(req, res){   
    FileContainers.findOne({_id: req.params.fileId}, function( err, doc ){
        if( err ) {
	    res.status(500).send({err: "Server error"});
	    throw new Error( err );
	}
	if( !doc ) {
	    res.status(404).send({ err: "File not found"});
	} else if( doc.viewableTo( req.user ) ){
            loadFile( doc.getFile( res ) );
        } else {
            res.status(404).send({ err: "File not found"});
        }
    });
}

// DELETE
exports.deleteFile = function(req, res){
    // need owner id 
    // need container id
    // proven to be authenticated user 
    
    res.send(200);
}

exports.requestAccess = function(req, res){

    var user           = null;
    var fileContainer  = null;
    var fcQuery        = null;
    
    // Only authenticated users can request access
    if( !req.isAuthenticated() ) 
	return res.redirect('/404');
    
    var query = req.params.bullet ? {
	'links.bullet': req.params.bullet
    } : {
	'parent.id': req.params.userID,
	'links.custom': req.params.datascape 
    };

    FileContainers.findOne( fcQuery, function(fcErr, fc){
	if( fcErr ){
	    res.render('500.ejs', {user: req.user});
	    throw new Error( fcErr );
	}
	if( !fc ) return res.render('404.ejs', {user: req.user});
	
	Users.findOne( { _id: fc.parent.id }, function(userErr, user){
	    if( userErr ){
		res.render('500.ejs', {user: req.user});
		throw new Error( userErr );
	    }
	    
	    // This should not hapen
	    if( !fc ) return res.render('404.ejs', {user: req.user});
	    
	    // User here is the person requesting the datascape
	    var mailObject = { datascape: fc, user: req.user};
	    
	    mailer.useTemplate( 'share-request-private', user, mailObject, function(mailError){
		if( mailError ){ 
		    res.render('500.ejs', {user: req.user});
		    throw new Error( mailError );
		}
		
		res.render('request-access-message-receipt.ejs', {user: req.user, datascape: fc});
	    });
	});
    });
};

//http://10.1.0.117:3000/user/username.cool/datascapes/6qh4c0418aor
exports.displayDatascape = function(req, res, next){
    
    var query = req.params.bullet ?
	{
	    'links.bullet': req.params.bullet
	} : {
	    'parent.id': req.params.userID,
	    'links.custom': req.params.datascape 
	};
    
    FileContainers.findOne( query, function(err, doc){
	if( err ) {
	    res.render('500.ejs', {user: req.user});
	    throw new Error( err );
	}
	
	if( !doc ) return res.render('404.ejs', {user: req.user});
	
	var isOwner = req.isAuthenticated() && req.user && req.user._id.toString() === doc.parent.id;	

    	if( doc.viewableTo( req.user ) ){ 
    	    res.render( 'datascape.ejs', { user: req.user, datascape: doc, isOwner: isOwner });
    	} else {
    	    res.render( 'request-access.ejs', {
    		user: req.user,
    		datascape: doc
    	    });
    	}
    });
}


//http://10.1.0.117:3000/u/USER-ID/datascapes/6qh4c0418aor
exports.datascapeGetCSV = function(req, res){
    
    var query = req.params.bullet ?
	{
	    'links.bullet': req.params.bullet
	} : {
	    'parent.id': req.params.userID,
	    'links.custom': req.params.datascape 
	};

    FileContainers.findOne( query, function(err, doc){
	if( err){
	    res.status(500).send({err: "Server error"});
	    throw new Error( err );
	}
	
	if( doc.viewableTo( req.user ) ){ 
	    doc.getFile( res );
	    doc.save(function(saveErr){
		if( saveErr ){
		    throw new Error( saveError );
		}
	    });
	} else {
	    res.status(404).send({err: "File not found"});
	}
    });
}

exports.datascapeGetLegacyConfig = function(req, res){
    
    var query = req.params.bullet ? {
	    'links.bullet': req.params.bullet
	} : {
	    'parent.id': req.params.userID,
	    'links.custom': req.params.datascape 
	};
    
    FileContainers.findOne( query, function(err, doc){
	if( err ){
	    res.status(500).send({});
	    throw new Error( err );
	}
	if( doc.viewableTo( req.user ) ){ 
	    res.send( doc.displaySettings.legacy );
	} else {
	    res.status(404).send({err: "File not found"});
	}
    });
}

exports.getDatascapeSettings = function(req, res){
    var query = req.params.bulletURL ? {
	    'links.bullet': req.params.bulletURL
	} : {
	    'parent.id': req.params.userID,
	    'links.custom': req.params.datascape 
	};
    
    FileContainers.findOne( query, function(err, doc){
	
	if( err ){
	    res.redirect('/500');
	    throw new Error( err );
	}

	if( !doc) return res.redirect('/404');

    	var isOwner = req.isAuthenticated() && req.user && req.user._id.toString() === doc.parent.id;

	if( isOwner ){ 
    	    res.render('datascape-settings.ejs', { 
		user: req.user,
		datascape: doc,
		isOwner: isOwner,
		message: req.flash('uploadMessage')
	    });
    	} else {
    	    res.render( 'request-access.ejs', {
    		user: req.user,
		datascape: doc,
    		file: {
    		    name: doc.file.name,
		    requestLink: doc.displaySettings.link + '/request-access'
    		}
    	    });
    	}
    });
}



exports.getFileContainer = function(req, res){
    
    // Construct query
    var query = {
	_id: req.query.id
    }
    
    FileContainers.findOne( query, function(err, doc){
	if( err ){
	    res.status(500).send({err: "Server error"});
	    throw new Error( err );
	}
	
	if( !doc ) return res.status(404).send({err: "File not found"});
	if( !doc.viewableTo( req.user ) )
	    return res.status(404).send({err: "File not found"});
	
	// At this point, no errors
	// we found the doc, and the user,
	// does have access to the file. Yay!

	// Send fileContainer 
	res.send( doc );
    }); 
    
}


exports.getFileContainerSource = function(req, res){
    
    // Construct query
    var query = {
	_id: req.query.id
    }
    
    FileContainers.findOne( query, function(err, doc){
	if( err ){
	    res.status(500).send({err: "Server error"});
	    throw new Error( err );
	}
	
	if( !doc ) return res.status(404).send({err: "File not found"});
	if( !doc.viewableTo( req.user ) )
	    return res.status(404).send({err: "File not found"});
	
	// Send fileContainer 
	doc.getFile( res );
    }); 			    
}

exports.postDatascapeSettings = function(req, res){
    
    if( !req.isAuthenticated() )
	return res.status(403).send({err: "Forbidden"});
    
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields) {
	if (err){
	    res.status(500).send({err: "Server error"});
	    throw new Error( err );
	}
	
	var settings = JSON.parse( fields.revertUponArival );
	var query = {
	    'links.custom': req.params.datascape
	}
	
	FileContainers.findOne( query, function(fcErr, doc){
	    if( fcErr ){
		res.status(500).send({err: "Server error"});
		throw new Error( fcErr );
	    }

	    // Make sure the user exists and they are the parent 
	    if( req.user && doc.parent.id !== req.user._id.toString() )
		return res.status(403).send({err: "Forbidden"});
	    
	    doc.updateSettings( settings, function(updateErr){
		if( updateErr ) {
		    res.status(500).send({err: "Server error"});
		    throw new Error( updateErr );
		}	
	    });
	    
	    // no need to wait on emails
	    doc.save(function(saveErr){
		if( saveErr ){
		    return res.status(500).send({err: "Server error"});
		}
		res.send( doc.links.link );
	    });
	});
    });
}


exports.deleteDatascape = function(req, res){

    if( !req.isAuthenticated() )
	res.redirect('/403');
   
    var query = {
	'links.custom': req.params.datascape
    }
    
    FileContainers.findOne( query, function(fcErr, doc){
	if( fcErr ){
	    res.redirect('/500' );
	    throw new Error( fcErr );
	}
	
	// Make sure the user exists and they are the parent 
	if( req.user && doc.parent.id !== req.user._id.toString() )
	    return res.redirect('/403');
	
	
	    // no need to wait on emails
	doc.remove(function(removeErr){
	    if( removeErr ){
		res.redirect('/500' );
		throw new Error( removeErr );
	    }
	    res.redirect('/profile');
	});
    });
}

exports.getPaginatedFiles = function(req, res){
    
    // Not need to authenticate, only public datascapes 
    // will be shows
    
    // Defualt to only searching for public datascapes
    var query = {
	'$or': [ 
	    {'displaySettings.visibility': 'PUBLIC' }
	]
    };
    
    // If given a parentID, only search datascapes
    // that are owned by that user
    if( req.query.parentID ){
	query['parent.id'] = req.query.parentID;
    }	    
    
    // If parent, display all datascapes
    if( req.user && ( req.query.parentID === req.user._id.toString() ) ){
	query['$or'].push( {'displaySettings.visibility': 'PRIVATE' } );
    }
    
    // Construct paginate params
    // Don't forget to parse all incoming integer values
    var paginateParams = {
	page: parseInt( req.query.page || 0 ) + 1,
	limit: parseInt( req.query.limit || 30 ),
	lean: true,
	leanWithId: true,
	sort: { dateAdded: -1 }	 // Sort from newest to oldest 
    };

    FileContainers.paginate(query, paginateParams, function(err, docs){
	if( err ) res.send( err ); 
	res.send( docs ); 
    });    
} 


exports.addSharedUser = function(req, res){

    var datascapeQuery = {
	'parent.id': req.params.userID,
	'links.custom': req.params.datascape 
    };
    
    var userQuery = {
	_id: req.params.sharedUserID
    };

    
    FileContainers.findOne( datascapeQuery, function(fcErr, fc){
	if( fcErr ){
	    res.redirect( '/500');
	    throw new Error( fcErr );
	}
	
	if( !fc ) return res.redirect('/404');
	
	var isOwner = req.isAuthenticated() && req.user && req.user._id.toString() === fc.parent.id;
    
	if(!isOwner) return res.redirect('/403');
		
	Users.findOne( userQuery, function( userErr, user){
	    if( userErr ){
		res.redirect( '/500');
		throw new Error( userErr );
	    }
	    
	    if( !user ) return res.redirect('/404');
	    
	    var newSettings = {
		sharedWith: JSON.parse(JSON.stringify( fc.sharedWith ))
	    }
	    
	    newSettings.sharedWith.push( user.email );
	    
	    fc.updateSettings( newSettings, function(updateErr){
		if( updateErr ){
		    res.redirect( '/500');
		    throw new Error( updateErr );
		}

		fc.save(function(saveErr){
		    if( saveErr ){
			res.redirect( '/500' );
			throw new Error( saveErr );
		    } else res.render('requested-user-added.ejs', {user: req.user, addedUser: user, datascape: fc }); 
		});	    
	    });
	});
    });
}


exports.updateThumbnail = function(req, res){

    var query = {
	'_id': req.body.datascapeID,
	'parent.id': ( req.user || {} ).id
    }

    FileContainers.findOne( query, function(err, doc){
	if( err ){
	    res.status(500).send({err: "Server error"});
	    throw new Error( err );
	}
	if( !doc ) return res.status(404).send({err: 'File not found'});
	
	var thumbnailPath = doc.localDataPath + '/files/thumbnails/' + doc._id;
	var base64URL = req.body.rawImageData.replace(/^data:image\/png;base64,/, "");

	fs.writeFile(thumbnailPath, base64URL, "base64", function(writeErr){
	    if( writeErr ){
		res.status(500).send({err: "Error saving image"});
		console.log(writeErr);
		throw new Error( writeError );
	    }
	    
	    // Keep the auto generated thumbnail just in case 
	    // but change the image path
	    doc.links.thumbnail = doc.publicDataPath + '/files/thumbnails/' + doc._id;
	                             
	    doc.save(function(saveErr){
		if( saveErr ){
		    res.status(500).send({err: "Error saving image"});
		    console.log(saveErr);
		    throw new Error( saveError );
		}	
		
		res.send(doc);
	    });
	});	
    });
}
