// Create a server.js file
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/api/airports', async (req, res) => {
    const { city } = req.query;
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(`https://aerodatabox.p.rapidapi.com/airports/search/term?q=${encodeURIComponent(city)}&limit=5`, options);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/flights', async (req, res) => {
    const { origin, destination, date } = req.query;
    // Similar implementation...
});

app.listen(3001, () => console.log('Proxy server running on port 3001'));
