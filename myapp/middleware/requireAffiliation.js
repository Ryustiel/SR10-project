const logger = require('../logger');

async function requireAffiliation(req, res, next) {
    if (req.session.userAffiliation) {
        logger.info(`Utilisateur ${req.session.userEmail} déjà affilié à ${req.session.userAffiliation}`);
        next();
    } else {
        if (! req.session.userEmail) {
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
}

module.exports = requireAffiliation;