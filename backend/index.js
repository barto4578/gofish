require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

const { fetchUSGSData } = require('./services/usgs');
const { fetchWeather } = require('./services/weather');
const { recommendFlySetup } = require('./logic/recommendation');
const { getTargetSpecies } = require('./logic/species');
const { scrapeCaddisFlyShop } = require('./services/reports');

app.use(cors());

// GET fishing recommendation data for a river
app.get('/api/recommendation', async (req, res) => {
  const river = req.query.river;
  console.log('Fetching data for river:', river);

  try {
    const {
      flowCFS,
      tempF,
      flowHistory,
      flowThresholds,
      flowStatus
    } = await fetchUSGSData(river);

    const weather = await fetchWeather(river);
    const flyRec = recommendFlySetup(river);
    const species = getTargetSpecies(river);

    res.json({
      location: river,
      flowCFS,
      tempF,
      flowHistory,
      flowThresholds,
      flowStatus,
      weather,
      recommendation: flyRec,
      species
    });
  } catch (err) {
    console.error('Error in /api/recommendation route:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET the latest fly shop report
app.get('/api/reports', async (req, res) => {
  try {
    const reportData = await scrapeCaddisFlyShop();
    res.json(reportData);
  } catch (err) {
    console.error('Report scraping failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});