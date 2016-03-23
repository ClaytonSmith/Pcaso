'use strict'

var path           = require('path');
var nodemailer     = require('nodemailer');
var config         = require('./config');
var EmailTemplate  = require('email-templates').EmailTemplate;
var async          = require('async');

var templateDir    = path.resolve(__dirname, '.', 'email-templates');



// Document this
var templateClients = {
    'test': { 
	subject: 'Test',
	client: 'no-reply'
    }, // Email users a datascape has been shared with them 
    'shared-with-authenticated-user': { 
	subject: 'A Pcaso datascape has been shared with you',
	client: 'no-reply'
    }, // Email unauthenticated sers a datascape has been shared with them 
    'shared-with-unauthenticated-user': { 
	subject: 'A Pcaso datascape has been shared with you',
	client: 'no-reply'
    }, // Email owner when a share request is made by unauthenticated users 
    'share-request-public': { 
	subject: 'Pcaso: Someone has requested access to one of your datascapes',
	client: 'no-reply'
    },// Email owner when a share request is made by users 
    'share-request-private': { 
	subject: 'Pcaso: Someone has requested access to one of your datascapes',
	client: 'no-reply'
    }, // Email for any comment
    'new-comment': { 
	subject: 'Pcaso: You got a new comment',
	client: 'no-reply'
    }, // Authentication email for user registration
    'authenticate-new-user': { 
	subject: 'Welcome to Pcaso',
	client: 'no-reply'
    },
    'password-recovery': {
	subject: 'Pcaso: Reset Password',
	client: 'no-reply'
    }
};

function templateResourceCollector(user, extra){
    return { 
	config: config,
	user: user,
	extra: extra
    }
}

function MailClient( client ){
    if( !config.secrets.emailCredentials.hasOwnProperty( client ))
	return new Error( 'Unknown client: ' + client );

    var newClient   = this;    
    var okayToSend  = { from: false, to: false, subject: false, body: false } 
    
    // Create a SMTP transporter object
    var transport   =  nodemailer.createTransport({
	host: 'smtpout.secureserver.net', 
	port: 465, 
	auth: config.secrets.emailCredentials[ client ],
	secure: true
    });

    newClient.message = {
	headers: { // Do not touch 
	    'X-Laziness-level': 1000
	},
	to:       null,
	from:     null,	
	subject:  null,
	html:     null,
	text:     null
    };
    
    // sender info
    newClient.from =  function(from){ 
	okayToSend.from = true;
	return newClient.message.from = from + ' <' + config.secrets.emailCredentials[client].user + '>';
    },
    
    // User => '"First Last" <user@email.com>'
    newClient.to = function(users){
	// TODO: error check and compose to field
	okayToSend.to = true;

	users = Array.isArray( users ) ? users : [ users ] ;	
	newClient.message.to = users.map(function(user){

	    if(typeof user === 'string' || user instanceof String)
		return '<'+ user +'>';
	    else {
		var nameString =  
		    (user.name) ? 
		    '"'+ user.name.first +' '+ user.name.last +'"' 
		    : '' ;
		
		return nameString 
		    + '<'
		    + user.email
		    + '>';
	    }
	}).join(', ');
    }
    
    // Subject of the message
    newClient.subject = function(subject){
	okayToSend.subject = true;
	newClient.message.subject = subject;
    }
    
    // plaintext body
    newClient.text = function(textBody){
	okayToSend.body = true;  
	newClient.message.text = textBody;
    }
    
    // HTML body
    newClient.html = function(htmlBody){
	okayToSend.body =  true;  
	newClient.message.html = htmlBody;
    }
    
    newClient.send = function( callback ){
	
	// Check that all required fields have been filled
	var valid = Object.keys( okayToSend ).reduce( function( predicate, val ){ return okayToSend[ val ] && predicate; }, true );
	if( !valid ) callback( new Error( 'Malformed email, all fields must be filled' ));

	// send
	
	if( process.env['NODE_ENV'] === 'test' || process.env['NODE_ENV'] === 'disable-emails')
	    callback( false, {});
	else transport.sendMail(newClient.message, callback);
    }
    
    return  newClient;
}

exports.useTemplate = function(templateName, recipients, additionalObjects, callback){

     if( callback === undefined ){
	 callback = additionalObjects;
     }

    // Get the mailer for the template 
    var mailer = templateClients[ templateName ];
    
    // If the mailer in undefined, there there is no template that uses it
    if( mailer === undefined ) return callback( new Error( 'Template '+ templateName+' undefined' ) );
    
    // Create the template from the mailer
    var template = new EmailTemplate( path.join(templateDir, templateName));

    // load in the mailer client
    //console.log('NEW MAILER',mailer, mailClients);
    var mailClient = new MailClient( mailer.client );
    
    // render recipients into template
    // we assume the dev knows what recipients the template expects
    // TODO: Document template recipients

    // turn recipients into array
    recipients = Array.isArray( recipients ) ? recipients : [ recipients ] ;
       
    // Be aware of plural and singular recipient/s
    // Only send 10 emails at a time
    async.mapLimit( recipients, 10, function( recipient, next){

    	// render single recipient
    	template.render( templateResourceCollector(recipient, additionalObjects), function(err, results){
    	    if(err) return callback( err );
	    
    	    mailClient.from( mailer.client );
    	    mailClient.to( recipient );
    	    mailClient.subject( mailer.subject );
    	    mailClient.html( results.html );
    	    mailClient.text( results.text );
    	    mailClient.send( next );
    	});

    }, callback );
};

exports.newClient = MailClient;
