

/**
 * jeal.js - Just Another Elevations Library
 * Reads multi-point elevation data from NASA/METI ASTGTM_v003 elevations dataset. 
 **
 * Version history and change log
 * v1.0.0 - 07/04/2020 - Benchmark run 250 tests in 12710ms (approx 50.84ms per test)
 * v1.0.1 - 07/04/2020 - Minor debugs to support npm deployment
 * v1.0.2 - 07/04/2020 - Further debugging npm deployment + check for trailing '/' in supplied path
 */

// geoTiff library does the actual work of reading the images https://geoTiffjs.github.io/geoTiff.js/
const geoTiff = require('geoTiff');

// geoTIFF files must be stored and path set eg jael.setPath('./TIFFs') before calling the main function
let TIFF_PATH;
function setPath(path) { 
  TIFF_PATH = path.charAt(path.length-1) === '/' ? path : path + '/';
};


/**
 * Entry point - provided with an array of point objects will return a copy with 'elev' key in each object
 * @param {Object} object request containing at the minimum a member names 'points' such as {points: [{lat: yy, lng: xx}, {...} ] }
 * @returns {Array} point objects in the form [{lat: yy, lng: xx, elev: xx}, {...}]
 * Request is an object to allow passing of an options member in future
 */
async function getElevs(req) {

  return new Promise( (resolve, reject) => {
    
    // deep clone inputs
    const points = JSON.parse(JSON.stringify(req.points))
    
    // preprocess includes a validity check on input points, so handle any error here
    let pre;
    try {
      pre = preProcess(points);
    } catch (e) {
      reject(e);
    }

    // loop through images and populate the points array with elevations
    const promises = pre.map( img => {
      
      return new Promise( (res, rej) => {
        const window = img.getWindow();
        const windowWidth = img.getWindowWidth();
        getDataFromImage( img.fname, window)
          .then( raster => {
    
            // for each pixel associated with the image, calculate the elevation 
            // and add to all points associated with the same pixel
            img.pixels.forEach( pixel => {
              const x = pixel.px - window[0];
              const y = pixel.py - window[1];
              const elev = raster[x + y * windowWidth];
              pixel.pi.forEach( i => points[i].elev = elev );
            });
            res();  // resolve the mapped promise once all points on the img have been processed

          })
        .catch( (e) => rej(e) );
      });
    });

    Promise.all(promises)
      .then( () => resolve(points) )
      .catch( (e) => reject(e) );

  });
    
}



/**
 * The function of the pre-process is to:
 *  0) Ensure that points provided are well formed and understandable
 *  1) Understand which images we will need to read --> pulled from getPixelInfo
 *  2) Create a unique list of pixels to read from each image
 *  3) Keep track of which points each pixel will supply an elevation for
 *  4) Understand the pixel bounding box to read for each image
 * It does this with the help of the ImageAssociation class
 * @param {Array} points array of coordinates as [{lat: number, lng: number}, {lat: ...}, .... ]
 * @returns {Array} array of ImagesAssociations
 */
function preProcess(points) {

  const images = [];
  points.forEach( (pt, i) => {

    if ( !('lat' in pt && 'lng' in pt)) {
      throw new Error(`Malformed point at index ${i}`);
    } else if ( !(typeof pt.lat === 'number' && typeof pt.lng === 'number')) {
      throw new Error(`Unexpected type at point index ${i}`);
    } else if ( Math.abs(pt.lat) > 83 || Math.abs(pt.lng) > 180 ) {
      throw new Error(`Lat or lng out of bounds at point index ${i}`);
    }

    // Check if the desired image exists in the array, and if not create a new instance - 
    // whether pixel exists or already or not is handled in the Image class
    const pix = pixel(pt);
    const imgIndex = images.map(img => img.fname).indexOf(pix.fname);
    if (imgIndex < 0) {
      images.push(new Image(pix, i));
    } else {
      images[imgIndex].addPixel(pix, i);
    };
  })

  return images;
}



class Image {

  /**
   * Creates an instance of Image
   * For each image, keep track of the window of pixels needed to read, which speci
   * @param {Object} pix object from pixelInfo in the form {X, Y, imgFileName}
   * @param {number} pointIndex
   * @memberof Image
   */

  constructor(pix, pointIndex) {

    // filename of the desire image
    this.fname = pix.fname;

    // array of pixels required for this image, including the index of 
    // all the points needing data from the same pixel
    this.pixels = [{              
      px: pix.px, 
      py: pix.py, 
      pi: [pointIndex]
    }]; 

    // window of pixels to read from image so we dont read data that we dont need
    this.minMax = {               
      minX: pix.px, 
      minY: pix.py, 
      maxX: pix.px, 
      maxY: pix.py };
  }

