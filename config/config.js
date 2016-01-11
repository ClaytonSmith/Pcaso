'use strict'

var path         = require('path');
var extend       = require('util')._extend;

var development  = require('./env/development');
var test         = require('./env/test');
var production   = require('./env/production');
var secrets      = require('./secrets');


/*
var notifier = {
  service: 'postmark',
  APN: false,
  email: true, // true
  actions: ['comment'],
  tplPath: path.join(__dirname, '..', 'app/mailer/templates'),
  key: 'POSTMARK_KEY'
}; */

var defaults = {
    root: path.join(__dirname, '..'),
    secrets: secrets,
        
    //notifier: notifier
};

/**
 * Expose
 */

module.exports = {
  development:  extend(development, defaults),
  test:         extend(test, defaults),
  production:   extend(production, defaults)
}[process.env.NODE_ENV || 'development'];
