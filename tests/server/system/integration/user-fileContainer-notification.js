'use strict'

var helper               = require('../../../helpers/helper');
var mongoose             = require('mongoose');
var chai                 = require('chai');
var sinon                = require('sinon');
var sinonChai            = require('sinon-chai');
var async                = require('async');
var fs                   = require('fs');
var devNullStream        = require('dev-null-stream');
var Promise              = require('bluebird');
var faker                = require('faker');

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


describe('User - FileContainer - Notification: Integration test', function(){
    
    // Our soon to be users
    var user1 = null;
    var user2 = null;

    var user1Template = null;
    var user2Template = null;
    
    var fileCntr = null;

    var fileTemplate = helper.fileTemplate;
    
    before( function(done){
	done();
    });
    
    
    beforeEach( function(done){
	fileCntr = null;
	
	user1Template = helper.genUser();
	user2Template = helper.genUser();
	
	user1 = User.register(
	    user1Template.name.first,
	    user1Template.name.last,
	    user1Template.email,
	    user1Template.password,
	    user1Template.username
	);

	user2 = User.register(
	    user2Template.name.first,
	    user2Template.name.last,
	    user2Template.email,
	    user2Template.password,
	    user2Template.username
	);

	user1.save(function(err){
	    if( err ) done( err );
	    user2.save(done);
	});

    });
    
    afterEach( function(done){
	async.parallel(
	    [
		function(parallelCB){
		    User.findOne( { _id: user1._id }, parallelCB );
		},
		
		function(parallelCB){
		    User.findOne( { _id: user2._id }, parallelCB );
		}
	    ],
	    function(err, results){
		if( err ) return done( err );
		else async.each( results, function(user, callback){ user.remove( callback ) }, done ); 
	    });	
    });

    
    it('Users should exist', function(){
	expect( user1 ).to.not.be.null;
	expect( user2 ).to.not.be.null;	
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
		expect( fileCntr.viewableTo( user1 ) ).to.be.true;
		expect( fileCntr.viewableTo( user2 ) ).to.be.false;
	    });
	    
	    return new Promise( function(resolve, reject){
	    	fc.addSharedEntity( user2, function(err){
		    if( err ) reject( done, err );
		    else resolve()
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(){
	    check(function(){	    
		expect( fileCntr.viewableTo( user1 ) ).to.be.true;
		expect( fileCntr.viewableTo( user2 ) ).to.be.true;
	    });
	    
	    return new Promise( function(resolve, reject){
	    	User.findOne( { _id: user2._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc )
		});
	    });
	}).catch( function(d,e){d(e)} ).then( function(updatedUser){
	    user2 = updatedUser;
	    check(function(){
		expect( user2.notifications.length ).to.equal( 1 );
		done();
	    });
	});
    });
});
