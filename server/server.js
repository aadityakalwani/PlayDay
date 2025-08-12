// server/server.js

const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001; // run on port 3001 so it doesn't clash with react (which uses 3000)

// middleware to allow requests from our react app running on localhost:3000
app.use(cors());
// middleware to parse json data from requests
app.use(express.json());

const { searchImages } = require('./imageService');

// endpoint that receives the form data when user submits the trip planning form
app.post('/api/plan-trip', (req, res) => {
  // extract the form data from the request body
  const formData = req.body;
// ... existing code ...
  // send a success response back to the frontend
  res.json({ message: "Data received successfully! Check the server terminal to see the data." });
});

app.post('/api/get-place-image', async (req, res) => {
  const { placeName } = req.body;
  if (!placeName) {
    return res.status(400).json({ error: 'placeName is required' });
  }

  try {
    // Add context to the search query for better results
    const query = `${placeName} London`;
    const imageUrls = await searchImages(query);
    
    if (imageUrls && imageUrls.length > 0) {
      // Return the first image URL
      res.json({ imageUrl: imageUrls[0] });
    } else {
      res.status(404).json({ error: 'No images found for this place.' });
    }
  } catch (error) {
    console.error('Error fetching image from Google:', error);
    res.status(500).json({ error: 'Failed to fetch image.' });
  }
});

// start the server and listen for requests
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});