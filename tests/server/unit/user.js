'use strict'

var helper = require('../../helpers/helper');

var mongoose             = require('mongoose');
var chai                 = require("chai");
var sinon                = require("sinon");
var sinonChai            = require("sinon-chai");
var faker                = require('faker');

var UnauthenticatedUser  = mongoose.model('UnauthenticatedUser');
var User                 = mongoose.model('User');

chai.should();
chai.use( sinonChai );

var expect = chai.expect;


describe('Unauthenticated user', function(){
        // Our soon to be unregistered user
    var user = null;
    var userTemplate = null;
    
    beforeEach( function(done){
	userTemplate = helper.genUser();
	
	// Create user
	user = UnauthenticatedUser.register(
	    userTemplate.name.first,
	    userTemplate.name.last,
	    userTemplate.email,
	    userTemplate.password
	);
	
	user.save( done );
    });
    
    afterEach(function(done){
	user.remove(done);	
    });
    

    it('Ensure user has been saved', function(){
	expect( user ).to.exist;
    });

    it('Password encription', function(){
	expect( user.password ).not.equal( userTemplate.password );
    });             
    
    it('User information saved correctly', function(){
	expect( user.name.first ).equal( userTemplate.name.first );
	expect( user.name.last ).equal( userTemplate.name.last );
	expect( user.email ).equal( userTemplate.email );
    });

});


describe('User', function(){
    
    // Our soon to be unregistered user
    var user = null;
    var userTemplate = null;
    
    beforeEach( function(done){
	userTemplate = helper.genUser();
	
	user = User.register(
	    userTemplate.name.first,
	    userTemplate.name.last,
	    userTemplate.email,
	    userTemplate.password,
	    userTemplate.username
	);
	
	//console.log( user );
	user.save( done );
    });
    
    afterEach(function(done){
	user.remove( done );
    });
    

    it('Ensure user has been saved', function(){
	expect( user ).to.exist;
    });

    it('Password encription', function(){
	expect( user.password ).not.equal( userTemplate.password );
    });
    
    it('User information saved correctly', function(){
	expect( user.name.first ).equal( userTemplate.name.first );
	expect( user.name.last ).equal( userTemplate.name.last );
	expect( user.email ).equal( userTemplate.email );
    });

    it('Attach file', function(){
	var file = mongoose.Types.ObjectId(); // fake the obejct ID
	user.attachFile( file ); //
	expect( user.files.length ).to.equal( 1 );
	expect( user.files ).to.include( file  );
    });
    
    it('Attach and remove file', function(done){
	var file = mongoose.Types.ObjectId(); // fake the obejct ID
	user.attachFile( file ); //
	expect( user.files.length ).to.equal( 1 );
	expect( user.files ).to.include( file  );
	
	user.removeFile( file, function(err){
	    if( err ) done(err);
	    expect( user.files.length ).to.equal( 0 );
	    expect( user.files ).to.not.include( file  );
	    done();
	});
    });

    it('Add comment', function(){
	var comment = mongoose.Types.ObjectId(); // fake the obejct ID
	user.addComment(comment);
	
	expect( user.comments.length ).to.equal( 1 );
	expect( user.comments ).to.include( comment  );
    });
    
   it('Add new notification', function(  ){

       // create notification id
       var notificationID =  mongoose.Types.ObjectId();

       // Add a single notification 
       user.addNotification( notificationID );
       expect( user.notifications.length ).to.equal( 1 );
   });

    
    it('Add and remove notification', function(done){
	
	// create notification id
	var notificationID =  mongoose.Types.ObjectId();
	
	user.addNotification( notificationID );
	expect( user.notifications.length ).to.equal( 1 );
	
	user.removeNotification( notificationID, function(err){
	    if( err ) return done(err);
	    
	    expect( user.notifications.length ).to.equal( 0 );
	    
	    done( null );
	});
    });

    
    it('Add and remove comment', function(done){
	var comment = mongoose.Types.ObjectId(); // fake the obejct ID
	user.addComment(comment);
	
	expect( user.comments.length ).to.equal( 1 );
	expect( user.comments ).to.include( comment  );
	
	user.removeComment( comment, function(err){
	    expect( err ).to.be.null;
	    expect( user.comments.length ).to.equal( 0 );
	    expect( user.comments ).to.not.include( comment  );
	    done();
	});
    });    
});
