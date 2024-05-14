function requireRecruitorStatus(req, res, next) {
    try {
        if (req.session.userType === 'recruteur') {
            next();
        } else {
            if (! req.session.userEmail) {
                req.session.returnTo = req.originalUrl || '/'; // save current page
                res.redirect('/login');
            } else {
                res.render('denied/permission.ejs',
                    {
                        reason: 'Vous ne pouvez malheureusement pas accéder à cette page'
                    });
            }
        }
    } catch (e) {
        next(e);
    }
}

module.exports = requireRecruitorStatus;