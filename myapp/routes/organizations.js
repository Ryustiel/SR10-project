const express = require('express');
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const isAdmin = require("../middleware/isAdmin");
const logger = require('../logger');
const {body, validationResult} = require('express-validator');
const Utilisateur = require('../model/utilisateur');
const Organisation = require('../model/organisation');
const {validateNewOrganisation} = require('../middleware/validationUtils');
const {
    handleNewOrganisationRequest,
    handleExistingOrganisationRequest
} = require('../middleware/userUtils');
const {canEditProfile} = require("../middleware/profile_properties");
const readMessage = require('../middleware/readMessage'); // Import the new middleware

// Route pour demander un changement d'organisation
router.post('/request-organisation-change', isLoggedIn, canEditProfile, [
    body('existingOrganisationEdit').notEmpty().withMessage('Une organisation existante doit être sélectionnée ou une nouvelle doit être créée'),
    body('newOrganisationSirenEdit').optional({checkFalsy: true}).isLength({
        min: 9,
        max: 9
    }).withMessage('SIREN invalide'),
    body('newOrganisationNameEdit').optional({checkFalsy: true}).notEmpty().withMessage("Nom de l'organisation requis"),
    body('newOrganisationTypeEdit').optional({checkFalsy: true}).notEmpty().withMessage("Type de l'organisation requis"),
    body('newOrganisationAddressEdit').optional({checkFalsy: true}).notEmpty().withMessage("Adresse de l'organisation requise")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect('/users/profile');
    }

    logger.debug("Demande de changement d'organisation...");
    try {
        const userId = req.body.userId || req.session.userEmail;
        const {
            existingOrganisationEdit,
            newOrganisationSirenEdit,
            newOrganisationNameEdit,
            newOrganisationTypeEdit,
            newOrganisationAddressEdit
        } = req.body;

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
        } else {
            // Check if the existing organization actually exists
            const existingOrg = await Organisation.read(existingOrganisationEdit);
            if (!existingOrg) {
                errorMessage = "L'organisation sélectionnée n'existe pas.";
            }
        }

        if (errorMessage) {
            req.session.message = errorMessage;
            req.session.messageType = 'error';
            return res.redirect('/users/profile');
        }

        if (existingOrganisationEdit === 'new') {
            logger.debug("Ajout d'une nouvelle organisation en attente...");
            await handleNewOrganisationRequest(userId, {
                newOrganisationSiren: newOrganisationSirenEdit,
                newOrganisationName: newOrganisationNameEdit,
                newOrganisationType: newOrganisationTypeEdit,
                newOrganisationAddress: newOrganisationAddressEdit
            });
        } else {
            logger.debug("Utilisateur s'associe à une organisation existante ...");
            await handleExistingOrganisationRequest(userId, existingOrganisationEdit);
        }

        // Update session user type
        req.session.userType = 'recruteur en attente';

        req.session.message = "Demande de changement d'organisation réussie.";
        req.session.messageType = 'notification';
        // Redirect to the profile POST route with the userId using a hidden form
        res.send(`
            <form id="redirectForm" method="post" action="/users/profile">
                <input type="hidden" name="userId" value="${userId}">
            </form>
            <script>document.getElementById('redirectForm').submit();</script>
        `);
    } catch (error) {
        res.status(500).render('error', {message: "Erreur de serveur.", error});
    }
});

// Route pour demander à devenir recruteur
router.post('/request-recruiter', isLoggedIn, canEditProfile, [
    body('existingOrganisation').notEmpty().withMessage('Une organisation existante doit être sélectionnée ou une nouvelle doit être créée'),
    body('newOrganisationSiren').optional({checkFalsy: true}).isLength({min: 9, max: 9}).withMessage('SIREN invalide'),
    body('newOrganisationName').optional({checkFalsy: true}).notEmpty().withMessage("Nom de l'organisation requis"),
    body('newOrganisationType').optional({checkFalsy: true}).notEmpty().withMessage("Type de l'organisation requis"),
    body('newOrganisationAddress').optional({checkFalsy: true}).notEmpty().withMessage("Adresse de l'organisation requise")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect('/users/profile');
    }

    logger.debug("Demande de changement de type de compte en 'recruteur en attente'...");
    try {
        const userId = req.body.userId || req.session.userEmail;
        const {
            existingOrganisation,
            newOrganisationSiren,
            newOrganisationName,
            newOrganisationType,
            newOrganisationAddress
        } = req.body;

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
        } else {
            // Check if the existing organization actually exists
            const existingOrg = await Organisation.read(existingOrganisation);
            if (!existingOrg) {
                errorMessage = "L'organisation sélectionnée n'existe pas.";
            }
        }

        if (errorMessage) {
            req.session.message = errorMessage;
            req.session.messageType = 'error';
            return res.redirect('/users/profile');
        }

        if (existingOrganisation === 'new') {
            logger.debug("Ajout d'une nouvelle organisation en attente...");
            await handleNewOrganisationRequest(userId, {
                newOrganisationSiren,
                newOrganisationName,
                newOrganisationType,
                newOrganisationAddress
            });
        } else {
            logger.debug("Utilisateur s'associe à une organisation existante...");
            await handleExistingOrganisationRequest(userId, existingOrganisation);
        }

        if (userId === req.session.userEmail) {
            // Mise à jour de la session
            req.session.userType = 'recruteur en attente';
        }

        req.session.message = "Demande de changement de type de compte réussie.";
        req.session.messageType = 'notification';
        res.send(`
            <form id="redirectForm" method="post" action="/users/profile">
                <input type="hidden" name="userId" value="${userId}">
            </form>
            <script>document.getElementById('redirectForm').submit();</script>
        `);
    } catch (error) {
        res.status(500).render('error', {message: "Erreur de serveur.", error});
    }
});

