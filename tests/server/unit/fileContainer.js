var mongoose             = require('mongoose');
var chai                 = require("chai");
var sinon                = require("sinon");
var sinonChai            = require("sinon-chai");

var FileContainers       = mongoose.model('FileContainer');

chai.should();
chai.use( sinonChai );


var expect = chai.expect;


describe('FileContainer', function(){
    
    // Our soon to be unregistered user
    var fileCntr = null;
    var userTemplate = {
	name: {
	    first: "Testy",
	    last: "McTestsalot"
	},
	email: 'Test@cool.com',
	password: 'Super Secure'
    };
    
    beforeEach( function(done){
	
    });
    
    afterEach(function(done){
	fileCntr.remove();
	done();	
    });
});
