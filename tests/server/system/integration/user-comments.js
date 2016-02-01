'use strict'

var helper               = require('../../../helpers/helper');
var mongoose             = require('mongoose');
var chai                 = require("chai");
var sinon                = require("sinon");
var sinonChai            = require("sinon-chai");
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

describe('User - Comments: Integration test', function(){
    
    var user1 = null;
    var user2 = null;

    var user1Template = null;
    var user2Template = null;
    
    var targetEntity = null;
    
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
    
    afterEach(function(done){
	user1.remove(function(err){
	    if( err ) return done( err );
	    user2.remove(done);
	});
    });

    it('Ensure test object exist', function(){
	expect( user1 ).to.not.be.null;
	expect( user2 ).to.not.be.null;	
    });

    it('User comments on themself', function(done){
	var spy = sinon.spy();
	
	var comment = user1.leaveComment(user1, commentTemplate.subject, commentTemplate.body, function(err){
	    expect( err ).to.equal.null
	    
	    expect( user1.userComments.length ).to.equal( 1 );
	    expect( user1.comments.length ).to.equal( 1 );
	    
	    expect( user1.userComments ).to.include( comment._id );
	    expect( user1.comments ).to.include( comment._id );
	    
	    Comment.findOne({ _id: comment._id}, function(err, result){
		expect( err ).to.be.null;

		expect( result.parent.id ).to.equal( String( user1._id ) );
		expect( result.parent.collectionName ).to.equal( user1.__t );

		expect( result.target.id ).to.equal( String( user1._id ) );
		expect( result.target.collectionName ).to.equal( user1.__t );

		done();
	    });
	});
    });
    
    /*****************************************************************************************************/
    /*****************************************************************************************************/
    /*****************************************************************************************************/
    /*****************************************************************************************************/

    it('User comments on themself and removes comment', function(done){
	
	// just in case the DB is being slow or on a lesser powerful machine
	this.timeout(5000);
	
	// Helper catches test errors in thrown the promises and brings them back into view of the test
	// any errors thrown in the test will make the test fail silently
	var check = helper.check( done );

	var promise= new Promise( function(resolve, reject){
	    var comment = user1.leaveComment(user1, commentTemplate.subject, commentTemplate.body, function(err){	
		if( err ) done( err );
		else resolve( comment );
	    });
	});

	// LEAVE COMMENT
	promise.then( function(comment){
	    
	    // Check that comment was left on the user
	    check(function(){
		expect( user1.userComments.length ).to.equal( 1 );
		expect( user1.userComments ).to.include( comment._id );	
		expect( user1.comments.length ).to.equal( 1 );
		expect( user1.comments ).to.include( comment._id );
	    });

	    return new Promise(function(resolve, reject){
		user1.removeComment(comment._id, function( err, removedComment){
		    if( err ) done( err );
		    else resolve( removedComment );
		});
	    }); // REMOVE COMMENT
	}).then( function(comment){
	    
	    // Make sure comment is remove from user
	    check(function(){
		expect( user1.userComments.length ).to.equal( 0 );
		expect( user1.comments.length ).to.equal( 0 );
	    });	    

	    return new Promise(function(resolve, reject){
		Comment.findOne({ _id: comment._id}, function(err, comment){
		    if( err ) done( err );
		    else resolve( comment );
		});
	    }); // VALIDATE
	}).then( function(comment){
	    
	    // check that the comment was deleted
	    check(function(){
		expect( comment ).to.not.exist;
		done();
	    });
	});
    });

    /*****************************************************************************************************/
    /*****************************************************************************************************/
    /*****************************************************************************************************/
    /*****************************************************************************************************/

    it('User comments on other user', function(done){
	
	// Keep track of comment ID throughout this mess of a test
	var comment = null;
	
	// just in case the DB is being slow or on a lesser powerful machine
	this.timeout(5000);
	
	// Helper catches test errors in thrown the promises and brings them back into view of the test
	// any errors thrown in the test will make the test fail silently
	var check = helper.check( done );
        
	// Create comment
	var promise= new Promise( function(resolve, reject){
	    comment = user1.leaveComment(user2, commentTemplate.subject, commentTemplate.body, function(err){
		if( err ) done( err );
		else resolve( comment );
	    });
	});

	//--------------------------------------------------
	// Check comment was left on propper entities
	promise.then( function(comment){
	    
	    // Check that comment was left on the user
	    check(function(){
		expect( user1.userComments.length ).to.equal( 1 );
		expect( user1.userComments ).to.include( comment._id );	
	    	expect( user1.comments.length ).to.equal( 0 );
	    });	

	    
	    return new Promise(function(resolve, reject){
		User.findOne({ _id: user2._id}, function(err, updatedUser){
		    if( err ) done( err );
		    else resolve( updatedUser );
		});
	    }); // VALIDATE
	}).then(function(updatedUser){
	    user2 = updatedUser;
	    check(function(){
		expect( user2.userComments.length ).to.equal( 0 );	
		expect( user2.comments.length ).to.equal( 1 );
		expect( user2.comments ).to.include( comment._id );
	    });
	    
	    //--------------------------------------------------
	    // Remove comment
	    return new Promise(function(resolve, reject){
	    	user1.removeComment(comment._id, function( err, removedComment){
	    	    if( err ) done( err );
	    	    else resolve( removedComment );
	    	});
	    });
	}).then( function(removedComment){
	    
	    // check that the comment was removed on the parent users 
	    check(function(){
	    	expect( user1.userComments.length ).to.equal( 0 );
	    });	    
	    
	    //--------------------------------------------------
	    // Reload target entity ( user2 ) to ensure
	    // comment was removed from there documents
	    return new Promise(function(resolve, reject){
		User.findOne({ _id: user2._id}, function(err, updatedUser){
		    if( err ) done( err );
		    else resolve( updatedUser );	    
		});
	    }); 
	}).then(function(updatedUser){
	    user2 = updatedUser;

	    // Make sure comment is remove from user
	    check(function(){
		expect( updatedUser.comments.length ).to.equal( 0 );
	    });	    
	    
	    //--------------------------------------------------
	    // >TRY< to find comment. We should not find it
	    // because it should not exist
	    return new Promise(function(resolve, reject){	
		Comment.findOne({ _id: comment._id}, function(err, result){
		    if( err ) done( err );
		    else resolve( result );
		});
	    }); // VALIDATE
	}).then( function(result){
	    
	    // check that the comment no longer exists
	    check(function(){
		expect( result ).to.not.exist;
		done();
	    });
	});
    });
    
    /*****************************************************************************************************/
    /*****************************************************************************************************/
    /*****************************************************************************************************/
    /*****************************************************************************************************/

    it('User comments on another users comment', function(done){
    	// User1 comments on user2's account
    	// User2 comments on user1's comment
    	// User1's comment is then deleted
    	// User2's comment and the record of user1's comment should be deleted
	
	
    	// Keep track of comment throughout this mess of a test
    	var comment1 = null;
    	var comment2 = null;

    	// just in case the DB is being slow or on a lesser powerful machine
    	this.timeout(5000);
	
    	// Helper catches test errors in thrown the promises and brings them back into view of the test
    	// any errors thrown in the test will make the test fail silently
	var check = helper.check( done );

    	// Create comment
    	var promise= new Promise( function(resolve, reject){
    	    comment1 = user1.leaveComment(user2, commentTemplate.subject, commentTemplate.body, function(err){
    		if( err ) reject( done, err);
    		else resolve( comment1 );
    	    });
    	});
	
    	//--------------------------------------------------
    	//--------------------------------------------------
    	// Check comment was left on propper entities
    	promise.then( function(comment){
	    
    	    // Check that comment was left on the user
    	    check(function(){
    		expect( user1.userComments.length ).to.equal( 1 );
    		expect( user1.userComments ).to.include( comment._id );	
    		expect( user1.comments.length ).to.equal( 0 );
		
    		expect( user2.userComments.length ).to.equal( 0 );	
    		expect( user2.comments.length ).to.equal( 1 );
    		expect( user2.comments ).to.include( comment._id );
    	    });
	    
    	    //--------------------------------------------------
    	    //--------------------------------------------------
    	    // Leave second comment on first comment
    	    return new Promise(function(resolve, reject){
    		comment2 = user2.leaveComment(comment1, commentTemplate.subject, commentTemplate.body, function(err){
		    if( err ) reject( done, err);
    		    else resolve( comment2 );
    		});	    
    	    });
    	}).catch( function(d,e){d(e)} ).then( function(newComment){
    	    check(function(){
		
		// first user is parent of comment1
    		expect( comment1.parent.id ).to.equal( user1._id.toString() );
    		expect( comment1.parent.collectionName ).to.equal( user1.__t );

		// Comment1's target is user2
    		expect( comment1.target.id ).to.equal( user2._id.toString() );
    		expect( comment1.target.collectionName ).to.equal( user2.__t );		
		
		// Comment2's parent is user2
    		expect( newComment.parent.id ).to.equal( user2._id.toString() );
    		expect( newComment.parent.collectionName ).to.equal( user2.__t );

		// Comment2's target is comment1
    		expect( newComment.target.id ).to.equal( comment1._id.toString() );
    		expect( newComment.target.collectionName ).to.equal( comment1.__t );
		
    	    });
	    
	    
    	    //--------------------------------------------------
    	    //--------------------------------------------------
    	    // reload first as it should have been changed
    	    return new Promise(function(resolve, reject){	
    		Comment.findOne({ _id: comment1._id}, function(err, result){
    		    if( err ) reject( done, err);
    		    else resolve( result );
    		});
    	    }); // VALIDATE
    	}).catch( function(d,e){d(e)} ).then(function(updatedComment){
	    
    	    comment1 = updatedComment;
    	    check(function(){
    		expect( comment1.children.length ).to.equal( 1 );
    		expect( comment1.children ).to.include( comment2._id );
    	    });
	    

    	    //--------------------------------------------------
    	    //--------------------------------------------------
    	    // Remove first comment
    	    return new Promise(function(resolve, reject){
    		user1.removeComment(comment1._id, function( err, removedComment){
    		    if( err ) reject( done, err);
    		    else resolve( removedComment );
    		});
    	    });
    	}).catch( function(d,e){d(e)} ).then( function(removedComment){
	    
	    
    	    //--------------------------------------------------
    	    //--------------------------------------------------
    	    // ensure first comment was removed
    	    return new Promise(function(resolve, reject){	
    		Comment.findOne({ _id: comment1._id}, function(err, result){
    		    if( err ) reject( done, err);
    		    else resolve( result );
    		});
    	    });
	    
    	}).catch( function(d,e){d(e)} ).then(function(comment){
    	    check(function(){
    		expect( comment ).to.not.exist;
    	    });	    
	    

    	    //--------------------------------------------------
    	    //--------------------------------------------------
    	    // ensure second comment was remove- Parent was removed
    	    // so the children should be gone too
    	    return new Promise(function(resolve, reject){	
    		Comment.findOne({ _id: comment2._id}, function(err, result){
    		    if( err ) reject( done, err);
    		    else resolve( result );
    		});
    	    }); // VALIDATE
	    
    	}).catch( function(d,e){d(e)} ).then(function(comment){
	    
    	    check(function(){
    		expect( comment ).to.not.exist;
    	    });	    
	    

    	    //--------------------------------------------------
    	    //--------------------------------------------------
    	    // Reload first user and check that comments were removed
    	    return new Promise(function(resolve, reject){
    		User.findOne({ _id: user1._id}, function(err, updatedUser){
    		    if( err ) reject( done, err);
    		    else resolve( updatedUser );
		    
    		});
    	    }); 
    	}).catch( function(d,e){d(e)} ).then(function(updatedUser){
	    user1 = updatedUser;

    	    // Make sure comment is remove from user
    	    check(function(){
    		expect( updatedUser.comments.length ).to.equal( 0 );
    		expect( updatedUser.userComments.length ).to.equal( 0 );
    	    });	


    	    //--------------------------------------------------
    	    //--------------------------------------------------
    	    // Reload second user and check that comments were removed
    	    return new Promise(function(resolve, reject){
    		User.findOne({ _id: user2._id}, function(err, updatedUser){
    		    if( err ) reject( done, err);
    		    else resolve( updatedUser );  
    		});
    	    }); 
    	}).catch( function(d,e){d(e)} ).then(function(updatedUser){
	    user2 = updatedUser;
    	    // Make sure comment is remove from user
    	    check(function(){
    		expect( updatedUser.comments.length ).to.equal( 0 );
    		expect( updatedUser.userComments.length ).to.equal( 0 );
		done();    	    
	    });	      	    
    	}).catch( function(d,e){d(e)} );
    });
});
