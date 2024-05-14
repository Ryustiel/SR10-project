const logger = require('../logger');

async function requireAffiliation(req, res, next) {
    try {
        if (req.session.userAffiliation) {
            next();
        } else {
            if (! req.session.userEmail) {
                req.session.returnTo = req.originalUrl || '/'; // save current page
                res.redirect('/login');
            }
            else if (req.session.userType !== 'recruteur') {
                res.render('denied/permission.ejs', {
                    reason:
                        'Cette page n\'est accessible qu\'aux recruteurs'
                });
            } else {
                res.render('denied/permission.ejs', {
                    reason:
                        'Vous devez d\'abord vous affilier à une organisation pour accéder à cette page'
                });
            }
        }
    } catch (e) {
        next(e);
    }

}

module.exports = requireAffiliation;