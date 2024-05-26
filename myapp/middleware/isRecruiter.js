function isRecruiter(req, res, next) {
    if (req.session.userType && req.session.userType.toLowerCase() === 'recruteur') {
        next();
    } else {
        res.redirect('/dashboard');
    }
}

module.exports = isAdmin;