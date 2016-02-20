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
        if( err ) return handleError( error );
        
	if( !doc ) {
	    res.send(404);
	} else if( doc.viewableTo( req.user ) ){
            loadFile( doc.getFile( res ) );
        } else {
            res.send(404);
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
    var fcQuery          = {
	'parent.username': req.params.username,
	'links.custom': req.params.datascape 
    }
    
    var promise = new Promise( function(resolve, reject){
	FileContainers.findOne( fcQuery, function(err, doc){
	    if( err ) reject( err, doc );
	    else resolve( doc );
	});
    }).then( function(fc){
	fileContainer  = fc;
	
	Users.findOn( { _id: fc.parent.id }, function(err, doc){
	    if( err ) return 'Do something';
	    if( !doc ) return 'Should not happen';	    
	    user = doc; 
	    
	    var mailObject = { file: file, user: req.user};

	    if( !req.isAuthenticated() ){
		mailer.useTemplate( 'public-file-access-request', user, mailObject, function(mailError){
		    // stuff
		});
	    } else {
		mailer.useTemplate( 'private-file-access-request', user, mailObject, function(mailError){		
		    // stuff
		});
	    }
	});
    }).catch( function(err){
	
	// Sxomething 
    });
    
};

//http://10.1.0.117:3000/user/username.cool/datascapes/6qh4c0418aor
exports.displayDatascape = function(req, res, next){
    
    var query = req.params.bullet ?
	{
	    'links.bullet': req.params.bullet
	} : {
	    'parent.username': req.params.username,
	    'links.custom': req.params.datascape 
	};
    
    FileContainers.findOne( query, function(err, doc){
	if( err )  return res.render('500.ejs', {user: req.user});
	if( !doc ) return res.render('404.ejs', {user: req.user});
	
	var isOwner = req.isAuthenticated && req.user && req.user._id.toString() === doc.parent.id;
	

    	if( doc.viewableTo( req.user ) ){ 
    	    res.render( 'datascape.ejs', { user: req.user, datascape: doc, isOwner: isOwner });
    	} else {
    	    res.render( 'request-access.ejs', {
    		user: req.user,
    		file: {
    		    name: doc.file.name,
    		    requestLink: doc.displaySettings.link + '/request-access'
    		}
    	    });
    	}
    });
    //    res.redirect('/profile');
}


//http://10.1.0.117:3000/user/username.cool/datascapes/6qh4c0418aor
exports.datascapeGetCSV = function(req, res){
    
    var query = req.params.bullet ?
	{
	    'links.bullet': req.params.bullet
	} : {
	    'parent.username': req.params.username,
	    'links.custom': req.params.datascape 
	};

    FileContainers.findOne( query, function(err, doc){
	console.log( err, doc, query);
	
	if( doc.viewableTo( req.user ) ){ 
	    doc.getFile( res );
	    doc.save(function(saveErr){
		// Handle error 
	    });
	} else {
	    res.send(404);
	}
    });
}

exports.datascapeGetLegacyConfig = function(req, res){
    
    var query = req.params.bullet ?
	{
	    'links.bullet': req.params.bullet
	} : {
	    'parent.username': req.params.username,
	    'links.custom': req.params.datascape 
	};
    
    FileContainers.findOne( query, function(err, doc){
	if( err ) throw new Error( err );
	
	if( doc.viewableTo( req.user ) ){ 
	    res.send( doc.displaySettings.legacy );
	} else {
	    res.send(404);
	}
    });
}

// POST
// Can only get here if user is authenticated
exports.upload = function(req, res) {
    
    var form = new formidable.IncomingForm();
    var documentId = mongoose.Types.ObjectId();        		
    console.log(req.body);

};


exports.getDatascapeSettings = function(req, res){
    var query = req.params.bulletURL ?
	{
	    'links.bullet': req.params.bulletURL
	} : {
	    'parent.username': req.params.username,
	    'links.custom': req.params.datascape 
	};
    
    FileContainers.findOne( query, function(err, doc){
	
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
	if( err )  return res.send( 500 );
	if( !doc ) return res.send( 404 );
	if( !doc.viewableTo( req.user ) )
	    return res.send( 404 );
	
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
	if( err )  return res.send( 500 );
	if( !doc ) return res.send( 404 );
	if( !doc.viewableTo( req.user ) )
	    return res.send( 404 );
	
	// Send fileContainer 
	doc.getFile( res );
    }); 			    
}

exports.postDatascapeSettings = function(req, res){
    
    if( !req.isAuthenticated() )
	res.sendStatus(403);
    
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields) {
	if (err) throw new Error( err );
	
	var settings = JSON.parse( fields.revertUponArival );
	var query = {
	    'links.custom': req.params.datascape
	}
	
	FileContainers.findOne( query, function(err, doc){
	    if( err ) return res.sendStatus( 500 );
	    if( doc.parent.id !== req.user._id.toString() )
		res.sendStatus(403);

	    console.log( settings );
	    doc.displaySettings.display     = settings.displaySettings.display;
	    doc.displaySettings.title       = settings.displaySettings.title;
	    doc.displaySettings.caption     = settings.displaySettings.caption;
	    doc.displaySettings.visibility  = settings.displaySettings.visibility;	    
	    doc.sharedWith = settings.sharedWith;

	    doc.displaySettings.legacy = FileContainers.convertDisplaySettingsToLegacy( settings.displaySettings );
	    console.log(doc) 
	    doc.save(function(saveErr){
		if( saveErr ) return res.sendStatus( 500 );
		
		res.send( doc.links.link );
	    })
	});
    });
}


exports.getPaginatedFiles = function(req, res){
    
    // Not need to authenticate, only public datascapes 
    // will be shows
    
    var query = {
	'displaySettings.visibility': 'PUBLIC'
    }
    
    // Construct paginate params
    // Don't forget to parse all incoming integer values
    var paginateParams = {
	offset: parseInt( req.query.page || 0 ),
	limit: parseInt( req.query.limit || 30 ),
	lean: true,
	leanWithId: true,
	sort: { dateAdded: -1 }	
    };
    
    FileContainers.paginate(query, paginateParams, function(err, docs){
	console.log(err, docs); 
	if( err ) res.send( err ); 
	res.send( docs.docs ); 
    });    
} 
