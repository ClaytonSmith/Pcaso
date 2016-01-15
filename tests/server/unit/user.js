var mongoose             = require('mongoose');
var chai                 = require("chai");
var sinon                = require("sinon");
var sinonChai            = require("sinon-chai");

var UnauthenticatedUser  = mongoose.model('UnauthenticatedUser');
var User                 = mongoose.model('User');

chai.should();
chai.use( sinonChai );

var expect = chai.expect;

describe('UnauthenticatedUser', function(){
    
    // Our soon to be unregistered user
    var unauthUser = null;
    var userTemplate = {
	name: {
	    first: "Testy",
	    last: "McTestsalot"
	},
	email: 'Test@cool.com',
	password: 'Super Secure'
    };
    
    beforeEach( function(done){
	
	unauthUser = UnauthenticatedUser(userTemplate);
	unauthUser.save( function( err ){
	    if( err ) throw err 
	    
	    done();
	});
    });
    
    afterEach(function(){
	unauthUser.remove();
    });
    
    it('Ensure unauthenticated user has been saved', function(){
	expect( unauthUser ).to.exist;
    });

    it('Password encription', function(){
	expect( unauthUser ).not.equal( userTemplate.password );
    });
    
    it('User information saved correctly', function(){
	expect( unauthUser.name.first ).equal( userTemplate.name.first );
	expect( unauthUser.name.last ).equal( userTemplate.name.last );
	expect( unauthUser.email ).equal( userTemplate.email );
    });
});


describe('User', function(){
    
    // Our soon to be unregistered user
    var user = null;
    var userTemplate = {
	name: {
	    first: "Testy",
	    last: "McTestsalot"
	},
	email: 'Test@cool.com',
	password: 'Super Secure'
    };
    
    beforeEach( function(done){
	
	user = User(userTemplate);
	user.save( function( err ){
	    if( err ) throw err;
	    done();
	});
    });
    
    afterEach(function(done){
	user.remove();
	done();	
    });
    

    it('Ensure user has been saved', function(){
	expect( user ).to.exist;
    });

    it('Password encription', function(){
	expect( user ).not.equal( userTemplate.password );
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
    
    it('Attach and remove file', function(){
	var file = mongoose.Types.ObjectId(); // fake the obejct ID
	user.attachFile( file ); //
	expect( user.files.length ).to.equal( 1 );
	expect( user.files ).to.include( file  );
	
	user.removeFile( file );
	expect( user.files.length ).to.equal( 0 );
	expect( user.files ).to.not.include( file  );
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
    
    it('Add and remove comment', function(){
	var comment = mongoose.Types.ObjectId(); // fake the obejct ID
	user.addComment(comment);
	
	expect( user.comments.length ).to.equal( 1 );
	expect( user.comments ).to.include( comment  );
	
	user.removeComment( comment );
	expect( user.comments.length ).to.equal( 0 );
	expect( user.comments ).to.not.include( comment  );
    });
        
    
    it('Update email and expect notification', function(){
	var newEmailAddr = 'me@newTest.com';
	
	user.updateEmail( newEmailAddr );

	expect(user.email).to.equal( newEmailAddr );
	//expect(user.notifications.length).to.equal( 1 );
    });
});
