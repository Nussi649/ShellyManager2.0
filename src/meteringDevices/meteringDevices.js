const db = require('../common/databaseManager');
const Device = require('./deviceManager');
const { startNewFetchLogger, getCurrentLogger } = require('../common/loggerManager');
const { formatUnixTimeToCET } = require('../common/utils')

let devices = [];
let nextFetchTimeout = null;

// ##################################################################
// ###################### API Call Functions ########################
// ##################################################################

async function startFetch() {
    if (nextFetchTimeout) {
        return { status: 'started', httpStatusCode: 400 };
    }
    try {
        await initializeDevices();
        scheduleNextFetch();
        return { status: 'started', httpStatusCode: 200 };
    } catch (error) {
        return { status: 'stopped', httpStatusCode: 400 };
    }
}

async function stopFetch() {
    if (!nextFetchTimeout) {
        return { status: 'stopped', httpStatusCode: 400 };
    }
    await processFetchCycle();
    clearTimeout(nextFetchTimeout);
    nextFetchTimeout = null;
    return { status: 'stopped', httpStatusCode: 200 };
}

async function getStatus() {
    const statuses = await Promise.all(devices.map(device => device.getStatus()));
    return {devices: statuses, fetching: !!nextFetchTimeout };
}

async function refreshDevices() {
    try {
        const results = await new Promise((resolve, reject) => {
            db.fetchActiveMeters((error, results) => {
                if (error) {
                    getCurrentLogger().error('Error fetching devices from meters table');
                    reject(new Error('DB connection error'));
                } else {
                    resolve(results);
                }
            });
        });
        
        results.forEach((result) => {
            const deviceIndex = devices.findIndex(device => device.name === result.name);
            if (deviceIndex !== -1) {
                const device = devices[deviceIndex];
                if (device.address !== result.address) {
                    device.address = result.address;
                    device.attemptStartInterval();
                }
            } else {
                const newDevice = new Device({ ...result, logger });
                devices.push(newDevice);
                newDevice.attemptStartInterval();
            }
        });

        return { status: 'success', msg: 'Devices refreshed successfully', httpStatusCode: 200 };
    } catch (error) {
        return { status: 'error', msg: error.message, httpStatusCode: 400 };
    }
}

// ##################################################################
// ###################### Internal Functions ########################
// ##################################################################

async function initializeDevices() {
	logger = startNewFetchLogger();
	logger.info('Running Query to initialize Devices...')

    db.fetchActiveMeters((error, results) => {
        if (error) {
            logger.error('Error fetching devices from meters table, skipped further processing');
            throw error;
        }
        devices = results.map(data => new Device({ ...data }));
        devices.forEach(device => device.attemptStartInterval());
    });
}

function scheduleNextFetch() {
    const now = new Date();
    const secondsToNextHalfHour = (60 - now.getSeconds()) % 60;
    const minutesToNextHalfHour = 15 - now.getMinutes() % 15 - (secondsToNextHalfHour === 0 ? 0 : 1);
    const msToNextFetch = minutesToNextHalfHour * 60000 + secondsToNextHalfHour * 1000 - now.getMilliseconds();
	getCurrentLogger().info(`Scheduled next fetch to within ${minutesToNextHalfHour}:${secondsToNextHalfHour}min`)
    nextFetchTimeout = setTimeout(() => {
        processFetchCycle().then(scheduleNextFetch);
    }, msToNextFetch);
}

async function processFetchCycle() {
	const logger = getCurrentLogger();
	logger.info('Closing Fetch Intervals...')
    const results = await Promise.all(devices.map(device => device.closeInterval()));
	const insertRecords = [];
    const updateRecords = [];
    let logEntry = 'Verbrauchswerte:';
    // Verarbeite die Ergebnisse und schreibe sie in die Datenbank
	results.forEach((result, index) => {
        if (result) {
            const device = devices[index];
            const resultTS = formatUnixTimeToCET(result.timestamp);
			insertRecords.push([device.id, resultTS, result.duration, result.consumption])
            updateRecords.push(index + 1)
            logEntry += ` ${device.name}=${parseFloat(result.consumption).toFixed(2)}Wh;`;
        } else {
            logger.warning(`Gerät ${devices[index].name}: Keine Daten aufgrund eines Verbindungsfehlers.`);
        }
    });
    if (logEntry !== 'Verbrauchswerte:') {
        logger.info(logEntry);
    }
	if (insertRecords.length > 0) {
        db.insertMeterReadings(insertRecords, (error, results) => {
            if (error) {
                logger.warning('Fehler beim Einfügen der Daten:', error);
                return;
            }
            logger.info('Verbrauchswerte erfolgreich in Tabelle meter_readings eingefügt');
        });
    }
    if (updateRecords.length > 0) {
        updateRecords.forEach(deviceID => {
            db.updateLatestFetch(deviceID, (error, results) => {
                if (error) {
                    logger.warning(`(${deviceID})Fehler beim Aktualisieren der latest_fetch Zeit: ${error}`);
                    return;
                }
            });
        });
        logger.info('latest_fetch für Zählgeräte in Tabelle meters aktualisiert.');
    }
}

module.exports = {
    startFetch,
    stopFetch,
    getStatus,
    refreshDevices
};
