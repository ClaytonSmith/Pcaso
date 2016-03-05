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
var MongoStore   = require('connect-mongo')(session);

var config       = require('./config/config');
var models       = join( __dirname, 'app/models');
var port         = process.env.PORT || 3000;
var app          = express();


module.exports = app;

/******* Setup *******/

// Set time zone to GMT
process.env.TZ = 'Europe/Amsterdam' 

// load Schema
fs.readdirSync(models)
    .filter(function(file){ return file.indexOf('.js', file.length - '.js'.length) != -1 }) // ends with '.js'? 
    .forEach(function(file){ require( join(models, file)) });                               // load in models

var options = { server: { socketOptions: { keepAlive: 1 } } };
mongoose.connect(config.db, options).connection;

require('./config/passport')(passport);                  // pass passport for configuration

app.set('title', 'Pcaso');

// Express init
app.use(morgan('dev'));                                  // Logger

/******* Start the server *******/
connect()
  .on('error', console.log)      // log on error
  .on('disconnected', connect)   // connect after disconect - recursive
  .once('open', listen);         // start the server


