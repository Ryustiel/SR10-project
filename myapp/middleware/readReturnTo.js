const logger = require("../logger");

function readReturnTo(req, res, next) {
    req.returnTo = req.session.returnTo || '/dashboard';
    logger.info(`Return to défini à ${req.returnTo}`);
    // do not reset returnTo
    next();
}

module.exports = readReturnTo;