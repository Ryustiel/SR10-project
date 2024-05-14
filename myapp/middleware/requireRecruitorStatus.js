function requireRecruitorStatus(req, res, next) {
    if (req.session.userType === 'recruteur') {
        next();
    } else {
        if (! req.session.userEmail) {
            res.redirect('/login');
        } else {
            res.render('denied/permission.ejs',
                {
                    reason: 'Vous ne pouvez malheureusement pas accéder à cette page'
                });
        }
    }
}

module.exports = requireRecruitorStatus;