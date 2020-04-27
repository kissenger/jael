
/**
 * 
 * This set of tests runs jael with a valid set of 250 input points and performes the following checks:
 *  1) Input and output arrays have the same length
 *  2) Input points array should not be mutated
 *  3) Output should have all the coordinates specified in the inputs, in the same order
 *  4) Output should be an array of objects with keys ['elevs', 'lat', 'lng'], and the value of elev ot type 'number'
 *  5) >99% of the elevations returned should be equal to those in comparison array
 * 
 * Input is pulled from './input.txt'
 * Baseline data is pulled from './baseline.txt' which has the same coordinate pairs, in the same order, as input
 * Baseline data is the raw results output from a call to elevations-api.io via postman
 * 
 * In order to run the tests, the following tiffs are required:
 *  './TIFF ASTGTMV003_N51W004_dem.tiff' 
 *  './TIFF ASTGTMV003_N51W005_dem.tiff' 
 * 
 * To run: mocha test-valid
 */

var chai = require("chai");
var expect = require('chai').expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const jael = require('../src/jael');
jael.setPath('./');

const fs = require('fs');
const BASE_DIR = './';


// Define the list of tests to run, in this case an array of objects, each object listing the 
// filenames containing the test data to load
const testList = [
    { inputs: 'input.txt', baseline: 'baseline.txt'}
]


// Main test loop, the surrounding it is a hack to get the looping structure with promises working
// otherwise the 'before' does not deliver the promisified data
it('wrapper it to wait for promise.all to complete', function () { 

  let testWithData = function (test) {
    // this is a closure to define the actual tests - needed to cope with a loop of tests each with promises
    
    return function () {

      // Do this on each loop before running the tests
      before( function() {
        this.timeout(30000);

        // load the requested data files for the current test
        return getTestData(test).then( function(data) {

          const inputFreeze = JSON.stringify(data.inputs.points);

          return jael.getElevs(data.inputs).then( function(result) {
            inputStringify = inputFreeze;
            inputs = data.inputs.points;
            outputs = result;
            baseline = data.baseline.elevations.map( p => ({lat: p.lat, lng: p.lon, elev: p.elevation}));
          })

        });
      });

      // Tests
      it('input and ouput arrays have the same length', function() {
        expect(outputs.length).to.equal(baseline.length);
      });

      it('input points array should not be modified', function() {
        expect(inputStringify).to.equal(JSON.stringify(inputs));
      });

      it('output should have the all the input coordinates in the same order', function() {
        outputsCoords = outputs.map( o => ({lat: o.lat, lng: o.lng}));
        expect(JSON.stringify(inputs)).to.equal(JSON.stringify(outputsCoords));
      });

      it('all outputs elements should have keys {elevs, lat, lng}, and value of elev is a number', function() {
        const boo = outputs.every( o => {
          const keys = Object.keys(o);
          booKeys = keys.indexOf('lat') >= 0 && keys.indexOf('lng') >= 0 && keys.indexOf('elev') >= 0;
          booValues = typeof o.elev === 'number';
          return booKeys && booValues
        });
        expect(boo).to.equal(true);
      });

      it('>99% of elevations should match baseline', function() {

        // find array of points that do not match
        const stringyOutputs = outputs.map( o => JSON.stringify(o));
        const stringyBaseline = baseline.map( b => JSON.stringify(b));
        const arr = stringyOutputs.filter( o => stringyBaseline.indexOf(o) < 0 )

        // use the following to visualise the elements that are not passing
        // console.log(arr);
        
        expect(arr.length / outputs.length).to.be.lt(0.01);
      });

    };
  }; 

  // This is where the actual looping occurs
  testList.forEach( function(test, index) {
    describe("Running Test " + (index + 1), testWithData(test));
  });

}) // it (hack)


// -------------------------------------------------------------------
// Loop through provided files in object, load and return the data
// Filenames provided in the formm {fileDescription: 'filename', fileDescription, 'fileName'}
// Return objeect replaces the filename with the data from the file
// Then, we keep association between the file purpose and the data
// -------------------------------------------------------------------
function getTestData(fileNames) {
  return new Promise( (res, rej) => {
    const promises = [];
    for ( const key in fileNames) {
      promises.push(importFromFile( {[key]: fileNames[key]} ));
    }
    Promise.all(promises).then( (values) => res(values.reduce( (out, ele) => ({...out, ...ele}), {} )) );
  });
}

// -------------------------------------------------------------------
// Load data from a provided filename
// File name is provided in the form {key: 'filename'}
// Result is provided in the form {key: data}
// This way the key  information is not lost so we can track the intended use of each file
// -------------------------------------------------------------------
function importFromFile(fileKeyValuePair) {
  return new Promise ( (rs, rj) => {
    const key = Object.keys(fileKeyValuePair)[0];
    const fn = fileKeyValuePair[key];
    fs.readFile(BASE_DIR + fn, (err, data) => {
      rs({[key]: JSON.parse(data)});
    });
  })
}

// -------------------------------------------------------------------
// Write data to file for further investigation
// -------------------------------------------------------------------
function exportData(fname, data) {
  // console.log(data);
  JSON.stringify(data)
  fs.writeFile(BASE_DIR + fname, JSON.stringify(data), (err) => {});
}