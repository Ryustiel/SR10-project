const express = require('express');
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const isAdmin = require("../middleware/isAdmin");
const logger = require('../logger');
const { body, validationResult } = require('express-validator');
const Utilisateur = require('../model/utilisateur');
const Organisation = require('../model/organisation');
const HistoriqueDemandes = require('../model/historiquedemandes'); // Importer le modèle HistoriqueDemandes
const FichePoste = require('../model/ficheposte');
const OffreEmploi = require("../model/offreemploi");
const Candidature = require('../model/candidature');

const { validateNewOrganisation } = require('../middleware/validationUtils');
const {
    handleNewOrganisationRequest,
    handleExistingOrganisationRequest
} = require('../middleware/userUtils');
const { canEditProfile } = require("../middleware/profile_properties");
const readMessage = require('../middleware/readMessage');

// Route pour demander un changement d'organisation
router.post('/request-organisation-change', isLoggedIn, canEditProfile, [
    body('existingOrganisationEdit').notEmpty().withMessage('Une organisation existante doit être sélectionnée ou une nouvelle doit être créée'),
    body('newOrganisationSirenEdit').optional({ checkFalsy: true }).isLength({ min: 9, max: 9 }).withMessage('SIREN invalide'),
    body('newOrganisationNameEdit').optional({ checkFalsy: true }).notEmpty().withMessage("Nom de l'organisation requis"),
    body('newOrganisationTypeEdit').optional({ checkFalsy: true }).notEmpty().withMessage("Type de l'organisation requis"),
    body('newOrganisationAddressEdit').optional({ checkFalsy: true }).notEmpty().withMessage("Adresse de l'organisation requise")
], async (req, res, next) => {
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
        let typeDemande = '';
        let organisationId = existingOrganisationEdit === 'new' ? newOrganisationSirenEdit : existingOrganisationEdit;
        //Supprimer les offres d'emploi du recruteur de l'ancienne organisation
        await OffreEmploi.deleteByRecruteur(userId);
        if (existingOrganisationEdit === 'new') {
            errorMessage = await validateNewOrganisation({
                newOrganisationSiren: newOrganisationSirenEdit,
                newOrganisationName: newOrganisationNameEdit,
                newOrganisationType: newOrganisationTypeEdit,
                newOrganisationAddress: newOrganisationAddressEdit
            });
            typeDemande = 'recruteur_ajout_nouvelle_organisation';
        } else if (!existingOrganisationEdit) {
            errorMessage = "Une organisation existante doit être sélectionnée.";
        } else {
            // Check if the existing organization actually exists
            const existingOrg = await Organisation.read(existingOrganisationEdit);
            if (!existingOrg) {
                errorMessage = "L'organisation sélectionnée n'existe pas.";
            } else {
                typeDemande = 'recruteur_changement_organisation_existante';
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

        if (userId === req.session.userEmail) {
            req.session.space = "candidat";
            req.session.userType = 'recruteur en attente';
            req.session.userAffiliation = await Utilisateur.getOrganisationId(userId);
        }

        req.session.message = "Demande de changement d'organisation réussie.";
        req.session.messageType = 'notification';
        await HistoriqueDemandes.create(
            organisationId,
            'en attente',
            typeDemande,
            userId
        );

        // Redirect to the profile POST route with the userId using a hidden form
        res.send(`
            <form id="redirectForm" method="post" action="/users/profile">
                <input type="hidden" name="userId" value="${userId}">
            </form>
            <script>document.getElementById('redirectForm').submit();</script>
        `);
    } catch (error) {
        logger.error(`Erreur lors de la demande de changement d'organisation : ${error}`);
        error.status = 500;
        error.message = "Erreur lors de la demande de changement d'organisation";
        next(error);
    }
});

// Route pour demander à devenir recruteur
router.post('/request-recruiter', isLoggedIn, canEditProfile, [
    body('existingOrganisation').notEmpty().withMessage('Une organisation existante doit être sélectionnée ou une nouvelle doit être créée'),
    body('newOrganisationSiren').optional({ checkFalsy: true }).isLength({ min: 9, max: 9 }).withMessage('SIREN invalide'),
    body('newOrganisationName').optional({ checkFalsy: true }).notEmpty().withMessage("Nom de l'organisation requis"),
    body('newOrganisationType').optional({ checkFalsy: true }).notEmpty().withMessage("Type de l'organisation requis"),
    body('newOrganisationAddress').optional({ checkFalsy: true }).notEmpty().withMessage("Adresse de l'organisation requise")
], async (req, res, next) => {
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
        let typeDemande = '';
        let organisationId = existingOrganisation === 'new' ? newOrganisationSiren : existingOrganisation;

        if (existingOrganisation === 'new') {
            errorMessage = await validateNewOrganisation({
                newOrganisationSiren,
                newOrganisationName,
                newOrganisationType,
                newOrganisationAddress
            });
            typeDemande = 'nouveau_recruteur_nouvelle_organisation';
        } else if (!existingOrganisation) {
            errorMessage = "Une organisation existante doit être sélectionnée.";
        } else {
            // Check if the existing organization actually exists
            const existingOrg = await Organisation.read(existingOrganisation);
            if (!existingOrg) {
                errorMessage = "L'organisation sélectionnée n'existe pas.";
            } else {
                typeDemande = 'nouveau_recruteur_organisation_existante';
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
        // Mise à jour de la session
        if (userId === req.session.userEmail) {
            req.session.space = "candidat";
            req.session.userType = 'recruteur en attente';
            req.session.userAffiliation = await Utilisateur.getOrganisationId(userId);
        }

        req.session.message = "Demande de changement de type de compte et/ou d'ajout d'organisation réussie.";
        req.session.messageType = 'notification';
        await HistoriqueDemandes.create(
            organisationId,
            'en attente',
            typeDemande,
            userId
        );

        res.send(`
            <form id="redirectForm" method="post" action="/users/profile">
                <input type="hidden" name="userId" value="${userId}">
            </form>
            <script>document.getElementById('redirectForm').submit();</script>
        `);
    } catch (error) {
        logger.error(`Impossible de mettre à jour le type de compte/l'organisation : ${error}`);
        error.status = 500;
        error.message = "Impossible de mettre à jour le type de compte/l'organisation.";
        next(error);
    }
});

// Route pour annuler la demande de devenir recruteur
router.post('/cancel-recruiter-request', isLoggedIn, canEditProfile, async (req, res, next) => {
    logger.debug("Annulation de la demande de changement de type de compte...");
    try {
        const userId = req.body.userId || req.session.userEmail;
        const user = await Utilisateur.read(userId);
        if (!user) {
            throw new Error("Détails de l'utilisateur non trouvés.");
        }

        logger.info("Type de compte mis à jour en 'candidat' et organisation dissociée.");

        // Supprimer l'entrée en attente de l'historique

        const organisation = await Organisation.read(user.IdOrganisation);
        await Utilisateur.updateTypeCompteWithOrganisation(userId, 'candidat', null);
        await HistoriqueDemandes.updateAction(organisation.NumeroSiren, userId, "refusée", req.session.userEmail);
        if (organisation && organisation.StatutOrganisation === 'en attente') {
            await Organisation.archiveOrganisationAndAssociations(user.IdOrganisation);
            logger.info("Organisation supprimée.");
        }

        // Mise à jour de la session si l'utilisateur est connecté
        if (userId === req.session.userEmail) {
            req.session.space = "candidat";
            req.session.userType = 'candidat';
            req.session.userAffiliation = await Utilisateur.getOrganisationId(userId);
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
        logger.error(`Erreur lors de la gestion du compte/de l'organisation : ${error}`);
        error.status = 500;
        error.message = "Erreur lors de la gestion du compte/de l'organisation.";
        next(error);
    }
});

// Route pour gérer les demandes de recruteur avec recherche et pagination
router.get('/manage_requests', isLoggedIn, isAdmin, readMessage, async (req, res, next) => {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 8; // Nombre de demandes par page
    const offset = (page - 1) * limit;
    const placeholder = "Rechercher par email";
    const showHistory = req.query.showHistory === 'true';

    logger.debug("Accès à la gestion des demandes...");
    try {
        if (showHistory) {
            const { requests, totalRequests } = await HistoriqueDemandes.readAllWithPagination(search, limit, offset);
            const totalPages = Math.ceil(totalRequests / limit);

            res.render('applications/manage_history', {
                requests,
                search,
                currentPage: page,
                totalPages,
                activePage: '/organizations/manage_requests?showHistory=true',
                placeholder,
                showHistory
            });
        } else {
            const { requests, totalRequests } = await Utilisateur.getRecruiterRequestsWithPagination(search, limit, offset);
            const totalPages = Math.ceil(totalRequests / limit);

            res.render('applications/manage_requests', {
                requests,
                search,
                currentPage: page,
                totalPages,
                activePage: '/organizations/manage_requests?showHistory=false',
                placeholder,
                showHistory
            });
        }
    } catch (error) {
        logger.error(`Erreur lors de la récupération des demandes de recrutement : ${error}`);
        error.status = 500;
        error.message = "Erreur lors de la récupération des demandes de recrutement.";
        next(error);
    }
});

router.post('/accept_request', isLoggedIn, isAdmin, async (req, res, next) => {
    logger.debug("Acceptation de la demande de changement de type de compte...");
    try {
        const { email, organisationNumber, search, page } = req.body;
        const userDetails = await Utilisateur.read(email);
        if (!userDetails) {
            throw new Error("Détails de l'utilisateur non trouvés.");
        }

        const organisation = await Organisation.read(organisationNumber);

        if (organisation && userDetails.IdOrganisation === organisationNumber && organisation.StatutOrganisation === 'en attente') {
            await Organisation.updateStatus(organisationNumber, 'approuvée');
            logger.info("Statut de l'organisation mis à jour en 'approuvée'.");
        }

        // Récupérer toutes les candidatures du candidat
        const candidatures = await Candidature.getApplicationsCandidat(email);

        // Filtrer les candidatures qui appartiennent à l'organisation
        for (const candidature of candidatures) {
            const offre = await OffreEmploi.read(candidature.IdOffre);
            const fiche = await FichePoste.read(offre.IdFiche);
            if (fiche.IdOrganisation === organisationNumber) {
                // Supprimer la candidature
                await Candidature.delete(email, candidature.IdOffre);
            }
        }

        await Utilisateur.updateTypeCompte(email, 'recruteur');
        await HistoriqueDemandes.updateAction(organisationNumber, email, 'approuvée', req.session.userEmail);
        req.session.message = "Demande acceptée et type de compte mis à jour en 'recruteur'.";
        req.session.messageType = 'notification';
        res.redirect(`/organizations/manage_requests?search=${encodeURIComponent(search)}&page=${page}`);
    } catch (error) {
        logger.error(`Erreur lors de l'acceptation de la demande de changement de type de compte/d'organisation : ${error}`);
        error.status = 500;
        error.message = "Erreur lors de l'acceptation de la demande de changement de type de compte/d'organisation.";
        next(error);
    }
});

router.post('/reject_request', isLoggedIn, isAdmin, async (req, res, next) => {
    logger.debug("Rejet de la demande de changement de type de compte...");
    try {
        const { email, search, page } = req.body;
        const userDetails = await Utilisateur.read(email);
        if (!userDetails) {
            throw new Error("Détails de l'utilisateur non trouvés.");
        }

        const organisation = await Organisation.read(user.IdOrganisation);
        await HistoriqueDemandes.updateAction(organisation.NumeroSiren, userId, "refusée", req.session.userEmail);
        if (organisation && organisation.StatutOrganisation === 'en attente') {
            await Organisation.archiveOrganisationAndAssociations(user.IdOrganisation);
            logger.info("Organisation supprimée.");
        }
        else{
            await Utilisateur.updateTypeCompteWithOrganisation(email, 'candidat', null);
        }

        req.session.message = "Demande rejetée et type de compte mis à jour en 'candidat'.";
        req.session.messageType = 'notification';
        res.redirect(`/organizations/manage_requests?search=${encodeURIComponent(search)}&page=${page}`);
    } catch (error) {
        logger.error(`Erreur lors du rejet de la demande : ${error}`);
        error.status = 500;
        error.message = "Erreur lors du rejet de la demande.";
        next(error);
    }
});

// Route pour lister toutes les organisations avec pagination et recherche
router.get('/list_organisations', isLoggedIn, isAdmin, readMessage, async (req, res, next) => {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Number of organisations per page
    const offset = (page - 1) * limit;
    const placeholder = "Rechercher par nom d'organisation";

    try {
        const { organisations, totalOrganisations } = await Organisation.readAllWithPagination(search, limit, offset);
        const totalPages = Math.ceil(totalOrganisations / limit);

        logger.info("Liste des organisations récupérée avec succès.");
        res.render('applications/list_organisations', {
            title: 'Liste des Organisations',
            organisations: organisations || [],
            search,
            currentPage: page,
            totalPages,
            placeholder
        });
    } catch (error) {
        logger.error(`Erreur lors de la récupération de la liste des organisations : ${error}`);
        error.status = 500;
        error.message = "Erreur interne du serveur lors de la récupération de la liste des organisations";
        next(error);
    }
});


// Route pour supprimer une organisation
router.post('/delete_organisation', isLoggedIn, isAdmin, async (req, res, next) => {
    const { numeroSiren } = req.body;
    try {
        // Récupérer tous les recruteurs de l'organisation et les repasser en candidats
        const utilisateurs = await Utilisateur.readAllByOrganisation(numeroSiren);
        for (const utilisateur of utilisateurs) {
            await Utilisateur.updateTypeCompteWithOrganisation(utilisateur.Email, 'candidat', null);
        }

        // Supprimer toutes les fiches de poste et les offres d'emploi associées
        const fichesPoste = await FichePoste.listFichesForOrganization(numeroSiren);
        for (const fiche of fichesPoste) {
            await OffreEmploi.deleteByFiche(fiche.IdFiche);
            await FichePoste.delete(fiche.IdFiche);
        }

        // Supprimer l'historique des demandes associées à l'organisation
        await HistoriqueDemandes.deleteByOrganisation(numeroSiren);

        // Supprimer l'organisation
        await Organisation.delete(numeroSiren);

        logger.info(`Organisation ${numeroSiren} supprimée avec succès.`);

        req.session.message = "Organisation supprimée avec succès.";
        req.session.messageType = 'notification';
        res.redirect('/organizations/list_organisations');
    } catch (error) {
        logger.error(`Erreur lors de la suppression de l'organisation : ${error}`);
        error.status = 500;
        error.message = "Erreur lors de la suppression de l'organisation.";
        next(error);
    }
});


module.exports = router;
