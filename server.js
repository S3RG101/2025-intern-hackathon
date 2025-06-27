const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Replace with your actual client ID
const CLIENT_ID = 'a1851554413841fd8e0678d784d145da';

app.post('/api/spotify/token', async (req, res) => {
  const { code, code_verifier, redirect_uri } = req.body;

  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      code_verifier,
    });

    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    res.json(response.data);
  } catch (err) {
    res.status(400).json({ error: err.response?.data || err.message });
  }
});

const PORT = 8888;
app.listen(PORT, () => {
  console.log(`Spotify token exchange server running on http://localhost:${PORT}`);
});