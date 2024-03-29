const express = require('express');
const router = express.Router();
const meteringDevices = require('../../meteringDevices/meteringDevices');

// API Route zum Starten des Abrufprozesses
router.post('/start-fetch', async (req, res) => {
    const response = await meteringDevices.startFetch();
    res.status(response.httpStatusCode).json({ status: response.status });
});

// API Route zum Stoppen des Abrufprozesses
router.post('/stop-fetch', async (req, res) => {
    const response = await meteringDevices.stopFetch();
    res.status(response.httpStatusCode).json({ status: response.status });
});

// API Route für Status-Updates
router.get('/status', async (req, res) => {
    const response = await meteringDevices.getStatus();
    res.json(response);
});

// API Route für Device Refresh
router.get('/refresh', async (req, res) => {
    const response = await meteringDevices.refreshDevices();
    res.status(response.httpStatusCode).json({ status: response.status, msg: response.msg });
});

module.exports = router;