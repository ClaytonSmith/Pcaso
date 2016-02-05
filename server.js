'use strict'

var bodyParser   = require('body-parser');
var flash        = require('connect-flash');
var cookieParser = require('cookie-parser');
var express      = require('express');
var session      = require('express-session');
var fs           = require('fs');
var mongoose     = require('mongoose');
var morgan       = require('morgan');
var passport     = require('passport');
var join         = require('path').join;

var config       = require('./config/config');
var models       = join( __dirname, 'app/models');
var port         = process.env.PORT || 3000;
var app          = express();


module.exports = app;

/******* Setup *******/


// load Schema
fs.readdirSync(models)
    .filter(function(file){ return file.indexOf('.js', file.length - '.js'.length) != -1 }) // ends with '.js'? 
    .forEach(function(file){ require( join(models, file)) });                               // load in models



require('./config/passport')(passport);                  // pass passport for configuration

app.set('title', 'Pcaso');

// Express init
app.use(morgan('dev'));                                  // Logger
app.use(cookieParser());                                 // read cookies (needed for auth) 
app.use(bodyParser());                              // get information from html forms
app.use(bodyParser.json());                              // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));     

app.set('view engine', 'ejs');                           // set up ejs for templating

// required for passport
app.use(session({ secret: config.secrets.sessionKey })); // session secret
app.use(passport.initialize());
app.use(passport.session());                             // persistent login sessions
app.use(flash());                                        // use connect-flash for flash messages stored in session

app.use(express.static(__dirname + '/data/public'));     // Allonw access to public uploads
app.use(express.static(__dirname + '/public'));          // Allow access to stuff stored in public dir. JS, Css, images....

require('./app/routes.js')(app, passport);               // load our routes and pass in our app and fully configured passport


/******* Start the server *******/
connect()
  .on('error', console.log)      // log on error
  .on('disconnected', connect)   // connect after disconect - recursive
  .once('open', listen);         // start the server


// listen on port and start app
function listen () {
    if (app.get('env') === 'test') return;
    app.listen(port)
    console.log('Express app started on port ' + port);
}

// Connect to mongo server
function connect() {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    return mongoose.connect(config.db, options).connection;
}