// Route pour annuler la demande de devenir recruteur
router.post('/cancel-recruiter-request', isLoggedIn, canEditProfile, async (req, res) => {
    logger.debug("Annulation de la demande de changement de type de compte...");
    try {
        const userId = req.body.userId || req.session.userEmail;
        const user = await Utilisateur.read(userId);
        if (!user) {
            throw new Error("Détails de l'utilisateur non trouvés.");
        }

        await Utilisateur.updateTypeCompte(userId, 'candidat');

        if (user.IdOrganisation) {
            await Utilisateur.updateTypeCompteWithOrganisation(userId, 'candidat', null);
        }

        if (userId === req.session.userEmail) {
            // Mise à jour de la session si l'utilisateur est connecté
            req.session.userType = 'candidat';
        }

        logger.info("Type de compte mis à jour en 'candidat' et organisation dissociée.");

        const organisation = await Organisation.read(user.IdOrganisation);
        if (organisation && organisation.StatutOrganisation === 'en attente') {
            await Organisation.delete(user.IdOrganisation);
            logger.info("Organisation supprimée.");
        }

        req.session.message = "Demande de changement de type de compte annulée avec succès.";
        req.session.messageType = 'notification';
        res.send(`
            <form id="redirectForm" method="post" action="/users/profile">
                <input type="hidden" name="userId" value="${userId}">
            </form>
            <script>document.getElementById('redirectForm').submit();</script>
        `);
    } catch (error) {
        res.status(500).render('error', {message: "Erreur de serveur.", error});
    }
});

// Route pour gérer les demandes de recruteur
router.get('/manage_requests', isLoggedIn, isAdmin, readMessage, async (req, res) => {
    logger.debug("Accès à la gestion des demandes...");
    try {
        const requests = await Utilisateur.getRecruiterRequests();
        res.render('applications/manage_requests', {requests, activePage: 'manage_requests'});
    } catch (error) {
        res.status(500).render('error', {message: "Erreur de serveur.", error});
    }
});

router.post('/accept_request', isLoggedIn, isAdmin, async (req, res) => {
    logger.debug("Acceptation de la demande de changement de type de compte...");
    try {
        const {email, organisationNumber} = req.body;
        const userDetails = await Utilisateur.read(email);
        if (!userDetails) {
            throw new Error("Détails de l'utilisateur non trouvés.");
        }

        const organisation = await Organisation.read(organisationNumber);

        if (organisation && userDetails.IdOrganisation === organisationNumber && organisation.StatutOrganisation === 'en attente') {
            await Organisation.updateStatus(organisationNumber, 'approuvée');
            logger.info("Statut de l'organisation mis à jour en 'approuvée'.");
        }

        await Utilisateur.updateTypeCompte(email, 'recruteur');
        req.session.message = "Demande acceptée et type de compte mis à jour en 'recruteur'.";
        req.session.messageType = 'notification';
        res.redirect('/organizations/manage_requests');
    } catch (error) {
        res.status(500).render('error', {message: "Erreur de serveur.", error});
    }
});

router.post('/reject_request', isLoggedIn, isAdmin, async (req, res) => {
    logger.debug("Rejet de la demande de changement de type de compte...");
    try {
        const {email} = req.body;
        const userDetails = await Utilisateur.read(email);
        if (!userDetails) {
            throw new Error("Détails de l'utilisateur non trouvés.");
        }

        await Utilisateur.updateTypeCompteWithOrganisation(email, 'candidat', null);

        const organisation = await Organisation.read(userDetails.IdOrganisation);
        if (organisation && organisation.StatutOrganisation === 'en attente') {
            await Organisation.delete(userDetails.IdOrganisation);
            logger.info("Organisation en attente supprimée.");
        }

        req.session.message = "Demande rejetée et type de compte mis à jour en 'candidat'.";
        req.session.messageType = 'notification';
        res.redirect('/organizations/manage_requests');
    } catch (error) {
        res.status(500).render('error', { message: "Erreur de serveur.", error });
    }
});

module.exports = router;
