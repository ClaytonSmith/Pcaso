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
	'displaySettings.customURL': req.params.fileLink 
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

//http://10.1.0.117:3000/user/username.cool/datasets/6qh4c0418aor
exports.displayDataset = function(req, res){
    
    var query = {
	'parent.username': req.params.username,
	'displaySettings.customURL': req.params.fileLink 
    }
    
    FileContainers.findOne( query, function(err, doc){
	console.log( err, doc, query);
	
	if( doc.viewableTo( req.user ) ){ 
	    res.render( 'dataset.ejs', {user: req.user });
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

// POST
// Can only get here if user is authenticated
exports.upload = function(req, res) {
    
    var form = new formidable.IncomingForm();
    var documentId = mongoose.Types.ObjectId();        		
    console.log(req.body);
    
    
    // form.uploadDir = __dirname + "../../../data/temp";
    // form.keepExtensions = true;
   
    // // var fileInfo = // check req	
    // form.parse(req, function(err, fields, files) {
	
    // 	if (err) throw new Error( err );
	
    //     Users.findOne( {_id: req.user._id }, function( err, user ){
    // 	    if( err ) return handleError( err ) ;
    // 	    if( !user ) res.send( 504 );
	    
    // 	    var fileContainer = new FileContainers({
    // 	        parent: {
    // 		    id: user._id,
    // 		    collection: user.__t
    //             },
    // 		file: {
    // 		    name: files.file.name,
    // 		    path: files.file.path
    // 		},
    // 	        visibility: user.settings.defaultVisibility
    // 	    });
	    
    // 	    user.attachFile( fileContainer._id );
	    
    // 	    user.save(function(error){
    // 		if( err ) throw new Error( error );
    // 	    });
	    
    // 	    fileContainer.save(function(error){
    // 		if( err ) throw new Error( error );
    // 	    });
    //     });   
    // });
    
    // form.on('end', function() {       
    // 	// may  not need
    
    // });
};


