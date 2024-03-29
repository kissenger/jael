# jeal (Just Another Elevations Library)
Reads multi-point elevation data from NASA/METI ASTGTM_v003 elevations dataset:
<ul>
  <li> Obtain elevation values locally and for free </li>
  <li> No request limits or quotas and quicker than API call </li>
  <li> Large number of points can be calculated quickly (250 elevations from a single TIFF < 100ms, will take longer if spread over multiple TIFFs). </li>
  <li> Large coverage at high resolution - each pixel is 1 arc second, being approx 30 resolution at the equator. </li>
  <li> User should be aware of the limitations of the dataset as described in the documentation (links below) </li>
  <li> The compromise is that the TIFF files are large</li>
</ul>

# Dependencies
This library only works with NASA/METI ASTGTM_v003 GeoTiff .dem files downloaded from the appropriate resources (links below). The files should be downloaded as-as and not renamed.  Only .dem files are needed, the associated .num files can be deleted.

# Useage
Import the library
<pre>
const jael = require('../src/jael');
</pre>

Set path to the stored GeoTIFF files:
<pre>
jael.setPath('./TIFF/');  
</pre>

Formulate request object, which must be an object with property 'points'.  Any other properties will be ignored, and not returned in the results array.  Points is an array of lat/long coordinate objects in the form shown below.  Note that longitude is designated by 'lng' not 'lon'.  Any number of points can be included in the request.<br>
Note that the ASTGTM_v003 dataset only covers up to +/-83degs latitude; providing lats above this will return an error.<br>
The request object is not mutated.
<pre>
const req = {
  points: [
    {lat: 51.9283, lng: -3.1476},
    {lat: 51.92002, lng: -3.14563}
  ]
};
</pre>
Make the elevations request.  The getElevs() function returns a promise that should be thenned.
<pre>
jael.getElevs(req).then( ret => {
  console.log(ret);
}).catch( e => {
  console.log(e.message);
});
</pre>
Points are returned as an array in the requested order with an additional property 'elev' on each point, such as:
<pre>
[
  { lat: 51.9283, lng: -3.1476, elev: 606 },
  { lat: 51.92002, lng: -3.14563, elev: 571 }
]
</pre>

# Useful links
<ul>
  <li>https://lpdaac.usgs.gov/products/astgtmv003/</li>
  <li>https://lpdaac.usgs.gov/documents/434/ASTGTM_User_Guide_V3.pdf </li>
  <li>https://search.earthdata.nasa.gov/search?q=C1575726572-LPDAAC_ECS </li>
  <li>http://docs.opengeospatial.org/is/19-008r4/19-008r4.html#_pixelisarea_raster_space</li>
  <li>https://geotiffjs.github.io/geotiff.js/</li>
  <li>http://app.geotiff.io/</li>
  <li>https://www.get-metadata.com/</li>
</ul>
