const logger = require('../logger');

function readMessage(req, res, next) {
    res.locals.message = req.session.message || '';
    res.locals.messageType = req.session.messageType || ''; // 'error' or 'notification'
    //log if message is not ''
    if (res.locals.message !== '') {
        logger.info(`Message: ${res.locals.message}, Type: ${res.locals.messageType}`);
    }
    delete req.session.message; // Clear the message after setting it in locals
    delete req.session.messageType; // Clear the message type after setting it in locals
    next();
}

module.exports = readMessage;
