var mongoose             = require('mongoose');
var chai                 = require("chai");
var sinon                = require("sinon");
var sinonChai            = require("sinon-chai");

var Notification         = mongoose.model('Notification');
var FakeModel            = mongoose.model('FakeModel');                                            

chai.should();
chai.use( sinonChai );

var expect = chai.expect;

describe('Notifications', function(){
    
    var note       = null;
    var target     = FakeModel.generateDoc();
    var regarding  = FakeModel.generateDoc();
    var subject    = 'TEST'
    var titleDict  =  Notification.getTitleDict();

    beforeEach( function(done){
	note = Notification.register(target, subject, regarding);
	note.save( done );
    });

    afterEach( function(done){
	note.remove(done);
    });
    
    it('Notification should exist', function(){
	expect( note ).to.exist;
    });
    
    it( 'Expect all required fields to be filled out propperly', function(){
	
	expect( note.target.id ).to.equal( target._id.toString() );
	expect( note.target.collectionName ).to.equal( target.__t );
	
	expect( note.regarding.id ).to.equal( regarding._id.toString() );
	expect( note.regarding.collectionName ).to.equal( regarding.__t );

	expect( note.read ).to.be.false;
	expect( note.subject ).to.equal( subject );
	expect( note.title ).to.equal( titleDict[ subject ] );
    });	
});
