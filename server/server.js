// server/server.js

const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// This is our new, main endpoint
app.post('/api/plan-trip', (req, res) => {
  // Get the form data from the request body sent by React
  const formData = req.body;

  // --- This is the crucial test ---
  // We'll log the received data to our server's terminal
  console.log('Received form data on the back-end:');
  console.log(formData);

  // Send a simple success message back to the front-end
  res.json({ message: "Data received successfully! Check the server terminal to see the data." });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});