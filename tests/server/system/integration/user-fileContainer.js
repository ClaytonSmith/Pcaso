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
    
    
    var user1    = null;
    var user2    = null;
    var fileCntr = null;

    var userTemplate = {
	email: 'Test@cool.com',
	password: 'Super Secure'
    };
    
    var fileTemplate = {
	file: {
	    name: 'test file',
	    path: './data/test/test-file.txt'
	},
	settings:{
	    fileOptions: {
		keepFile: true
	    },
	    displaySettings:{
		// null
	    }
	}
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

    
    it('Users should exist', function(){
	expect( user1 ).to.not.be.null;
	expect( user2 ).to.not.be.null;	
    });

    it('Register file with user1', function(done){
	
	function check(f){ try{ f() }catch( e ){ done(e); };};
	
	var promise = new Promise( function(resolve, reject){
	    fileCntr = user1.registerFile(fileTemplate.file, fileTemplate.settings, function(err){
		if( err ) reject( done, err );
		else resolve( fileCntr );
	    });
	});
	
	promise.then(function( fc ){
	    check(function(){
		expect( user1.files ).to.include( fc._id );
		expect( fc.parent.id ).to.equal( user1._id.toString() );
		expect( fc.parent.collectionName ).to.equal( user1.__t );
		done();
	    });
	}).catch( function(d,e){d(e)} );
    });
});
