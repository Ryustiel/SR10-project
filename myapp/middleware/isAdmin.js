function isAdmin(req, res, next) {
    if (req.session.userType && req.session.userType.toLowerCase() === 'administrateur') {
        next();
    } else {
        res.redirect('/dashboard');
    }
}

module.exports = isAdmin;