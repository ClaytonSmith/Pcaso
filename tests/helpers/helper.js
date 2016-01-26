'use strict'

var faker                = require('faker');

process.env['NODE_ENV'] = 'test';

require('./chai');
require('../../server');

exports.genUser = function(){
    var user = {
	name: {
	    first: faker.name.firstName(),
	    last: faker.name.lastName(),
	},
	email: faker.internet.email(),
	password: faker.internet.password(),
	username: faker.internet.userName()
    };
    
    return user;
}

exports.check = function( done ){
    return function(tests){
	try{
	    tests()
	} catch( error ) {
	    done( error );
	    throw new Error(e);
	}
    };
}
        
