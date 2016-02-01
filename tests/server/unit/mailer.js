'use strict'

var helper = require('../../helpers/helper');

var faker                = require('faker');
var mongoose             = require('mongoose');
var chai                 = require("chai");
var sinon                = require("sinon");
var sinonChai            = require("sinon-chai");
var MailClient           = require('../../../config/mailer').newClient;

                                            
chai.should();
chai.use( sinonChai );
var expect = chai.expect;


describe('Mailer', function(){
    
    var mailer = null;
    var clientName = 'no-reply';
    
    beforeEach( function(){
	mailer = new MailClient( clientName ); 
    });
    
    it('Mail client should exist', function(){
	expect( mailer ).to.exist;
    });
    
    it('Ensure that all required fields are set: TEXT', function(){
	var spy = sinon.spy();;
	
	// Nothing set
	mailer.send(spy);
	expect( spy ).to.have.been.calledWith( new Error( 'Malformed email, all fields must be filled' ) );
	
	// To field set
	mailer.to({name: { first: 'John', last: 'Doe' }, email: 'Haha@domain.com' });
	spy = sinon.spy(); // renew spy before each call
	mailer.send(spy);
	expect( spy ).to.have.been.calledWith( new Error( 'Malformed email, all fields must be filled' ) );
	
	// From field set
	mailer.from('Central services');
	spy = sinon.spy();
	mailer.send(spy);
	expect( spy ).to.have.been.calledWith( new Error( 'Malformed email, all fields must be filled' ) );
	
	mailer.subject('Testing in progress')
	spy = sinon.spy();
	mailer.send(spy);
	expect( spy ).to.have.been.calledWith( new Error( 'Malformed email, all fields must be filled' ) );
	
	mailer.text('Testings testing testing');
	spy = sinon.spy();
	mailer.send(spy);
	expect( spy ).to.not.have.been.calledWith( new Error( 'Malformed email, all fields must be filled' ) );
    });

    it('Ensure that all required fields are set: TEXT and HTML', function(){
	var spy = sinon.spy();
	
	// Nothing set
	mailer.send(spy);
	expect( spy ).to.have.been.calledWith( new Error( 'Malformed email, all fields must be filled' ) );
	
	// To field set
	mailer.to({name: { first: 'John', last: 'Doe' }, email: 'Haha@domain.com' });
	spy = sinon.spy(); // renew spy before each call
	mailer.send(spy);
	expect( spy ).to.have.been.calledWith( new Error( 'Malformed email, all fields must be filled' ) );
	
	// From field set
	mailer.from('Central services');
	spy = sinon.spy();
	mailer.send(spy);
	expect( spy ).to.have.been.calledWith( new Error( 'Malformed email, all fields must be filled' ) );
	
	mailer.subject('Testing in progress')
	spy = sinon.spy();
	mailer.send(spy);
	expect( spy ).to.have.been.calledWith( new Error( 'Malformed email, all fields must be filled' ) );
	
	mailer.html('<h1>Testings testing testing</h1>');
	spy = sinon.spy();
	mailer.send(spy);
	expect( spy ).to.not.have.been.calledWith( new Error( 'Malformed email, all fields must be filled' ) );

	mailer.text('Testings testing testing');
	spy = sinon.spy();
	mailer.send(spy);
	expect( spy ).to.not.have.been.calledWith( new Error( 'Malformed email, all fields must be filled' ) );
    });

});
