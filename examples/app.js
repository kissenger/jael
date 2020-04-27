

// if installed as npm package
// const jael = require('jael
const jael = require('../src/jael');

jael.setPath('../tests');

const valid = {
  points: [
    {lat: 51.92830, lng: -3.14760},
    {lat: 51.92002, lng: -3.14563}
  ]};

jael.getElevs(valid).then( ret => {
  console.log(ret);
}).catch( e => {
  console.log(e.message);
});
