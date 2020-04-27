
/**
 * Runs a benchmark test n times and returns the total time / n
 * as an approximation of the runtime of the library
 * Note processor speed changes when laptop is not plugged in!! Baseline plugged in.
 * 
 * To run: node test-time
 */


const jael = require('../src/jael');
jael.setPath('./');

const fs = require('fs');
const nTests = 250;

importFromFile('./input.txt').then( data => {

  const p = [];
  const startTime = new Date();
  
  for (let i = 0; i < nTests; i++) {
    p.push( jael.getElevs(data) );
  }

  Promise.all(p).then( (r) => {
    console.log(`Benchmark run ${nTests} tests in ${new Date() - startTime}ms (approx ${(new Date() - startTime) / nTests}ms per test)`) 
  });

})



function importFromFile(fn) {
  return new Promise ( (res, rej) => {
    fs.readFile(fn, (err, data) => {
      res(JSON.parse(data));
      
    });
  })
}
