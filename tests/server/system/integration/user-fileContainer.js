var mongoose             = require('mongoose');
var chai                 = require('chai');
var sinon                = require('sinon');
var sinonChai            = require('sinon-chai');
var fs                   = require('fs');
var devNullStream        = require('dev-null-stream');

var FileContainer        = mongoose.model('FileContainer');
var User                 = mongoose.model('User');
var FakeModel            = mongoose.model('FakeModel');
var async                = require('async');

chai.should();
chai.use( sinonChai );

var expect = chai.expect;

var devNullOpts = {
    highWaterMark: 2
}

var devNull = new devNullStream( devNullOpts);


describe('User - FileContainer: Integration test', function(){
    
    // Our soon to be users
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
	fileCntr = null;
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
	
	function check(f){ try{ f() }catch( e ){ throw new Error( done(e) ); };};

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
    
    it('Register and remove file with user1', function(done){
	
	function check(f){ try{ f() }catch( e ){ throw new Error( done(e) ); };};
	
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
	    });
	    
	    return new Promise( function(resolve, reject){
		user1.removeFile( fc._id, function(err){
		    if( err ) reject( done, err );
		    else resolve( /* Nothing */);
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(){
	    
	    return new Promise( function(resolve, reject){
		User.findOne( { _id: user1._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc )
		});
	    });	    
	}).catch( function(d,e){d(e)} ).then(function(updatedUser){
	    check(function(){
		expect( user1.files ).to.not.include( fileCntr._id );
	    });
	    
	    return new Promise( function(resolve, reject){
		FileContainer.findOne( { _id: fileCntr._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc )
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(query){
	    check(function(){
		expect( query ).to.not.exist;
		done();
	    });
	});
    });
    
    it('File visability: private', function(done){
	
	function check(f){ try{ f() }catch( e ){ throw new Error( done(e) ); };};

	var promise = new Promise( function(resolve, reject){
	    fileCntr = user1.registerFile(fileTemplate.file, fileTemplate.settings, function(err){
		if( err ) reject( done, err );
		else resolve( fileCntr );
	    });
	});
	
	promise.then(function( fc ){
	    check(function(){
		expect( fc.viewableTo( user1 ) ).to.be.true;
		expect( fc.viewableTo( user2 ) ).to.be.false;
		done();
	    });
	    
	}).catch( function(d,e){d(e)} );
    });

    it('File visability: Shared', function(done){
	
	function check(f){ try{ f() }catch( e ){ done(e); };};

	var promise = new Promise( function(resolve, reject){
	    fileCntr = user1.registerFile(fileTemplate.file, fileTemplate.settings, function(err){
		if( err ) reject( done, err );
		else resolve( fileCntr );
	    });
	});
	
	promise.then(function( fc ){
	    check(function(){
		expect( fc.viewableTo( user1 ) ).to.be.true;
		expect( fc.viewableTo( user2 ) ).to.be.false;
	    });

	    fc.addSharedEntity( user2 );
	    
	    return new Promise( function(resolve, reject){
		fc.save(function(err){
		    if( err ) reject( done, err );
		    else resolve()
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(){
	    
	    return new Promise( function(resolve, reject){
		FileContainer.findOne( { _id: fileCntr._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc )
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(fc){
	    check(function(){	    
		expect( fc.viewableTo( user1 ) ).to.be.true;
		expect( fc.viewableTo( user2 ) ).to.be.true;
		done();
	    });
	}).catch( function(d,e){d(e)} );
    });

    it('File visability: Default visibility', function(done){
	
	function check(f){ try{ f() }catch( e ){ done(e); };};
	
	user1.fileSettings.defaults.visibility = 'PUBLIC'
	
	var promise = new Promise( function(resolve, reject){
	    fileCntr = user1.registerFile(fileTemplate.file, fileTemplate.settings, function(err){
		if( err ) reject( done, err );
		else resolve( fileCntr );
	    });
	});
	
	promise.then(function( fc ){
	    check(function(){
		expect( fc.viewableTo( user1 ) ).to.be.true;
		expect( fc.viewableTo( user2 ) ).to.be.true;
		done();
	    });
	    
	}).catch( function(d,e){d(e)} );
    });
    
    it('Remove file when parent is removed', function(done){
	
	function check(f){ try{ f() }catch( e ){ done(e); };};
	
	var promise = new Promise( function(resolve, reject){
	    fileCntr = user1.registerFile(fileTemplate.file, fileTemplate.settings, function(err){
		if( err ) reject( done, err );
		else resolve( fileCntr );
	    });
	});
	
	
	promise.then(function(fc){
	    
	    return new Promise( function(resolve, reject){
	    	try {
		    user1.remove( function(err){
	    		if( err ) reject( done, err );
	    		else resolve( fileCntr );
	    	    });
		} catch(e){
		    console.log( e);
		};
	    });		   
	}).catch( function(d,e){d(e)} ).then(function(fc){
	    
	    return new Promise( function(resolve, reject){
		User.findOne( { _id: user1._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc )
		});
	    });	    
	}).catch( function(d,e){d(e)} ).then(function(updatedUser){

	    check(function(){
		expect( updatedUser ).to.not.exist;
	    });
	    
	    return new Promise( function(resolve, reject){
		FileContainer.findOne( { _id: fileCntr._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc )
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(doc){
	    
	    check(function(){
		expect( doc ).to.not.exist;

		//to appease the afterEach gods 	
		user1 = new FakeModel({});
		user1.save( done );
	    });
	}).catch( function(d,e){d(e)} );
    });
});
