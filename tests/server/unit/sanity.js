'use strict'

var helper = require('../../helpers/helper');

var faker                = require('faker');
var chai                 = require("chai");
var sinon                = require("sinon");
var sinonChai            = require("sinon-chai");
var mongoose             = require('mongoose');



chai.should();
chai.use( sinonChai );

var expect = chai.expect;


describe('Santiy check.', function(){

    before( function(){
	// nothing
    });
    
    /** Santity check ************************************/

    it('True should be Ok', function(){
	expect( true ).to.be.true;
    });
    
    it('False should be not Ok', function(){
	expect( false ).to.be.false;
    });
    
    it('String `abc` should equal `abc`', function(){
	expect( 'abc' ).to.equal('abc')
    });
    
    it('Undefined field should be `undefined`', function(){
	expect( {}.y ).to.be.undefined;
    });
    
    /** Ensure app models are loaded ***********************/

    it('Ensure model `UnauthenticatedUser` has been loaded', function(){
	var model = mongoose.model('UnauthenticatedUser');
	expect( model ).to.exist;
    });

    it('Ensure model `User` has been loaded', function(){
	var model = mongoose.model('User');
	expect( model ).to.exist;
    });

    it('Ensure model `FileContainer` has been loaded', function(){
	var model = mongoose.model('FileContainer');
	expect( model ).to.exist;
    });
    
    it('Ensure model `Comment` has been loaded', function(){
	var model = mongoose.model('Comment');
	expect( model ).to.exist;
    });

    it('Ensure model `FakeModel` has been loaded', function(){
	var model = mongoose.model('FakeModel');
	expect( model ).to.exist;
    });
    
    it('Ensure mailer has been loaded', function(){
	var mailer = require('../../../config/mailer');
	expect( mailer ).to.exist;
    });
});
