'user strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var grid         = require('gridfs-stream');
var fs           = require('fs');
var util         = require('util');

var config       = require('../../config/config');

// Load other models
var User          = mongoose.model('User');
var fileContainer = mongoose.model('FileContainer');


exports.loadFile = function( req, res){
    res.send({msg: 'you wish you had this cool file' })
}

// used to tell if a sequence is a valid bullet 
exports.isBullet = function(req, res, next) {
    
    // defualt true for now
    return next();
    
    res.redirect('/');
}

exports.upload = function(req, res) {
    // is user? 
    // |
    // \--> yes 
    // |    +--> save file with credentials
    // |    +--> make new restricted link
    // |
    // \--> no
    //      +--> save link under pcaseo user
    //      +--> make new link accessible
    
    var form = new formidable.IncomingForm();
    form.uploadDir = __dirname + "../../../data";
    form.keepExtensions = true;
   // var user = req.isAuthenticated() ? <AUTHENTICATED> : <PCASO>      
   // var fileInfo = // check req	
    form.parse(req, function(err, fields, files) {

	if (!err) {
            console.log('File uploaded : ' + files.file.path);
            grid.mongo = mongoose.mongo;
            var conn   = mongoose.createConnection(config.db);

            conn.once('open', function () {
		var gfs = grid(conn.db);
			    
		// generate new ID for the document
		var documentID = mongoose.Types.ObjectId();        
		
		var writestream = gfs.createWriteStream({
		    _id: documentID,
		    filename: files.file.name
		});
		
		console.log('cool doc', documentID);
		
		fs.createReadStream(files.file.path).pipe(writestream);
	    });
	}        
    });
    
    form.on('end', function() {        
	// make new file container
	
	/*container = new FileContainer({ 
	    //fileName: file.name || req.stuff,
	    visibility: user.settings.defailtVisibility,
	    parentID: user._id
	});
	
	
	// User now knows they own this file.
	user.attachFile(container._id); */
	
	res.send('Completed ..... go and check fs.files & fs.chunks in  mongodb');
	
    }); 
    
    //res.send({ x: 1 });
};


