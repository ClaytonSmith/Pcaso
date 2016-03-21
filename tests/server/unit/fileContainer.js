'use strict'

var helper = require('../../helpers/helper');

var mongoose             = require('mongoose');
var chai                 = require('chai');
var sinon                = require('sinon');
var sinonChai            = require('sinon-chai');
var fs                   = require('fs');
var devNullStream        = require('dev-null-stream');
var faker                = require('faker');
var async                = require('async');
var FileContainer        = mongoose.model('FileContainer');
var FakeModel            = mongoose.model('FakeModel');
var User                 = mongoose.model('User');

chai.should();
chai.use( sinonChai );

var expect = chai.expect;

var devNullOpts = {
    highWaterMark: 2
}

var devNull = new devNullStream( devNullOpts);


describe('FileContainer', function(){


    var user1 = null;
    var user2 = null;

    var user1Template = null;
    var user2Template = null;
    
    // Our soon to be unregistered user
    var fileCntr = null;
    var parent = null;
    
    var fileTemplate = helper.fileTemplate;;
    
    before( function(done){
	var temp = helper.genUser();
	parent = User.register(
	    temp.name.first,
	    temp.name.last,
	    temp.email,
	    temp.password
	);
	
	parent.save( done );
    });
    
    after( function(done){
	parent.remove( done );
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
	
	fileCntr = FileContainer.register(
	    parent,
	    fileTemplate.file,
	    fileTemplate.settings
	);	

	async.parallel(
	    [
		function(parallelSB){
		    user1.save( parallelSB );
		},
		function(parallelSB){
		    user2.save( parallelSB );
		},
		function(parallelSB){
		    fileCntr.save( parallelSB );
		}
	    ], done );
    });
    
    afterEach( function(done){
	async.parallel(
	    [
		function(parallelCB){
		    User.findOne( { _id: user1._id }, parallelCB );
		},
		
		function(parallelCB){
		    User.findOne( { _id: user2._id }, parallelCB );
		},
		function(parallelCB){
		    // Sneek the FileContainer into the list of users to be removed
		    parallelCB( null, fileCntr);
		} 
	    ],
	    
	    function(err, results){
		if( err ) return done( err );
		else async.map( results, function(user, callback){ user.remove( callback ) }, done); 
	    });	
    });
    
    
    it('Container should exist', function(){
	expect( fileCntr ).to.exist;
    });
    
    it('Fields are filled in correctly', function(){
    	expect( fileCntr.parent.id ).to.equal( parent._id.toString() );
    	expect( fileCntr.parent.collectionName ).to.equal( parent.__t );
    	expect( fileCntr.file.name ).to.equal( fileTemplate.file.name );
    	expect( fileCntr.file.path ).to.equal( fileTemplate.file.path );
    	expect( fileCntr.links.bullet ).to.equal( fileCntr.links.bullet );
    	expect( fileCntr.links.parent ).to.equal( parent.links.link );
    });
    

    it('Add comment', function(){
    	var comment = mongoose.Types.ObjectId(); // fake the obejct ID

    	fileCntr.addComment(comment);
    	expect( fileCntr.comments.length ).to.equal( 1 );
    	expect( fileCntr.comments ).to.include( comment );
    });
    
    
    it('Add and remove comment', function(done){
    	var comment1 = mongoose.Types.ObjectId(); // fake the obejct ID
    	var comment2 = mongoose.Types.ObjectId(); // fake the obejct ID
	
    	fileCntr.addComment(comment1);
    	expect( fileCntr.comments.length ).to.equal( 1 );
    	expect( fileCntr.comments ).to.include( comment1  );
	
    	fileCntr.addComment(comment2);
    	expect( fileCntr.comments.length ).to.equal( 2 );
    	expect( fileCntr.comments ).to.include( comment2  );
	
    	fileCntr.removeComment( comment1, function(err1){
    	    expect( err1 ).to.be.null;
    	    expect( fileCntr.comments.length ).to.equal( 1 );
    	    expect( fileCntr.comments ).to.not.include( comment1 );
	    
	    
    	    fileCntr.removeComment( comment2, function(err2){
    		expect( err2 ).to.be.null;
    		expect( fileCntr.comments.length ).to.equal( 0 );
    		expect( fileCntr.comments ).to.not.include( comment2 );
    		done();
    	    });
    	});
    });
    
    it('Add shared user', function(done){
    	fileCntr.addSharedEntity( user1, function(err){
	    expect( err ).to.be.null;
    	    expect( fileCntr.sharedWith.length ).to.equal( 1 );
    	    expect( fileCntr.sharedWith ).to.include( user1.email );
	    done();
	});
    });
    
    it('Add shared entity', function(done){
    	var entity = FakeModel.generateDoc();
    	
	fileCntr.addSharedEntity(entity, function(err){
    	    expect( err ).to.be.null;
    	    expect( fileCntr.sharedWith.length ).to.equal( 1 );
    	    expect( fileCntr.sharedWith ).to.include( { id: entity._id, collectionName: entity.__t } );
    	    done();
    	});
    });
    
    it('Add and remove shared user', function(done){
	
    	fileCntr.addSharedEntity(user1, function(err1){
	    expect( err1 ).to.be.null;
    	    expect( fileCntr.sharedWith.length ).to.equal( 1 );
    	    expect( fileCntr.sharedWith ).to.include( user1.email );
	
    	    fileCntr.addSharedEntity(user2, function(err2){
    		expect( err2 ).to.be.null;	
    		expect( fileCntr.sharedWith.length ).to.equal( 2 );
    		expect( fileCntr.sharedWith ).to.include( user2.email );
		
    		// // Delete will return array of deleted items
    		expect( fileCntr.deleteSharedEntity( user1 ) ).to.eql( [ user1.email ] );
    		expect( fileCntr.sharedWith.length ).to.equal( 1 );
    		expect( fileCntr.sharedWith ).to.not.include( user1.email );
		
    		expect( fileCntr.deleteSharedEntity( user2 ) ).to.eql( [ user2.email ] );
    		expect( fileCntr.sharedWith.length ).to.equal( 0 );
    		expect( fileCntr.sharedWith ).to.not.include( user2.email );
    		done();
    	    })
    	});
    });
    
    it('Add and remove shared entity', function(done){
    	function cntr(e){ return {id: e._id, collectionName: e.__t}};
	
    	var entity1 = FakeModel.generateDoc();
    	var entity2 = FakeModel.generateDoc();
	
    	fileCntr.addSharedEntity(entity1, function(err1){
    	    expect( err1 ).to.be.null;	
    	    expect( fileCntr.sharedWith.length ).to.equal( 1 );
    	    expect( fileCntr.sharedWith ).to.include( cntr( entity1 ) );
	    
    	    fileCntr.addSharedEntity(entity2, function(err2){
    		expect( err2 ).to.be.null;	
    		expect( fileCntr.sharedWith.length ).to.equal( 2 );
    		expect( fileCntr.sharedWith ).to.include( cntr( entity2 ) );
		
    		// // Delete will return array of deleted items
    		expect( fileCntr.deleteSharedEntity( entity1 ) ).to.eql( [ cntr( entity1 ) ] );
    		expect( fileCntr.sharedWith.length ).to.equal( 1 );
    		expect( fileCntr.sharedWith ).to.not.include( cntr( entity1 ) );
		
    		expect( fileCntr.deleteSharedEntity( entity2 ) ).to.eql( [ cntr( entity2 ) ] );
    		expect( fileCntr.sharedWith.length ).to.equal( 0 );
    		expect( fileCntr.sharedWith ).to.not.include( cntr( entity2 ) );
    		done();
    	    });
    	});
    });
    
    it('Visibility check: PUBLIC', function(){
    	fileCntr.displaySettings.visibility ='PUBLIC';
    	expect( fileCntr.viewableTo( 'Everyone' ) ).to.be.true;
    });
    
    it('Visibility check: PRIVATE', function(done){
    	var sharedWithEntity = FakeModel.generateDoc();
    	var nonSharedEntity  = FakeModel.generateDoc();
	
    	fileCntr.addSharedEntity( sharedWithEntity, function(err){
    	    expect( err ).to.be.null;	
    	    expect( fileCntr.sharedWith.length ).to.equal( 1 );
    	    expect( fileCntr.sharedWith ).to.include( { id: sharedWithEntity._id, collectionName: sharedWithEntity.__t } );
	    
    	    // parent 
    	    expect( fileCntr.viewableTo( parent ) ).to.be.true;
	    
    	    // not parent or shared with
    	    expect( fileCntr.viewableTo( nonSharedEntity.collectionName) ).to.be.false;
	    
    	    // Not a model 
    	    expect( fileCntr.viewableTo( null ) ).to.be.false;
	    
    	    // Shared with
    	    expect( fileCntr.viewableTo( sharedWithEntity ) ).to.be.true;
    	    done();
    	});
    });
    
    it('Get file', function(done){
    	var path = './data/test/temp.txt';
    	var write = fs.createWriteStream(path);
	
    	write.on('finish', function(){
    	    fs.unlinkSync(path);	    
    	    done();
    	});		
	
    	fileCntr.getFile(write);	
    });
    
    it('View counter', function(done){
    	var path = './data/test/temp.txt';
    	var write = fs.createWriteStream(path);

    	expect( fileCntr.statistics.viewCount ).to.equal( 0 );
	
    	write.on('ERROR', done);		
    	write.on('finish', function(){
    	    fs.unlinkSync(path);	    
    	    expect( fileCntr.statistics.viewCount ).to.equal( 1 );    
    	    done()
    	});		

    	fileCntr.getFile(write);
    });
    
    it('Save display settings', function(done){

    	var settings ={
	    displaySettings: { 
    		visibility: "test test test"
    	    }
	};
	
    	fileCntr.updateSettings( settings, function(err){
    	    expect( fileCntr.displaySettings.visibility ).to.equal( settings.displaySettings.visibility );
	    done(err);
	});       
    });
});
