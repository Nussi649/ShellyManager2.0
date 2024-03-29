const mysql = require('mysql');
const { getCurrentLogger } = require('./loggerManager');

let logger = getCurrentLogger();

const config = require('../../configs/production.json');

const dbConfig = config.database;

const pool = mysql.createPool(dbConfig);

function getConnection(callback) {
    pool.getConnection((err, connection) => {
        if (err) {
            logger.error(`Error getting database connection: ${err}`);
            return callback(err);
        }
        callback(null, connection);
    });
}

function fetchActiveMeters(callback) {
    const query = 'SELECT * FROM meters WHERE active = 1';
    pool.query(query, (error, results) => {
        callback(error, results);
    });
}

function insertMeterReadings(data, callback) {
    const insertQuery = `
        INSERT INTO meter_readings (meter_id, timestamp_start, interval_length, consumption) 
        VALUES ?;
    `;
    pool.query(insertQuery, [data], (error, results) => {
        callback(error, results);
    });
}

function updateLatestFetch(meterId, callback) {
    const updateQuery = `
        UPDATE meters
        SET latest_fetch = CURRENT_TIMESTAMP
        WHERE id = ?;
    `;
    pool.query(updateQuery, [meterId], (error, results) => {
        callback(error, results);
    });
}

function shutdownPool() {
    pool.end((err) => {
        if (err) {
            logger.error(`Error shutting down database connection pool: ${err}`);
        }
    });
}

process.on('exit', shutdownPool);

module.exports = {
    getConnection,
    fetchActiveMeters,
    insertMeterReadings,
    updateLatestFetch,
    shutdownPool
};