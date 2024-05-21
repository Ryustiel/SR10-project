function readNotification(req, res, next) {
    req.notification = req.session.notification;
    req.session.notification = '';
    next();
}

module.exports = readNotification;