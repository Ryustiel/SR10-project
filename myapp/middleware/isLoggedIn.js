function isLoggedIn(req, res, next) {
    if (req.session.userEmail) {
        next();
    } else {
        req.session.returnTo = req.url || '/'; // save current page
        res.redirect('/login');
    }
}

module.exports = isLoggedIn;