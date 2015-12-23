'user strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var grid         = require('gridfs-stream');
var fs           = require('fs');
var util         = require('util');

// Load other models
var User          = mongoose.model('User');
var fileContainer = mongoose.model('FileContainer');



exports.displayAccountPage = function(req, res){
    var username = req.params.username;
    
    console.log(req.isAuthenticated());
    
    User.find({})
    res.render('profile.ejs', {
        user : req.user
    });
}


