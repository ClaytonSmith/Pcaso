var mongoose             = require('mongoose');
var chai                 = require("chai");
var sinon                = require("sinon");
var sinonChai            = require("sinon-chai");
var devNullStream        = require('dev-null-stream');

var FileContainer        = mongoose.model('FileContainer');
var UnauthenticatedUser  = mongoose.model('UnauthenticatedUser');
var Comment              = mongoose.model('Comment');
var User                 = mongoose.model('User');
var FakeModel            = mongoose.model('FakeModel');

chai.should();
chai.use( sinonChai );

var expect = chai.expect;

describe('User integration test', function(){
    
    var user = null;
    var user2 = null;
    var targetEntity = null;

    var userTemplate = {
	name: {
	    first: "Testy",
	    last: "McTestsalot"
	},
	email: 'Test@cool.com',
	password: 'Super Secure'
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
	user  = User(userTemplate);
	user2 = User(userTemplate);
	user.save(function(err){
	    if( err ) done( err );
	    user2.save( done );
	});
    });
    
    afterEach(function(done){
	user.remove(done);
    });

    it('Ensure test object exist', function(){
	expect( user ).to.not.be.null;
	expect( user2 ).to.not.be.null;
	
    });

    it('User comments on themself', function(done){
	var spy = sinon.spy();
	
	var commentID = user.leaveComment(user, commentTemplate.subject, commentTemplate.body, function(err){
	    expect( err ).to.equal.null
	    
	    expect( user.userComments.length ).to.equal( 1 );
	    expect( user.comments.length ).to.equal( 1 );
	    
	    expect( user.userComments ).to.include( commentID );
	    expect( user.comments ).to.include( commentID );
	    
	    Comment.findOne({ _id: commentID}, function(err, comment){
		expect( err ).to.be.null;

		expect( comment.parent.id ).to.equal( String( user._id ) );
		expect( comment.parent.collectionName ).to.equal( user.__t );

		expect( comment.target.id ).to.equal( String( user._id ) );
		expect( comment.target.collectionName ).to.equal( user.__t );

		done();
	    });
	});
    });
    
    it('User comments on themself and removes comment', function(done){
	
	

	// just in case the DB is being slow or on a lesser powerful machine
	this.timeout(5000);
	
	// Helper catches test errors in thrown the promises and brings them back into view of the test
	// any errors thrown in the test will make the test fail silently
	function check(f){ try{ f() } catch( e ){ done(e); }};
        
	var promise= new Promise( function(resolve, reject){
	    var commentID = user.leaveComment(user, commentTemplate.subject, commentTemplate.body, function(err){
		if( err ) done( err );
		else resolve( commentID );
	    });
	});

	// LEAVE COMMENT
	promise.then( function(commentID){
	    
	    // Check that comment was left on the user
	    check(function(){
		expect( user.userComments.length ).to.equal( 1 );
		expect( user.userComments ).to.include( commentID );	
		expect( user.comments.length ).to.equal( 1 );
		expect( user.comments ).to.include( commentID );
	    });

	    return new Promise(function(resolve, reject){
		user.removeComment(commentID, function( err, removedComment){
		    if( err ) done( err );
		    else resolve( removedComment );
		});
	    }); // REMOVE COMMENT
	}).then( function(comment){
	    
	    // Make sure comment is remove from user
	    check(function(){
		expect( user.userComments.length ).to.equal( 0 );
		expect( user.comments.length ).to.equal( 0 );
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


    it('User comments on other user', function(done){
	
	// Keep track of comment ID throughout this mess of a test
	var commentID = null;
	
	// just in case the DB is being slow or on a lesser powerful machine
	this.timeout(5000);
	
	// Helper catches test errors in thrown the promises and brings them back into view of the test
	// any errors thrown in the test will make the test fail silently
	function check(f){ try{ f() }catch( e ){ done(e); }};
        
	// Create comment
	var promise= new Promise( function(resolve, reject){
	    commentID = user.leaveComment(user2, commentTemplate.subject, commentTemplate.body, function(err){
		if( err ) done( err );
		else resolve( commentID );
	    });
	});

	//--------------------------------------------------
	// Check comment was left on propper entities
	promise.then( function(comment){
	    
	    // Check that comment was left on the user
	    check(function(){
		expect( user.userComments.length ).to.equal( 1 );
		expect( user.userComments ).to.include( commentID );	
		expect( user.comments.length ).to.equal( 0 );
		
		expect( user2.userComments.length ).to.equal( 0 );	
		expect( user2.comments.length ).to.equal( 1 );
		expect( user2.comments ).to.include( commentID );
	    });
	    
	    //--------------------------------------------------
	    // Remove comment
	    return new Promise(function(resolve, reject){
		user.removeComment(commentID, function( err, removedComment){
		    if( err ) done( err );
		    else resolve( removedComment );
		});
	    });
	}).then( function(comment){
	    
	    // check that the comment was removed on the parent users 
	    check(function(){
		expect( user.userComments.length ).to.equal( 0 );
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
	    
	    
	    // Make sure comment is remove from user
	    check(function(){
		expect( updatedUser.comments.length ).to.equal( 0 );
	    });	    
	    
	    //--------------------------------------------------
	    // >TRY< to find comment. We should not find it
	    // because it should not exist
	    return new Promise(function(resolve, reject){	
		Comment.findOne({ _id: commentID}, function(err, result){
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
});
