'use strict'

var helper = require('../../helpers/helper');

var mongoose             = require('mongoose');
var chai                 = require('chai');
var sinon                = require('sinon');
var sinonChai            = require('sinon-chai');
var fs                   = require('fs');
var devNullStream        = require('dev-null-stream');
var faker                = require('faker');

var FileContainer        = mongoose.model('FileContainer');
var FakeModel            = mongoose.model('FakeModel');
chai.should();
chai.use( sinonChai );

var expect = chai.expect;

var devNullOpts = {
    highWaterMark: 2
}

var devNull = new devNullStream( devNullOpts);


describe('FileContainer', function(){
    
    // Our soon to be unregistered user
    var fileCntr = null;
    var parent = null;
    
    var fileTemplate = {
	file: {
	    name: faker.commerce.productName(),
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
	parent = new FakeModel({});
	parent.save( done );
    });
    
    after( function(done){
	parent.remove( done );
    });

    beforeEach( function(done){
	fileCntr = FileContainer.register(
	    parent,
	    fileTemplate.file,
	    fileTemplate.settings );
	
	fileCntr.save(done);
    });
    
    afterEach( function(done){
	fileCntr.remove( done );
    });

    
    it('Container should exist', function(){
	expect( fileCntr ).to.exist;
    });
    
    it('Fields are filled in correctly', function(){
	expect( fileCntr.parent.id ).to.equal( parent._id.toString() );
	expect( fileCntr.parent.collectionName ).to.equal( parent.__t );
	expect( fileCntr.file.name ).to.equal( fileTemplate.file.name );
	expect( fileCntr.file.path ).to.equal( fileTemplate.file.path );
	expect( fileCntr.displaySettings.customURL ).to.equal( fileCntr.displaySettings.bulletLink );
	expect( fileCntr.displaySettings.parentLink ).to.equal( parent.displaySettings.link );
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
    
    it('Add shared entity', function(){
    	var entity = {
	    collectionName: 'user',       // fake collection name
	    id: mongoose.Types.ObjectId() // fake the obejct ID
    	};
	
	fileCntr.addSharedEntity(entity);
	expect( fileCntr.sharedWith.length ).to.equal( 1 );
    	expect( fileCntr.sharedWith ).to.include( entity );
    });
    
    it('Add and remove shared entity', function(){

	var entity1 = FakeModel.generateDoc();   	
	var entity2 = FakeModel.generateDoc();
	
	fileCntr.addSharedEntity(entity1);	
    	expect( fileCntr.sharedWith.length ).to.equal( 1 );
    	expect( fileCntr.sharedWith ).to.include( entity1  );
	
	fileCntr.addSharedEntity(entity2);	
    	expect( fileCntr.sharedWith.length ).to.equal( 2 );
    	expect( fileCntr.sharedWith ).to.include( entity2 );
	
	// // Delete will return array of deleted items
    	expect( fileCntr.deleteSharedEntity( entity1 ) ).to.eql( [ entity1 ] );
    	expect( fileCntr.sharedWith.length ).to.equal( 1 );
    	expect( fileCntr.sharedWith ).to.not.include( entity1 );
	
	expect( fileCntr.deleteSharedEntity( entity2 ) ).to.eql( [ entity2 ] );
    	expect( fileCntr.sharedWith.length ).to.equal( 0 );
    	expect( fileCntr.sharedWith ).to.not.include( entity2 );
    });
    
    it('Visibility checker: PUBLIC', function(){
	fileCntr.displaySettings.visibility ='PUBLIC';
	expect( fileCntr.viewableTo( 'Everyone' ) ).to.be.true;
    });
    
    it('Visibility checker: PRIVATE', function(){
	var sharedWithEntity = FakeModel.generateDoc();
	var nonSharedEntity  = FakeModel.generateDoc();

	fileCntr.addSharedEntity( sharedWithEntity );	
    	expect( fileCntr.sharedWith.length ).to.equal( 1 );
    	expect( fileCntr.sharedWith ).to.include( sharedWithEntity );
	
	// parent 
	expect( fileCntr.viewableTo( parent ) ).to.be.true;
	
	// not parent or shared with
	expect( fileCntr.viewableTo( nonSharedEntity.collectionName) ).to.be.false;
	
	// Not a model 
	expect( fileCntr.viewableTo( null ) ).to.be.false;
		
	// Shared with
	expect( fileCntr.viewableTo( sharedWithEntity ) ).to.be.true;
    });
    
    it('Get file', function(done){
	var path = './data/test/temp.txt';
	var write = fs.createWriteStream(path);
	
	write.on('ERROR', console.log);		
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
    
    it('Save display settings', function(){
	var displaySettings ={
	    visibility: "test test test"
	}
	
	fileCntr.saveDisplaySettings( displaySettings );
	expect( fileCntr.displaySettings.toObject() ).to.eql( displaySettings );
    });       
});
