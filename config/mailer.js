'use strict'

var nodemailer = require('nodemailer');
var config     = require('./config');
// Create a SMTP transporter object


var mailClients = {};

// Dict of all clients
for( var client in config.secrets.emailCredentials ){    
    
    var okayToSend = { from: false, to: false, subject: false, body: false } 
    
    mailClients[client] = {
	transport: nodemailer.createTransport({
	    host: 'smtpout.secureserver.net', 
	    port: 465, 
	    auth: config.secrets.emailCredentials[ client ],
	    secure: true
	}), 
	
	message: {
	    
	    // sender info
	    from: function(from){ 
		okayToSend.form = true;
		this.from = from + ' <' + config.secrets.emailCredentials[client].user '>';
	    },
	    
	    // User => '"First Last" <user@email.com>'
	    to: function(users){
		okayToSend.to = true;	
		users = Array.isArray( users ) ? users : [ users ] ;	
		this.to = users.map(function(user){
		    return '"' 
			+ user.first 
			+ ' ' 
			+ user.last
			+ '" <'
			+ user.email
			+ '>';
		}).join(', ');
	    },
	    
	    // Subject of the message
	    subject: function(subject){
		okayToSend.subject = true;
		this.subject = subject;
	    },
	    
	    headers: { // Do not touch 
		'X-Laziness-level': 1000
	    },
	    
	    // plaintext body
	    text: function(textBody){
		okayToSend.body = true;  
		this.text = textBody;
	    },
	    
	    // HTML body
	    html: function(htmlBody){
		okayToSend.body =  true;  
		this.html = htmlBody;
	    }
	},
	
	send: function(){
	    
	    // Check that all required fields have been filled
	    var valid = Object.keys( okayToSend ).reduce( function( predicate, val ){ return okayToSend[ val ] && predicate; }, true );
	    
	    if( !valid ) return new Error( 'Malformed email, all fields must be filled' );
	    
	    // send
	    mailClients[client].transporter.sendMail(mailClients[client].message, function(error, info) {
		if (error) { console.log(error.message); return; }
		console.log('Server responded with "%s"', info.response);
	    });
	}
    }
};


exports.useTemplate = function(templateName, variables){
    // find template file
    // populate template
    // return error if no file/template exists
    
    var suffix = '.js';
    var templateDir = './email-templates/'
    // check if templateDir + templateName exists
    // return error
    
    
}

exports.mailClients = mailClients;
