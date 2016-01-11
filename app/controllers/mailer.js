'use strict';

var nodemailer = require('nodemailer');
// Create a SMTP transporter object
var transporter = nodemailer.createTransport(
    { host: 'smtpout.secureserver.net', 
      port: 465, 
      auth: {
          user: 'mail@pcaso.io',
          pass: 'lego2020.Gulch'
      },
      
      secure: true
    }
);

console.log('SMTP Configured');

// Message object
var message = {

    // sender info
    from: 'Pcaso Authentication Service <mail@pcaso.io>',
    
    // Comma separated list of recipients
    //to: '"Clayton Smith" <clayton_smith@student.uml.edu>, "Nathaniel Pearson" <nathaniel.pearson@gmail.com>',
    to: '"Clayton Smith" <clayton_smith@student.uml.edu>',// "Nathaniel Pearson" <nathaniel.pearson@gmail.com>',
    
    // Subject of the message
    subject: "First automated email", //
    
    headers: {
        'X-Laziness-level': 1000
    },

    // plaintext body
    text: 'Hello to myself!',

    // HTML body
    html: '<p><b>YES!!</b></p>' +
        '<p>If you can read this email, then pcaso.io is now able to send automated emails.</p>'+
	'<p>Css Test:</p>' +
	'<p><h1>Heading 1</h1><p>' +
	'<p><h2>Heading 2</h2><p>' +
	'<p><h3>Heading 3</h3><p>' +
	'<p><h4>Heading 4</h4><p>' +
	'<p><h5>Heading 5</h5><p>',
    
    // An array of attachments
    attachments: [ ]
};


console.log('Sending Mail');
transporter.sendMail(message, function(error, info) {
    if (error) { console.log(error.message); return; }
    console.log('Server responded with "%s"', info.response);
});
