const express = require('express');
const router = express.Router();
const gridOperator = require('../../gridOperator/gridOperator');

router.post('/fetch-specific', async (req, res) => {
    const { startDate, endDate } = req.body;
    const response = await gridOperator.fetchSpecific(startDate, endDate);
    res.status(response.httpStatusCode).json({ status: response.status });
});

router.get('/test-fetch', async (req, res) => {
    try {
        const startDate = '2024-02-15T23%3A00%3A00.000Z';
        const endDate = '2024-02-16T22%3A59%3A59.999Z';
        const result = await gridOperator.fetchSpecific(startDate, endDate);
        res.json(result); // Send the result back to the caller
    } catch (error) {
        console.error(error); // Log any errors
        res.status(500).json({ error: error.message });
    }
});

router.get('/test-config', async (req, res) => {
    const result = gridOperator.getConfig();
    res.json(result); // Send the result back to the caller
});

module.exports = router;