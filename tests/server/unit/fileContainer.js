var mongoose             = require('mongoose');
var chai                 = require('chai');
var sinon                = require('sinon');
var sinonChai            = require('sinon-chai');
var fs                   = require('fs');
var devNullStream        = require('dev-null-stream');
var FileContainer        = mongoose.model('FileContainer');

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
    var parent = {
	id: String(mongoose.Types.ObjectId().toString()),
	collectionName: 'collection'
    };
    
    var fileTemplate = {
	file: {
	    name: 'test file',
	    path: './data/test/test-file.txt'
	},
	parent: parent,
	keepFile: true
    };
    
    before( function(done){
	done();
    });
    
    
    beforeEach( function(done){
	fileCntr = new FileContainer( fileTemplate );
	fileCntr.save(done);
    });
    
    afterEach( function(done){
	fileCntr.remove( done );
    });

    
    it('Container should exist', function(){
	expect( fileCntr ).to.exist;
    });

    
    it('Parent ID and collection type should match', function(){
	expect( fileCntr.parent.id ).to.equal( fileTemplate.parent.id );
	expect( fileCntr.parent.collectionName ).to.equal( fileTemplate.parent.collectionName );
    });
    

    it('Add comment', function(){
	var comment = mongoose.Types.ObjectId(); // fake the obejct ID

	fileCntr.addComment(comment);
	expect( fileCntr.comments.length ).to.equal( 1 );
	expect( fileCntr.comments ).to.include( comment );
    });

    
    it('Add and remove comment', function(){
	var comment1 = mongoose.Types.ObjectId(); // fake the obejct ID
	var comment2 = mongoose.Types.ObjectId(); // fake the obejct ID
	
	fileCntr.addComment(comment1);
	expect( fileCntr.comments.length ).to.equal( 1 );
	expect( fileCntr.comments ).to.include( comment1  );
	
	fileCntr.addComment(comment2);
	expect( fileCntr.comments.length ).to.equal( 2 );
	expect( fileCntr.comments ).to.include( comment2  );
	
	fileCntr.removeComment( comment1 );
	expect( fileCntr.comments.length ).to.equal( 1 );
	expect( fileCntr.comments ).to.not.include( comment1 );

	fileCntr.removeComment( comment2 );
	expect( fileCntr.comments.length ).to.equal( 0 );
	expect( fileCntr.comments ).to.not.include( comment2 );
	
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
    	
	var entity1 = {
	    collectionName: 'user',       // fake collection name
	    id: mongoose.Types.ObjectId() // fake the obejct ID
	};    	
	
	var entity2 = {
	    collectionName: 'user',       // fake collection name
	    id: mongoose.Types.ObjectId() // fake the obejct ID
	};
	
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
	fileCntr.visibility ='PUBLIC';
	expect( fileCntr.viewableTo( 'Everyone' ) ).to.be.true;
    });
    
    it('Visibility checker: PRIVATE', function(){
	var sharedWithEntity = {
	    collectionName: 'user',       // fake collection name
	    id: mongoose.Types.ObjectId() // fake the obejct ID
	};

	var nonSharedEntity = {
	    collectionName: 'user',       // fake collection name
	    id: mongoose.Types.ObjectId() // fake the obejct ID
	};    	

	fileCntr.addSharedEntity( sharedWithEntity );	
    	expect( fileCntr.sharedWith.length ).to.equal( 1 );
    	expect( fileCntr.sharedWith ).to.include( sharedWithEntity );
	
	// parent 
	expect(
	    fileCntr.viewableTo( { _id: parent.id, __t: parent.collectionName } )
	).to.be.true;
	
	// not parent or shared with
	expect(
	    fileCntr.viewableTo( { _id: nonSharedEntity.id, __t: nonSharedEntity.collectionName } )
	).to.be.false;
	
	// Not a model 
	expect(
	    fileCntr.viewableTo( null )
	).to.be.false;
		

	// Shared with
	expect(
	    fileCntr.viewableTo( { _id: sharedWithEntity.id, __t: sharedWithEntity.collectionName } )
	).to.be.true;
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
	
	write.on('ERROR', console.log);		
	write.on('finish', function(){
	    fs.unlinkSync(path);	    
	    expect( fileCntr.statistics.viewCount ).to.equal( 1 );    
	    done()
	});		

	fileCntr.getFile(write);
    });
    
    it('Save display settings', function(){
	var displaySettings ={
	    cat: 'dog',
	    cow: 'horse'
	}
	
	fileCntr.saveDisplaySettings( displaySettings );
	expect( fileCntr.displaySettings ).to.eql( displaySettings );
    });       
});
