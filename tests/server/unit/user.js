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
	
	user = UnauthenticatedUser.register(
	    userTemplate.name.first,
	    userTemplate.name.last,
	    userTemplate.email,
	    userTemplate.password,
	    userTemplate.username
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
	
	expect( user.password ).not
	    .equal( userTemplate.password );
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
	
	user.save( done );
    });
    
    afterEach(function(done){
	user.remove( done );
    });
    

    it('Ensure user has been saved', function(){
	expect( user ).to.exist;
    });

    it('Password encription', function(){
	expect( user.password ).not
	    .equal( userTemplate.password );
    });
    
    it('User information saved correctly', function(){
	expect( user.name.first ).equal( userTemplate.name.first );
	expect( user.name.last ).equal( userTemplate.name.last );
	expect( user.email ).equal( userTemplate.email );
	expect( user.username ).equal( userTemplate.username );
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

    //it('Add new notification', function(){
	// create notification
	//var notification = new Notification({ -- });
	//use.addNotification( notification );
	//expect( user.notifications.length ).to.equal( 1 );
    //});

    //it('Mark notification as read', function(){
    // create notification
    // var notification = new Notification({ -- });
    // use.addNotification( notification );
    // expect( user.notifications.length ).to.equal( 1 );
    // user.markNotificationAsRead( notification );
    // expect( user.notifications.length ).to.equal( 1 );
    // expect( user.notifications[0] ).to.equal( -- );
    //});
    
    // it('Add new notification', function(){
    // create notification
    // var notification = new Notification({ -- });
    // use.addNotification( notification );
    // expect( user.notifications.length ).to.equal( 1 );
    // user.removeNotification( notification );
    // expect( user.notifications.length ).to.equal( 0 );
    // });
    

    // it('Add comment, expect notification', function(){
    // 	var comment = mongoose.Types.ObjectId(); // fake the obejct ID
    // 	user.addComment(comment);
	
    // 	expect( user.comments.length ).to.equal( 1 );
    // 	expect( user.comments ).to.include( comment  );
	
    // 	expect( user.notifications.length ).to.equal( 1 );
    // });
    
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
        
    
    /* Need to updated to ensure emails are still unique */
    // it('Update email and expect notification', function(){
    // 	var newEmailAddr = 'me@newTest.com';
	
    // 	user.updateEmail( newEmailAddr );

    // 	expect(user.email).to.equal( newEmailAddr );
    // 	//expect(user.notifications.length).to.equal( 1 );
    // });
});
