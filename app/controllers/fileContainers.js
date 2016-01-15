'user strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var grid         = require('gridfs-stream');
var fs           = require('fs');
var util         = require('util');
var multipart    = require('multipart');
var config       = require('../../config/config');

// Load other models
var Users         = mongoose.model('User');
var FileContainer = mongoose.model('FileContainer');

// used to tell if a sequence is a valid bullet 
exports.isBullet = function(req, res, next) {
    // defualt true for now
    return next();   
    res.redirect('/');
}

// GET
exports.download = function(req, res){   
    FileContainer.findOne({_id: req.params.fileId}, function( err, doc ){
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

exports.addSharedUser = function( req, res){
    // need owner id 
    // need container id
    // Shared with user
    // How to store the shared records
}

// POST
// Can only get here if user is authenticated
exports.upload = function(req, res) {

    var form = new formidable.IncomingForm();
    var documentId = mongoose.Types.ObjectId();        		
    
    form.uploadDir = __dirname + "../../../data/temp";
    form.keepExtensions = true;
   
    // var fileInfo = // check req	
    form.parse(req, function(err, fields, files) {
	
	if (err) throw new Error( err );
	
        Users.findOne( {_id: req.user._id }, function( err, user ){
	    if( err ) return handleError( err ) ;
	    if( !user ) res.send( 504 );
	    
	    var fileContainer = new FileContainer({
	        parent: {
		    id: user._id,
		    collection: user.__t
                },
		file: {
		    name: files.file.name,
		    path: files.file.path
		},
	        visibility: user.settings.defaultVisibility
	    });
	    
	    user.attachFile( fileContainer._id );
	    
	    user.save(function(error){
		if( err ) throw new Error( error );
	    });
	    
	    fileContainer.save(function(error){
		if( err ) throw new Error( error );
	    });
        });   
    });
    
    form.on('end', function() {       
	// may  not need
	res.send(200);
    });
};


