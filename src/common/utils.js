const moment = require('moment-timezone');

function formatUnixTimeToCET(timestamp) {
    return moment.unix(timestamp).tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss');
}

module.exports = { 
    formatUnixTimeToCET
}