  // return an array defining the pixel window to read for current image as min/max, x/y
  getWindow() {
    return [ this.minMax.minX, this.minMax.minY, this.minMax.maxX + 1, this.minMax.maxY + 1];
  }

  // return only the width of the window, needed to interprete the data from the raster array
  getWindowWidth() {
    return this.minMax.maxX + 1 - this.minMax.minX;
  }

  // method to add a pixel to the instance after it has been instantiated
  addPixel(pxy, pointIndex) {
    
    // loc finds the position of the requested pixel xy, if it exists
    const loc = this.pixels.map( pxy => JSON.stringify([pxy.px, pxy.py])).indexOf(JSON.stringify([pxy.px, pxy.py]));

    if ( loc >= 0 ) {   
      // pixel exists, so just add the index to the supplied pixel
      this.pixels[loc].pi.push(pointIndex);

    } else {           
      // pixel does not exist, so add it to the instance
      this.pixels.push({px: pxy.px, py: pxy.py, pi: [pointIndex]});
      this.minMax.minX = this.minMax.minX > pxy.px ? pxy.px : this.minMax.minX;
      this.minMax.minY = this.minMax.minY > pxy.py ? pxy.py : this.minMax.minY;
      this.minMax.maxX = this.minMax.maxX < pxy.px ? pxy.px : this.minMax.maxX;
      this.minMax.maxY = this.minMax.maxY < pxy.py ? pxy.py : this.minMax.maxY;
    }
  }

}



/**
 * Return fileName and .tiff pixel coordinates for desired lng/lat coordinate pair
 * @param {Object} point desired point as {lat: number, lng: number}
 * @returns {Object} pixel corresponding to the desired point in in x,y coordinates {pixelX, pixelY, imgFileName}
 */
function pixel(point) {

  const nPixPerDeg = 3600;
  const pixelWidth = 1 / nPixPerDeg;
  const offset = pixelWidth / 2;
  
  // calculate the origin of the dem tile, this will be the mid-point of the lower left pixel, in lng/lat
  // https://lpdaac.usgs.gov/documents/434/ASTGTM_User_Guide_V3.pdf
  const tileOriginLng = point.lng < 0 ? Math.trunc(point.lng - 1) : Math.trunc(point.lng);
  const tileOriginLat = point.lat < 0 ? Math.trunc(point.lat - 1) : Math.trunc(point.lat);

  // calculate the origin of the tif, being the upper left corner of the upper left pixel, in lng/lat
  // http://docs.opengeospatial.org/is/19-008r4/19-008r4.html#_pixelisarea_raster_space
  const tiffOriginLng = tileOriginLng - offset;     
  const tiffOriginLat = tileOriginLat + 1 + offset;

  // determine the lng/lat offsets of the point of interest from the tiff origin
  let dLng = point.lng - tiffOriginLng;
  let dLat = tiffOriginLat - point.lat;

  // convert to pixel x and y coordinates
  const px = Math.trunc(dLng/pixelWidth);
  const py = Math.trunc(dLat/pixelWidth);

  // get the filename for corresponding tile
  return {px, py, fname: getFileName(tileOriginLng, tileOriginLat)};

}



/**
 * Return a filename in the form: ASTGTMV003_N36E025_dem.tif
 * @param {number} lngO longitude of the origin of the DEM tile (whole degree)
 * @param {number} latO latitude of the origin of the DEM tile (whole degree)
 * @returns {string} filename of desired tiff in form ASTGTMV003_N35E023_dem.tif
 */
function getFileName(lngO, latO) {

  fstr = "ASTGTMV003_"
  fstr += latO < 0 ? "S" : "N";
  fstr += Math.abs(latO).toString(10).padStart(2,'0');
  fstr += lngO < 0 ? "W" : "E";
  fstr += Math.abs(lngO).toString(10).padStart(3,'0');
  fstr += "_dem.tif"

  return fstr;

}



/**
 * Given the filename of the desired image, loads it, read it and returns the raster array
 * @param {string} fn filename of desired image from getFileName
 * @param {Array} w pixel window to read from the requested image as [minX, minY, maxX, maxY]
 * @returns {Array} of numbers, being the elevations for each pixel in the supplied window
 */
function getDataFromImage(fn, w) {

  return new Promise( (res, rej) => {

    geoTiff.fromFile(TIFF_PATH + fn)
      .then( tiff => tiff.getImage() )
      .then( img => img.readRasters({window: w}) )
      .then( raster => res(raster[0]) )
      .catch( e => rej(e) );
    });

}



module.exports = {
  getElevs, 
  setPath
};