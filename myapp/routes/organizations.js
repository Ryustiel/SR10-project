const express = require('express');
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const isAdmin = require("../middleware/isAdmin");
const logger = require("../logger");
const Utilisateur = require('../model/utilisateur');
const Organisation = require('../model/organisation');
const { validateNewOrganisation } = require('../middleware/validationUtils');
const {
    getUserDetailsAndOrgs,
    handleNewOrganisationRequest,
    handleExistingOrganisationRequest
} = require('../middleware/userUtils');

// Route pour demander un changement d'organisation
router.post('/request-organisation-change', isLoggedIn, async (req, res) => {
    logger.debug("Demande de changement d'organisation...");
    try {
        const email = req.session.userEmail;
        const { userDetails, organisations } = await getUserDetailsAndOrgs(email);
        const { existingOrganisationEdit, newOrganisationSirenEdit, newOrganisationNameEdit, newOrganisationTypeEdit, newOrganisationAddressEdit } = req.body;

        let errorMessage = null;
        if (existingOrganisationEdit === 'new') {
            errorMessage = await validateNewOrganisation({
                newOrganisationSiren: newOrganisationSirenEdit,
                newOrganisationName: newOrganisationNameEdit,
                newOrganisationType: newOrganisationTypeEdit,
                newOrganisationAddress: newOrganisationAddressEdit
            });
        } else if (!existingOrganisationEdit) {
            errorMessage = "Une organisation existante doit être sélectionnée.";
        }

        if (errorMessage) {
            logger.warn("Erreur lors de la validation de la nouvelle organisation ou sélection existante:", errorMessage);
            return res.status(400).render('users/view_profile', { user: userDetails, organisations, errorMessage, activePage: 'my_profile' });
        }

        if (existingOrganisationEdit === 'new') {
            logger.debug("Ajout d'une nouvelle organisation en attente...");
            await handleNewOrganisationRequest(email, {
                newOrganisationSiren: newOrganisationSirenEdit,
                newOrganisationName: newOrganisationNameEdit,
                newOrganisationType: newOrganisationTypeEdit,
                newOrganisationAddress: newOrganisationAddressEdit
            });
        } else {
            logger.debug("Utilisateur s'associe à une organisation existante ...");
            await handleExistingOrganisationRequest(email, existingOrganisationEdit);
        }

        logger.info("Demande de changement d'organisation réussie.");
        res.redirect('/users/my_profile');
    } catch (error) {
        logger.error("Erreur lors de la demande de changement d'organisation:", error);
        res.status(500).render('error', { message: "Erreur de serveur.", error: error });
    }
});

// Route pour demander à devenir recruteur
router.post('/request-recruiter', isLoggedIn, async (req, res) => {
    logger.debug("Demande de changement de type de compte en 'recruteur en attente'...");
    try {
        const email = req.session.userEmail;
        const { userDetails, organisations } = await getUserDetailsAndOrgs(email);
        const { existingOrganisation, newOrganisationSiren, newOrganisationName, newOrganisationType, newOrganisationAddress } = req.body;

        let errorMessage = null;
        if (existingOrganisation === 'new') {
            errorMessage = await validateNewOrganisation({
                newOrganisationSiren,
                newOrganisationName,
                newOrganisationType,
                newOrganisationAddress
            });
        } else if (!existingOrganisation) {
            errorMessage = "Une organisation existante doit être sélectionnée.";
        }

        if (errorMessage) {
            logger.warn("Erreur lors de la validation de l'organisation:", errorMessage);
            return res.status(400).render('users/view_profile', { user: userDetails, organisations, errorMessage, activePage: 'my_profile' });
        }

        if (existingOrganisation === 'new') {
            logger.debug("Ajout d'une nouvelle organisation en attente...");
            await handleNewOrganisationRequest(email, {
                newOrganisationSiren,
                newOrganisationName,
                newOrganisationType,
                newOrganisationAddress
            });
        } else {
            logger.debug("Utilisateur s'associe à une organisation existante...");
            await handleExistingOrganisationRequest(email, existingOrganisation);
        }

        logger.info("Demande de changement de type de compte réussie.");
        res.redirect('/users/my_profile');
    } catch (error) {
        logger.error("Erreur lors de la demande de changement de type de compte:", error);
        res.status(500).render('error', { message: "Erreur de serveur.", error: error });
    }
});

