// server/server.js

const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001; // run on port 3001 so it doesn't clash with react (which uses 3000)

// middleware to allow requests from our react app running on localhost:3000
app.use(cors());
// middleware to parse json data from requests
app.use(express.json());

// endpoint that receives the form data when user submits the trip planning form
app.post('/api/plan-trip', (req, res) => {
  // extract the form data from the request body
  const formData = req.body;

  // log the data to the terminal so we can see what was sent
  console.log('Received form data on the back-end:');
  console.log(formData);

  // send a success response back to the frontend
  res.json({ message: "Data received successfully! Check the server terminal to see the data." });
});

// start the server and listen for requests
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});