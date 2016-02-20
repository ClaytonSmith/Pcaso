'use strict'

var helper = require('../../helpers/helper');

var mongoose             = require('mongoose');
var chai                 = require("chai");
var sinon                = require("sinon");
var sinonChai            = require("sinon-chai");
var faker                = require('faker');

var Comment              = mongoose.model('Comment');
var FakeModel            = mongoose.model('FakeModel');                                            
chai.should();
chai.use( sinonChai );

var expect = chai.expect;

/* Note: Using `Comment` as the collection name because the
   comment model will try to contact the parent and subject when it 
   is being removed in attempt to remove all traces of its existence.  
*/

describe('Comments', function(){
    
    var comment = null;
    var target  = null;
    var parent  = null;
    
    before( function(done){
	target = new FakeModel({});
	parent = new FakeModel({});
	
	target.save( function(err){
	    if(err) done( err );
	    parent.save( done );
	});
    });
    
    var commentTemplate = {
	subject: faker.commerce.productName(),

	from: faker.name.findName(),
	body: faker.lorem.sentence()
    }
    
    beforeEach( function(done){
	comment = Comment.register(
	    parent,
	    target,
	    commentTemplate.from,
	    commentTemplate.subject,
	    commentTemplate.body);

	comment.save(done);
    });
    
    afterEach( function(done){
	comment.remove(done);
    });

    it('Comment should exist', function(){
	expect( comment ).to.exist;
    });
    
    it('Fields are filled in correctly', function(){
	
	expect( comment.parent.id ).to.equal( parent._id.toString() );
	expect( comment.parent.collectionName ).to.equal( parent.__t );
	
	expect( comment.target.id ).to.equal( target._id.toString() );
	expect( comment.target.collectionName ).to.equal( target.__t );
    
	expect( comment.subject ).to.equal( commentTemplate.subject );
	expect( comment.from ).to.equal( commentTemplate.from );
	expect( comment.body ).to.equal( commentTemplate.body );
	
	expect( comment.links.parent ).to.equal( parent.links.link ); 
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
	
	comment.removeComment( comment1, function(err){} );
	expect( comment.children.length ).to.equal( 1 );
	expect( comment.children ).to.not.include( comment1 );

	comment.removeComment( comment2, function(err){} );
	expect( comment.children.length ).to.equal( 0 );
	expect( comment.children ).to.not.include( comment2 );
	
    });
    
});