// Route pour annuler la demande de devenir recruteur
router.get('/cancel-recruiter-request', isLoggedIn, async (req, res) => {
    logger.debug("Annulation de la demande de changement de type de compte...");
    try {
        const email = req.session.userEmail;
        const user = await Utilisateur.read(email);
        if (!user) {
            logger.warn("Aucun utilisateur trouvé avec cet email.");
            throw new Error("Détails de l'utilisateur non trouvés.");
        }

        const updated = await Utilisateur.updateTypeCompte(email, 'candidat');

        if (user.IdOrganisation) {
            await Utilisateur.updateTypeCompteWithOrganisation(email, 'candidat', null);
        }

        logger.info("Type de compte mis à jour en 'candidat' et organisation dissociée.");

        const organisation = await Organisation.read(user.IdOrganisation);
        if (organisation && organisation.StatutOrganisation === 'en attente') {
            await Organisation.delete(user.IdOrganisation);
            logger.info("Organisation supprimée.");
        }

        res.redirect('/users/my_profile');
    } catch (error) {
        logger.error("Erreur lors de l'annulation de la demande de changement de type de compte:", error);
        res.status(500).render('error', { message: "Erreur de serveur.", error: error });
    }
});

// Route pour gérer les demandes de recruteur
router.get('/manage_requests', isLoggedIn, isAdmin, async (req, res) => {
    logger.debug("Accès à la gestion des demandes...");
    try {
        const requests = await Utilisateur.getRecruiterRequests();
        res.render('applications/manage_requests', { requests: requests, activePage: 'manage_requests' });
    } catch (error) {
        logger.error("Erreur lors de l'accès à la gestion des demandes:", error);
        res.status(500).render('error', { message: "Erreur de serveur.", error: error });
    }
});

router.post('/accept_request', isLoggedIn, isAdmin, async (req, res) => {
    logger.debug("Acceptation de la demande de changement de type de compte...");
    try {
        const { email, organisationNumber } = req.body;
        const userDetails = await Utilisateur.read(email);
        if (!userDetails) {
            logger.warn("Aucun utilisateur trouvé avec cet email.");
            throw new Error("Détails de l'utilisateur non trouvés.");
        }

        const organisation = await Organisation.read(organisationNumber);

        if (organisation && userDetails.IdOrganisation === organisationNumber && organisation.StatutOrganisation === 'en attente') {
            await Organisation.updateStatus(organisationNumber, 'approuvée');
            logger.info("Statut de l'organisation mis à jour en 'approuvée'.");
        }

        await Utilisateur.updateTypeCompte(email, 'recruteur');
        logger.info("Demande acceptée et type de compte mis à jour en 'recruteur'.");

        res.redirect('/organizations/manage_requests');
    } catch (error) {
        logger.error("Erreur lors de l'acceptation de la demande:", error);
        res.status(500).render('error', { message: "Erreur de serveur.", error: error });
    }
});

router.post('/reject_request', isLoggedIn, isAdmin, async (req, res) => {
    logger.debug("Rejet de la demande de changement de type de compte...");
    try {
        const { email } = req.body;
        const userDetails = await Utilisateur.read(email);
        if (!userDetails) {
            logger.warn("Aucun utilisateur trouvé avec cet email.");
            throw new Error("Détails de l'utilisateur non trouvés.");
        }

        await Utilisateur.updateTypeCompteWithOrganisation(email, 'candidat', null);

        const organisation = await Organisation.read(userDetails.IdOrganisation);
        if (organisation && organisation.StatutOrganisation === 'en attente') {
            await Organisation.delete(userDetails.IdOrganisation);
            logger.info("Organisation en attente supprimée.");
        }

        res.redirect('/organizations/manage_requests');
    } catch (error) {
        logger.error("Erreur lors du rejet de la demande:", error);
        res.status(500).render('error', { message: "Erreur de serveur.", error: error });
    }
});

module.exports = router;