const fs = require('fs');
const path = require('path');
const moment = require('moment');
const logsBasePath = path.join(__dirname, '..', 'Logs');

const Fileloggerdata = (endpoint, message) => {

    const ensureDirectoryExistence = (filePath) => {
        const dirname = path.dirname(filePath);
        if (fs.existsSync(dirname)) {
            return true;
        }
        fs.mkdirSync(dirname, { recursive: true });
    };

    const getLogFilePath = (endpoint) => {
        const date = new Date();
        const dateFolder = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
        let hour = date.getHours();
        const formattedHour = hour.toString().padStart(2, '0');
        const logFileName = `${formattedHour}.log`;
        const logFolderPath = path.join(logsBasePath, endpoint, dateFolder);
        return path.join(logFolderPath, logFileName);
    };

    const logFilePath = getLogFilePath(endpoint);
    ensureDirectoryExistence(logFilePath);
    const logEntry = `************************************************************************\n${message}\n`;
    if (!fs.existsSync(logFilePath)) {
        fs.writeFileSync(logFilePath, logEntry);
    } else {
        fs.appendFileSync(logFilePath, logEntry);
    }
}

const logMsgString = (error, req) => {
    let logmessage = '';
    logmessage += `Message: ${error?.response?.data?.description || error?.message} \n`;
    logmessage += `Request Method: ${req?.method}\n`
    logmessage += `Request UTC: ${req?.Request_UTC}\n`;
    logmessage += `Response UTC: ${moment().utc().format('DD-MM-YYYY HH:mm:ss.SSS')}\n`;
    logmessage += `Request Url: ${`${req?.protocol}://${req?.get('host')}${req?.originalUrl}`}\n`;
    logmessage += `Request Body: ${JSON.stringify(req.body)}\n`;
    logmessage += `Request QueryParams: ${JSON.stringify(req.query || req.params)}\n`;
    logmessage += `Error : ${JSON.stringify(error?.response?.data || error)}\n`;
    return logmessage;
}

const logMessage = (endpoint, error, req) => {
    const message = logMsgString(error, req) || 'No message provided';
    Fileloggerdata(endpoint, message)
};


module.exports = { logMessage };
