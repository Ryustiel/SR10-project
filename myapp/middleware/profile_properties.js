// Import required modules
const Utilisateur = require('../model/utilisateur');
const Candidature = require('../model/candidature');
const OffreEmploi = require('../model/offreEmploi');
const logger = require('../logger');

// Function to fetch user data and check if the target user exists
async function fetchUserData(currentUserEmail, userId) {
    const currentUser = await Utilisateur.read(currentUserEmail);
    const targetUser = await Utilisateur.read(userId);

    if (!targetUser) {
        logger.warn(`User ${userId} not found`);
        throw new Error('Utilisateur non trouvé.');
    }

    return {currentUser, targetUser};
}

// Function to check if a user can view a profile
async function canViewProfile(req, res, next) {
    try {
        const userId = req.params.userId || req.session.userEmail;
        const currentUserEmail = req.session.userEmail;

        // Fetch current and target user data
        const {currentUser, targetUser} = await fetchUserData(currentUserEmail, userId);

        // Allow access if the current user is the target user or an admin
        if (currentUserEmail === targetUser.Email || currentUser.TypeCompte === 'administrateur') {
            return next();
        }

        // Recruiter specific logic
        if (currentUser.TypeCompte === 'recruteur') {
            const canView = await isSameOrganization(currentUser, targetUser);
            logger.info(`Recruiter ${currentUserEmail} is in the same organization as ${targetUser.Email}: ${canView}`);
            if (canView) {
                return next();
            } else {
                return res.status(403).render('error', {message: 'Accès refusé.'});
            }
        }

        // Default access denied response
        return res.status(403).render('error', {message: 'Accès refusé.'});
    } catch (error) {
        logger.error(`Error in profile_properties: ${error}`);
        return res.status(500).render('error', {message: 'Erreur interne du serveur.'});
    }
}

// Function to check if the current recruiter is in the same organization as the recruiter mentioned in the job offer
async function isSameOrganization(currentUser, targetUser) {
    try {
        const targetUserApplications = await Candidature.getApplicationsCandidat(targetUser.Email);

        for (const app of targetUserApplications) {
            const offer = await OffreEmploi.read(app.IdOffre);
            const offerRecruiter = await Utilisateur.read(offer.IdRecruteur);

            if (currentUser.IdOrganisation === offerRecruiter.IdOrganisation) {
                return true;
            }
        }

        return false;
    } catch (error) {
        logger.error(`Error in isSameOrganization: ${error}`);
        throw error;
    }
}

// Function to check if a user can edit a profile
async function canEditProfile(req, res, next) {
    try {
        const userId = req.params.userId || req.session.userEmail;
        const currentUserEmail = req.session.userEmail;

        // Fetch current and target user data
        const {currentUser, targetUser} = await fetchUserData(currentUserEmail, userId);

        // Allow access if the current user is the target user or an admin
        if (currentUserEmail === targetUser.Email || currentUser.TypeCompte === 'administrateur') {
            return next();
        }

        // Default access denied response
        return res.status(403).render('error', {message: 'Accès refusé.'});
    } catch (error) {
        logger.error(`Error in canEditProfile: ${error}`);
        return res.status(500).render('error', {message: 'Erreur interne du serveur.'});
    }
}

module.exports = {canViewProfile, canEditProfile };
