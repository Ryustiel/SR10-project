const {getUserDetailsAndOrgs} = require('../middleware/userUtils');
const logger = require('../logger');
const readMessage = require('../middleware/readMessage');

// Fonction d'aide pour rendre la vue du profil
async function renderProfileView(req, res, userId) {
    try {
        // Appeler le middleware readMessage
        await new Promise((resolve, reject) => {
            readMessage(req, res, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        const {userDetails, organisations} = await getUserDetailsAndOrgs(userId);
        res.render('users/view_profile', {
            user: userDetails,
            organisations
        });
    } catch (error) {
        logger.error(`Erreur lors de l'accès au profil: ${error.message}`, { stack: error.stack });
        res.status(500).render('error', { message: "Erreur de serveur.", error });
    }
}

module.exports = { renderProfileView };
