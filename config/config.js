'use strict'

var path         = require('path');
var extend       = require('util')._extend;

var development  = require('./env/development');
var test         = require('./env/test');
var production   = require('./env/production');
var secrets      = require('./secrets');


var defaults = {
    root: path.join(__dirname, '..'),
    secrets: secrets,
    defaultAvatarPath: path.join(__dirname, '..') +"/public/imgs/default-avatar",
    accounts: {
	passwordRecoveryExpiration: 72 // hours
    }
};

/**
 * Expose
 */

module.exports = {
  development:  extend(development, defaults),
  test:         extend(test, defaults),
  production:   extend(production, defaults)
}[process.env.NODE_ENV || 'development'];
