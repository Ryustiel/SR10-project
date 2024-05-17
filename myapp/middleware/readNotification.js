function readNotification(req, res, next) {
    if (req.session.notification === '') {req.session.notification = 'TEST NOTIF BROWSE'}
    req.notification = req.session.notification;
    req.session.notification = '';
    next();
}

module.exports = readNotification;