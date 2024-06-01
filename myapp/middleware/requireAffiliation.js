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
                let error = new Error();
                error.status = 500;
                error.message = 'Erreur interne du serveur.';
                next(error);
            } else {
                let error = new Error();
                error.status = 403;
                error.message = 'Vous n\'avez pas le droit d\'accéder à cette page.';
                next(error);
            }
        }
    } catch (e) {
        next(e);
    }

}

module.exports = requireAffiliation;