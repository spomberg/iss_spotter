const request = require('request');

/**
 * Makes a single API request to retrieve the user's IP address.
 * Input:
 *   - A callback (to pass back an error or the IP string)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The IP address as a string (null if error). Example: "162.245.144.188"
 */
const fetchMyIP = function(callback) {
  request('https://api.ipify.org?format=json', (error, response, body) => {
    if (error) {
      callback(error, null);
      return;
    }
    // Check for other errors on our request callback
    if (response.statusCode !== 200) {
      const msg = `Status Code ${response.statusCode} when fetching IP. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    const ip = JSON.parse(body).ip;
    if (ip) {
      callback(null, ip);
      return;
    }
  });
  // use request to fetch IP address from JSON API
};

const fetchCordsByIP = (ip, callback) => {
  request(`https://api.freegeoip.app/json/${ip}?apikey=113da360-498f-11ec-909c-2dc9a5eea4c2`, (error, response, body) => {
    if (error) {
      callback(error, null);
      return;
    }

    if (response.statusCode !== 200) {
      const msg = `Status Code ${response.statusCode} when fetching coordinates. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }
    const coordinates = {
      latitude: JSON.parse(body).latitude,
      longitude: JSON.parse(body).longitude
    };
    if (coordinates) {
      callback(null, coordinates);
      return;
    }
  });
};

/**
 * Makes a single API request to retrieve upcoming ISS fly over times the for the given lat/lng coordinates.
 * Input:
 *   - An object with keys `latitude` and `longitude`
 *   - A callback (to pass back an error or the array of resulting data)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly over times as an array of objects (null if error). Example:
 *     [ { risetime: 134564234, duration: 600 }, ... ]
 */
const fetchISSFlyOverTimes = function(coords, callback) {
  const url = `https://iss-pass.herokuapp.com/json/?lat=${coords.latitude}&lon=${coords.longitude}`;
  request(url, (error, response, data) => {
    if (error) {
      callback(error, null);
      return;
    }

    if (response.statusCode !== 200) {
      const msg = `Status code: ${response.statusCode} when fetching the flyover times. Response: ${data}`;
      callback(Error(msg), null);
    }

    const flyOverTimes = JSON.parse(data).response;
    if (flyOverTimes) {
      callback(null, flyOverTimes);
      return;
    }
  });
};

/**
 * Orchestrates multiple API requests in order to determine the next 5 upcoming ISS fly overs for the user's current location.
 * Input:
 *   - A callback with an error or results.
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly-over times as an array (null if error):
 *     [ { risetime: <number>, duration: <number> }, ... ]
 */
const nextISSTimesForMyLocation = function(callback) {
  fetchMyIP((error, ip) => {
    if (error) {
      callback(error, null);
      return;
    }

    if (ip) {
      fetchCordsByIP(ip, (error, coords) => {
        if (error) {
          callback(error, null);
          return;
        }
    
        if (coords) {
          fetchISSFlyOverTimes(coords, (error, output) => {
            if (error) {
              callback(error, null);
              return;
            }
        
            if (output) {
              let flyOverTimes = "";
              for (let x = 0; x < output.length; x++) {
                const time = new Date(0);
                time.setUTCSeconds(output[x].risetime);
                flyOverTimes += `Next pass at ${time} for ${output[x].duration} seconds!\n`;
              }
              callback(null, flyOverTimes);
              return;
            }
          });
        }
      });
    }
  });
};

module.exports = { fetchMyIP, fetchCordsByIP, fetchISSFlyOverTimes, nextISSTimesForMyLocation };