// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * This application demonstrates how to perform basic operations on files with
 * the Google Cloud Storage API.
 *
 * For more information, see the README.md under /storage and the documentation
 * at https://cloud.google.com/storage/docs.
 */
const geoTiff = require('geoTiff');


function main() {
  // [START storage_generate_signed_url]
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  const bucketName = 'trailscape-geotiffs';
  const filename = 'gs://trailscape-geotiffs/ASTGTMV003_N35E025_dem.tif';

  // Imports the Google Cloud client library
  const {Storage} = require('@google-cloud/storage');

  // Creates a client
  // const storage = new Storage();
  const storage = new Storage({projectId: 'trailscape', keyFilename: './trailscape-609eb4b652dc.json'});

  async function generateSignedUrl() {
    // These options will allow temporary read access to the file
    const options = {
      version: 'v2', // defaults to 'v2' if missing.
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60, // one hour
    };

    // Get a v2 signed URL for the file
    const [url] = await storage
      .bucket(bucketName)
      .file(filename)
      .getSignedUrl(options);

    geoTiff.fromUrl('https://storage.cloud.google.com/trailscape-geotiffs/ASTGTMV003_N35E025_dem.tif?authuser=0')
      .then( tiff => console.log(tiff));

    console.log(`The signed url for ${filename} is ${url}`);
  }

  generateSignedUrl().catch(console.error);
  // [END storage_generate_signed_url]
}
main(...process.argv.slice(2));