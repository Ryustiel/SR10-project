function requireRecruitorStatus(req, res, next) {
    try {
        if (req.session.userType === 'recruteur') {
            next();
        } else {
            if (! req.session.userEmail) {
                req.session.returnTo = req.originalUrl || '/'; // save current page
                res.redirect('/login');
            } else {
                let error = new Error();
                error.status = 500;
                error.message = 'Vous n\'avez pas accès à cette page';
                next(error);
            }
        }
    } catch (e) {
        next(e);
    }
}

module.exports = requireRecruitorStatus;