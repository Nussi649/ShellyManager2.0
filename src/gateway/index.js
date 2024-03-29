const express = require('express');
const path = require('path');
const deviceRoutes = require('./routes/deviceRoutes');
const { getCurrentLogger } = require('../common/loggerManager');

const app = express();
const PORT = process.env.PORT || 3030;

app.use(express.json()); // Middleware to parse JSON bodies

// Static file serving for device manager UI
app.use('/device', express.static(path.join(__dirname, '..', 'meteringDevices', 'web')));

// Use the route modules
app.use('/device', deviceRoutes);

app.listen(PORT, () => getCurrentLogger().info(`Server running on port ${PORT}`));