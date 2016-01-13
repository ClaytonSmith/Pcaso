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
    
    afterEach(function(done){
	unauthUser.remove();
	done();	
    });
    
    it('Ensure unauthenticated user has been saved', function(done){
	expect( unauthUser ).to.exist;
	done();
    });

    it('Password encription', function(done){
	expect( unauthUser ).not.equal( userTemplate.password );
	done();
    });
    
    it('User information saved correctly', function(done){
	expect( unauthUser.name.first ).equal( userTemplate.name.first );
	expect( unauthUser.name.last ).equal( userTemplate.name.last );
	expect( unauthUser.email ).equal( userTemplate.email );
	done();
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
    

    it('Ensure user has been saved', function(done){
	expect( user ).to.exist;
	done();
    });

    it('Password encription', function(done){
	expect( user ).not.equal( userTemplate.password );
	done();
    });
    
    it('User information saved correctly', function(done){
	expect( user.name.first ).equal( userTemplate.name.first );
	expect( user.name.last ).equal( userTemplate.name.last );
	expect( user.email ).equal( userTemplate.email );
	done();
    });

    it('Attach file', function(done){
	var file = mongoose.Types.ObjectId(); // fake the obejct ID
	user.attachFile( file ); //
	expect( user.files.length ).to.equal( 1 );
	expect( user.files ).to.include( file  );
	done();
    });
    
    it('Attach and remove file', function(done){
	var file = mongoose.Types.ObjectId(); // fake the obejct ID
	user.attachFile( file ); //
	expect( user.files.length ).to.equal( 1 );
	expect( user.files ).to.include( file  );
	
	user.removeFile( file );
	expect( user.files.length ).to.equal( 0 );
	expect( user.files ).to.not.include( file  );
	
	done();
    });

    it('Add comment', function(done){
	var comment = mongoose.Types.ObjectId(); // fake the obejct ID
	user.addComment(comment);
	
	expect( user.comments.length ).to.equal( 1 );
	expect( user.comments ).to.include( comment  );
	done();
    });
    
    it('Add and remove comment', function(done){
	var comment = mongoose.Types.ObjectId(); // fake the obejct ID
	user.addComment(comment);
	
	expect( user.comments.length ).to.equal( 1 );
	expect( user.comments ).to.include( comment  );
	
	user.removeComment( comment );
	expect( user.comments.length ).to.equal( 0 );
	expect( user.comments ).to.not.include( comment  );
	
	done();
    });
});
