'use strict'

var helper               = require('../../../helpers/helper');
var mongoose             = require('mongoose');
var chai                 = require("chai");
var sinon                = require("sinon");
var sinonChai            = require("sinon-chai");
var async                = require('async');
var devNullStream        = require('dev-null-stream');
var Promise              = require('bluebird');
var faker                = require('faker');

var FileContainer        = mongoose.model('FileContainer');
var UnauthenticatedUser  = mongoose.model('UnauthenticatedUser');
var Comment              = mongoose.model('Comment');
var User                 = mongoose.model('User');
var FakeModel            = mongoose.model('FakeModel');

chai.should();
chai.use( sinonChai );

var expect = chai.expect;
var assert = chai.assert;

describe('User - Comments - Notification: Integration test', function(){

    var user1 = null;
    var user2 = null;

    var user1Template = null;
    var user2Template = null;
    
    var targetEntity = null;

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
		// Set to private for visibility test
		visibility: "PRIVATE"
	    }
	}
    };
        
    var commentTemplate = {
	subject: 'test',
	body: "Hello"
    };
    
    before(function(done){
	targetEntity = new FakeModel({});
	targetEntity.save(done);
    });
    
    beforeEach( function(done){	
	user1Template = helper.genUser();
	user2Template = helper.genUser();
	
	user1 = User.register(
	    user1Template.name.first,
	    user1Template.name.last,
	    user1Template.email,
	    user1Template.password
	);

	user2 = User.register(
	    user2Template.name.first,
	    user2Template.name.last,
	    user2Template.email,
	    user2Template.password
	);
	
	user1.save(function(err){
	    if( err ) done( err );
	    user2.save(done);
	});
    });
    

    // Update user before remove to ensure all modified fields are captured 
    afterEach(function(done){
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
		else async.map( results, function(user, callback){ user.remove( callback ) }, done ); 
	    });	
    });
    
    it('Ensure test object exist', function(){
	expect( user1 ).to.not.be.null;
	expect( user2 ).to.not.be.null;	
    });

    
    it("User1 comments on User1's account: expect no notification", function(done){
    	var check = helper.check(done);
	
    	// Keep track of comment throughout this mess of a test
    	var comment1 = null;

    	
    	new Promise( function(resolve, reject){
    	    comment1 = user1.leaveComment(user1, commentTemplate.subject, commentTemplate.body, function(err){
    		if( err ) reject( done, err);
    		else resolve( comment1 );
    	    });
    	}).catch( function(e){ done(e) }).then(function(){
	    
    	    return new Promise( function(resolve, reject){
    		User.findOne( { _id: user1._id }, function(err, doc){
    		    if( err || !doc ) reject( ( err || new Error( 'No Doc' ) ) );
    		    else { user1 = doc ; resolve( doc ); } 
    		});
    	    });
    	}).catch( function(e){ done(e) }).then(function(updatedUser){
    	    check(function(){
    		expect( user1.notifications.length ).to.equal( 0 );
    		done();
    	    });
    	});
    });
    
    it("User2 comments on User1's account: expect notification", function(done){
    	var check = helper.check(done);
	
    	// Keep track of comment throughout this mess of a test
    	var comment1 = null;

    	
    	new Promise( function(resolve, reject){
    	    comment1 = user2.leaveComment(user1, commentTemplate.subject, commentTemplate.body, function(err){
    		if( err ) reject( done, err);
    		else resolve( comment1 );
    	    });
    	}).catch( function(e){ done(e) }).then(function(){
	    
    	    return new Promise( function(resolve, reject){
    		User.findOne( { _id: user1._id }, function(err, doc){
    		    if( err || !doc ) reject( ( err || new Error( 'No Doc' ) ) );
    		    else { user1 = doc ; resolve( doc ); } 
    		});
    	    });
    	}).catch( function(e){ done(e) }).then(function(updatedUser){
    	    check(function(){
    		expect( user1.notifications.length ).to.equal( 1 );
    		done();
    	    });
    	});
    });

    it("User2 comments on User1's account comment: expect notification", function(done){
    	var check = helper.check(done);
	
    	// Keep track of comment throughout this mess of a test
    	var comment1 = null;
    	var comment2 = null;
	
    	
    	new Promise( function(resolve, reject){
    	    comment1 = user1.leaveComment(user1, commentTemplate.subject, commentTemplate.body, function(err){
    		if( err ) reject( done, err);
    		else resolve( comment1 );
    	    });
    	}).catch( function(e){ done(e) }).then(function(){
    	    return new Promise( function(resolve, reject){
    		User.findOne( { _id: user1._id }, function(err, doc){
    		    if( err || !doc ) reject( ( err || new Error( 'No Doc' ) ) );
    		    else { user1 = doc ; resolve( doc ); } 
    		});
    	    });
    	}).catch( function(e){ done(e) }).then(function(updatedUser){
    	    check(function(){
		
		// Users should not get notified of their own actions
    		expect( user1.notifications.length ).to.equal( 0 );
    	    });
	    
    	    return new Promise( function(resolve, reject){
    		comment2 = user2.leaveComment(comment1, commentTemplate.subject, commentTemplate.body, function(err){
		    if( err ) reject( done, err);
    		    else resolve( comment1 );
    		});
    	    });
    	}).catch( function(e){ done(e) }).then(function(){
	    
    	    return new Promise( function(resolve, reject){
    		User.findOne( { _id: user1._id }, function(err, doc){
    		    if( err || !doc ) reject( ( err || new Error( 'No Doc' ) ) );
    		    else resolve( doc );
    		});
    	    });
    	}).catch( function(e){ done(e) }).then(function(updatedUser){
    	    check(function(){
		expect( updatedUser.notifications.length ).to.equal( 1 );	
    		done();
    	    });
    	});
    });
});
