function isLoggedIn(req, res, next) {
    if (req.session.userEmail) {
        next();
    } else {
        req.session.returnTo = req.originalUrl || '/'; // save current page
    }
}

module.exports = isLoggedIn;