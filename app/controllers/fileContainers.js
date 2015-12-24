'user strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var grid         = require('gridfs-stream');
var fs           = require('fs');
var util         = require('util');
var multipart    = require('multipart');
var config       = require('../../config/config');

// Load other models
var User          = mongoose.model('User');
var fileContainer = mongoose.model('FileContainer');

grid.mongo = mongoose.mongo;
var conn   = mongoose.createConnection(config.db);

// used to tell if a sequence is a valid bullet 
exports.isBullet = function(req, res, next) {
    
    // defualt true for now
    return next();
    
    res.redirect('/');
}


// GET
exports.download = function(req, res){
    console.log( req.params.fileID ) ;
    var options = {_id: req.params.fileID, root: 'uploads'};
    
    conn.once('open', function () {
	var gfs = grid(conn.db);
	
	gfs.createReadStream( options ).pipe(res);
    });
}

// DELETE
exports.deleteFile = function(req, res){
    
    var options = {_id: req.params.fileID, root: 'uploads'};
    
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

// POST
exports.upload = function(req, res) {
    var form = new formidable.IncomingForm();
    form.uploadDir = __dirname + "../../../data/temp";
    form.keepExtensions = true;
    console.log(req.isAuthenticated());
    var user = req.isAuthenticated() ? req.user : User.find({});

    // var fileInfo = // check req	
    form.parse(req, function(err, fields, files) {
	
	if (!err) {
            console.log('File uploaded : ' + files.file.path);

            conn.once('open', function () {
		var gfs = grid(conn.db);
		
		// generate new ID for the document
		var documentID = mongoose.Types.ObjectId();        
		
		var writestream = gfs.createWriteStream({
		    _id: documentID,
		    filename: files.file.name,
		    root: 'uploads',
		    mode: 'w'		    
		});
		
		console.log('cool doc', documentID);
		
		fs.createReadStream(files.file.path).pipe(writestream)
		fs.unlinkSync(files.file.path);
		
	    });
	}        
    });
    
    form.on('end', function() {       
	res.send(200);
    });   
};


