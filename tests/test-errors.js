
/**
 * 
 * This set of tests runs jael with a variety of short inputs in order to force errors, and checks for the expected
 * return.  The checks performed are:
 *  1) Invalid key, use 'lon' instead of the correct 'lng' 
 *  2) Filename not found
 *  3) Lat value out of range
 *  4) Lng value out of range
 *  5) Lat/Lng value wrong type (string in this case)
 * 
 * All input data is compiled in the script
 * 
 * In order to run the tests, the following tiff is required:
 *  './TIFF ASTGTMV003_N51W005_dem.tiff' 
 * 
 * To run: mocha test-errors
 */

var chai = require("chai");
var expect = require('chai').expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const jael = require('../src/jael');
// jael.setPath('./');    // set further down after initital error check

const inputs = [
  {
    testName: 'invalidKey',
    errorMessage: 'Malformed point at index 0',
    points: [
      {lat: 51.2194, lon: -4.94915},
      {lat: 51.21932, lng: -3.94935}
    ]
  },
  {
    testName: 'filenameNotFound',
    errorMessage: 'ENOENT: no such file or directory',
    points: [
      {lat: 51.2194, lng: -5.94915},
      {lat: 51.21932, lng: -3.94935}
    ]
  },
  {
    testName: 'outOfRangeLat',
    errorMessage: 'Lat or lng out of bounds at point index 0',
    points: [
      {lat: 87.2194, lng: -4.94915},
      {lat: 51.21932, lng: -3.94935}
    ]
  },
  {
    testName: 'outOfRangeLng',
    errorMessage: 'Lat or lng out of bounds at point index 1',
     points: [
      {lat: 51.2194, lng: -4.94915},
      {lat: 51.21932, lng: -183.94935}
    ]
  },
  {
    testName: 'invalidType',
    errorMessage: 'Unexpected type at point index 1',
     points: [  
      {lat: 51.2194, lng: -4.94915},
      {lat: 51.21932, lng: 'gordon'}
    ]
  }  
];


/** 
 * Run the inputs through the function and formulate output object
 */
 


before( function() {
  this.timeout(30000);

  inp = { points: [
        {lat: 51.2194, lng: -4.94915},
        {lat: 51.21932, lng: -3.94935} ]};

  // map the promises in a way that catches the errors as well
  return jael.getElevs(inp)
    .then(r => output = {result: r})
    .catch(e => output = {result: e});
});

it('wrapper it to wait for first "before" call', function() {
  describe(`check for setPath() Error`, function() { 
    
    it('expect instance of Error', function() {
      expect(output.result).to.satisfy(function(r) { return r instanceof Error});
    });
    
    it('expect error message: Path to TIFFs not set or invalid', function() {
      expect(output.result.message).to.contain('Path to TIFFs not set or invalid');
    });

  });
});


before( function() {
  jael.setPath('./');
  this.timeout(30000);

  // map the promises in a way that catches the errors as well
  const promises = inputs.map(inp => jael.getElevs(inp).catch(e => e));
  return Promise.all(promises).then( results => {
    outputs = results.map( (r, i) => ({testName: inputs[i].testName, errorMessage: inputs[i].errorMessage, result: r}));
  })

});

/**
 * Run the tests
 */


it('wrapper it to wait for second "before" call', function() {

  for (let i = 0; i < inputs.length; i++) {

    describe(`testName ${outputs[i].testName}`, function() {

      it('expect instance of Error', function() {
        expect(outputs[i].result).to.satisfy(function(r) { return r instanceof Error});
      });
  
      it('expect error message: ' + outputs[i].errorMessage, function() {
        expect(outputs[i].result.message).to.contain(outputs[i].errorMessage);
      });

    });
  }

});
