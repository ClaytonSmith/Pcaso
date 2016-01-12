var chai = require('chai');


chai.configure.includeStack = true;

global.expect          = chai.expect;
global.AssertionError  = chai.AssertionError;
global.Assertion       = chai.Assertion;
global.assert          = chai.assert;
