var mongoose             = require('mongoose');
var chai                 = require("chai");
var sinon                = require("sinon");
var sinonChai            = require("sinon-chai");

var Comment              = mongoose.model('Comment');
                                            
chai.should();
chai.use( sinonChai );

var expect = chai.expect;

/* Note: Using `Comment` as the collection name because the
   comment model will try to contact the parent and subject when it 
   is being removed in attempt to remove all traces of its existence.  
*/

describe('Comments', function(){
    
    var comment = null;
    var parent = {
	id: String(mongoose.Types.ObjectId().toString()),
	collectionName: 'Comment'
    }; 

    var subject = {
	id: String(mongoose.Types.ObjectId().toString()),
	collectionName: 'Comment' // arbitrary
    };
    
    var commentTemplate = {
	parent: parent,
	subject: subject,
	from: 'Cool person',
	body: 'cat dog cow horse'
    }
    
    beforeEach( function(done){
	comment = new Comment(commentTemplate);
	comment.save(done);
    });
    
    afterEach( function(done){
	comment.remove( done );
    });

    it('Comment should exist', function(){
	expect( comment ).to.exist;
    });
    
    it('Add comment', function(){
	var comment1 = mongoose.Types.ObjectId(); // fake the obejct ID

	comment.addComment( comment1 );
	expect( comment.children.length ).to.equal( 1 );
	expect( comment.children ).to.include( comment1 );
    });

    
    it('Add and remove comment', function(){
	var comment1 = mongoose.Types.ObjectId(); // fake the obejct ID
	var comment2 = mongoose.Types.ObjectId(); // fake the obejct ID
	
	comment.addComment(comment1);
	expect( comment.children.length ).to.equal( 1 );
	expect( comment.children ).to.include( comment1  );
	
	comment.addComment(comment2);
	expect( comment.children.length ).to.equal( 2 );
	expect( comment.children ).to.include( comment2  );
	
	comment.removeComment( comment1 );
	expect( comment.children.length ).to.equal( 1 );
	expect( comment.children ).to.not.include( comment1 );

	comment.removeComment( comment2 );
	expect( comment.children.length ).to.equal( 0 );
	expect( comment.children ).to.not.include( comment2 );
	
    });
    
});
