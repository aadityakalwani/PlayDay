const gis = require('g-i-s');

const searchImages = (query) => {
  return new Promise((resolve, reject) => {
    gis(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results.map(r => r.url));
      }
    });
  });
};

module.exports = { searchImages };
