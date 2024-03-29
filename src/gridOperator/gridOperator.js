const fs = require('fs');
const path = require('path');
const { getCurrentLogger } = require('../common/loggerManager');
const { getAccessToken, fetchDataSpecifications, fetchConsumptionData } = require('../common/apiHandler');


// Load configuration
const configPath = path.join(__dirname, '..', '..', 'configs', 'smartmeter-web.json');
const { AUTH_URL, REFRESH_TOKEN, API_URL, ACCOUNT_NUMBER, METER_POINT_NUMBER, ROLE } = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Function to fetch usage data for a specific time interval
async function fetchSpecific(startDate, endDate) {
    const logger = getCurrentLogger();
    logger.info(`awaiting getAccessToken: AUTH_URL: ${AUTH_URL}, len(REFRESH_TOKEN): ${REFRESH_TOKEN.length}`);
    const accessToken = await getAccessToken(AUTH_URL, REFRESH_TOKEN);
    logger.info(`awaiting fetchQueryConditions: len(access_token): ${accessToken.length}`);
    const role = await fetchQueryConditions(accessToken);
    logger.info(`awaiting fetchData: role: ${role}`);
    const response = await fetchData(accessToken, startDate, endDate, role);
    logger.info('got response. relaying it to client')
    return response.data;
}

async function fetchQueryConditions(accessToken) {
    const specsUrl = `${API_URL}zaehlpunkte/${ACCOUNT_NUMBER}/${METER_POINT_NUMBER}/zaehlwerke`;
    try {
        const dataSpecs = await fetchDataSpecifications(specsUrl, accessToken);
        const qhGranularityRole = dataSpecs.zaehlwerke.find(zw => 
            zw.profiles.some(profile => profile.granularity === "QH")
        )?.profiles.find(profile => profile.granularity === "QH")?.profileRole;

        return qhGranularityRole; // This will be 'V002' or similar based on your example
    } catch (error) {
        console.error('Error fetching query conditions:', error);
        throw error;
    }
}

async function fetchData(accessToken, startDate, endDate, qhGranularityRole) {
    const dataUrl = `${API_URL}messwerte/bewegungsdaten`;
    const params = {
        "geschaeftspartner": ACCOUNT_NUMBER,
        "zaehlpunktnummer": METER_POINT_NUMBER,
        "rolle": qhGranularityRole,
        "zeitpunktVon": startDate, 
        "zeitpunktBis": endDate, 
        "aggregat": "NONE"
    }
    return fetchConsumptionData(dataUrl, accessToken, startDate, endDate, qhGranularityRole);
}

function getConfig() {
    return { AUTH_URL, REFRESH_TOKEN, API_URL, ACCOUNT_NUMBER, METER_POINT_NUMBER }
}


module.exports = {
    fetchSpecific,
    getConfig
};
