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
    // container ID not grindFS id
    console.log( req.params.fileId ) ;
    function loadFile(fileId){
	
        grid.mongo = mongoose.mongo;
        var conn   = mongoose.createConnection(config.db);
        var options = {_id: fileId, root: 'uploads'};    
        console.log(options);
	conn.once('open', function () {
	    var gfs = grid(conn.db);
	    gfs.createReadStream( options ).pipe(res);
        });
    };
    
    
    FileContainer.findOne({_id: req.params.fileId}, function( err, doc ){
        if( err ) return handleError( error );
        
	if( !doc ) {
	    res.send(404);
	} else if( doc.viewableTo( req.user ) ){
            loadFile( doc.file.id );
        } else {
            res.send(404);
        }
    });
}

// DELETE
exports.deleteFile = function(req, res){
    
    var options = {_id: req.params.fileId, root: 'uploads'};
    grid.mongo = mongoose.mongo;
    var conn   = mongoose.createConnection(config.db);
    
    conn.once('open', function () {
	var gfs = grid(conn.db);
	
	gfs.remove( options, function (err) {
	    if (err){
		console.log('not found');
		res.send(204);
		return handleError(err);
	    } else {
		res.send(200);
	    }
	});
    });
    
    res.send(200);
}

exports.addSharedUser = function( req, res){
    // Owner 
    // File
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


