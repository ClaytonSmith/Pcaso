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
};

exports.fileTemplate =	{
    file: {
	name: 'test file',
	path: './data/test/test-file.txt'
    },
    settings:{
	fileOptions: {
	    keepFile: true
	    },
	displaySettings:{
	    display: {
		columnTypes: ['id','id','id'] // Arbitrary 
	    }
	}
    }
};

exports.check = function(done ){
    return function(test){
	try{
	    tests()
	} catch( error ) {
	    console.log( error );
	    done( error );
	    throw new Error( error );
	}
    };
}
        
