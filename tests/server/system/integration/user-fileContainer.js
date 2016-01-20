var mongoose             = require('mongoose');
var chai                 = require('chai');
var sinon                = require('sinon');
var sinonChai            = require('sinon-chai');
var fs                   = require('fs');
var devNullStream        = require('dev-null-stream');

var FileContainer        = mongoose.model('FileContainer');
var User                 = mongoose.model('User');
var FakeModel            = mongoose.model('FakeModel');

chai.should();
chai.use( sinonChai );

var expect = chai.expect;

var devNullOpts = {
    highWaterMark: 2
}

var devNull = new devNullStream( devNullOpts);


describe('User File Container integration test', function(){
    
    // Our soon to be unregistered user
    var fileCntr = null;   
    var user1    = null;
    var user2    = null;
    
    var userTemplate = {
	email: 'Test@cool.com',
	password: 'Super Secure'
    };
    
    var fileTemplate = {
	file: {
	    name: 'test file',
	    path: './data/test/test-file.txt'
	},
	keepFile: true
    };
    
    before( function(done){
	done();
    });
    
    
    beforeEach( function(done){
	
	userTemplate.name = { first: 'User 1', last: 'test subject 1' };
	user1 = User(userTemplate);
	
	userTemplate.name = { first: 'User 2', last: 'test subject 2' };	
	user2 = User(userTemplate);

	user1.save(function(err){
	    if( err ) done( err );
	    user2.save(done);
	});

    });
    
    afterEach( function(done){
	
	user1.remove(function(err){
	    if( err ) done( err );
	    user2.remove(done);
	});
    });

    
    it('Container should exist', function(){
	
	// fileCntr = new FileContainer( fileTemplate );
	// fileCntr.save(done);
	// expect( fileCntr ).to.exist;
    });
});
