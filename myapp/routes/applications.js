const express = require('express');
const router = express.Router();
const logger = require('../logger');
const multer = require('multer');

const OffreEmploi = require('../model/offreemploi');
const Candidature = require('../model/candidature');
const Utilisateur = require('../model/utilisateur');
const Organisation = require('../model/organisation');

const isLoggedIn = require('../middleware/isLoggedIn.js');
const requireRecruitorStatus = require('../middleware/requireRecruitorStatus.js');
const requireAffiliation = require('../middleware/requireAffiliation.js');
const readNotification = require('../middleware/readNotification');
const isAdmin = require('../middleware/isAdmin');


// Set storage engine
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/apply', upload.array('formFileLg'), isLoggedIn, async function(req, res, next) {
    try {
        const files = req.files;

        // Check if files exist
        //if (!files || files.length === 0) {
        //    return res.status(400).send('No files uploaded');
        //}

        // Convert the file buffers to strings or process them further
        files.forEach(file => {
            const fileString = file.buffer.toString();
            logger.warn(`File content : ${fileString}`)
            // Store the file string or process it further
        });

        const { idOffre } = req.body;
        const idCandidat = req.session.userEmail;
        const dateCandidature = new Date();

        // CREATE APPLICATION
        await Candidature.create({
            idCandidat,
            idOffre,
            dateCandidature
        });

        const nom = await OffreEmploi.getNom(idOffre);
        req.session.notification = `Vous avez postulé à ${nom}`;
        res.redirect('/jobs/browse_offers');
    } catch (error) {
        next(error);
    }
});


router.post('/cancel-application', isLoggedIn, async function(req, res, next) {
    const { idOffre, idCandidat } = req.body;
    if (idCandidat === 'self') {
        if (await Candidature.isCandidate(req.session.userEmail, idOffre)) {
            await Candidature.delete(req.session.userEmail, idOffre);
            req.session.notification = `
            Vous ne candidatez plus à ${await OffreEmploi.getNom(idOffre)}
        `;
            res.redirect('/jobs/browse_offers');
        } else {
            req.session.notification = `Vous n'êtes pas candidat à ${await OffreEmploi.getNom(idOffre)}`;
            res.redirect('/jobs/browse_offers');
        }
    } else if (req.session.userAffiliation === 'recruiter') {
        await Candidature.delete(idCandidat, idOffre);
        // TODO : A SECURISER
    }
        else {
        req.session.notification = 'Vous n\'êtes pas autorisé à annuler cette candidature'
        res.redirect('/jobs/browse_offers');
    }
});


router.get('/my-applications', isLoggedIn, readNotification, async function(req, res, next) {

    const candidatures = await Candidature.getApplicationsCandidat(req.session.userEmail);

    res.render('applications/my_applications.ejs', {
        notification: req.notification,
        candidatures: candidatures
    });
});


router.get('/incoming-applications', async function(req, res, next) {
    const candidatures = await Candidature.getApplicationsRecruteur(req.session.userEmail);

    res.render('applications/incoming_applications.ejs', {
        notification: req.notification,
        candidatures: candidatures
    });
});


router.post('/request-recruiter', isLoggedIn, async (req, res) => {
    logger.debug("Demande de changement de type de compte en 'recruteur en attente'...");
    try {
        const email = req.session.userEmail;
        const { existingOrganisation, newOrganisationSiren, newOrganisationName, newOrganisationType, newOrganisationAddress } = req.body;

        let errorMessage = null;

        // Validation des champs
        if (existingOrganisation === 'new') {
            if (!newOrganisationSiren || !newOrganisationName || !newOrganisationType || !newOrganisationAddress) {
                logger.warn("Tous les champs pour la nouvelle organisation doivent être remplis.");
                errorMessage = "Tous les champs pour la nouvelle organisation doivent être remplis.";
            } else {
                // Vérifier si l'organisation existe déjà
                const organisationExists = await Organisation.read(newOrganisationSiren);
                if (organisationExists) {
                    logger.warn("L'organisation existe déjà.");
                    errorMessage = "L'organisation avec ce SIREN existe déjà.";
                }
            }
        } else {
            if (!existingOrganisation) {
                logger.warn("Une organisation existante doit être sélectionnée.");
                errorMessage = "Une organisation existante doit être sélectionnée.";
            }
        }

        if (errorMessage) {
            const organisations = await Organisation.readApproved();
            res.render('users/view_profile', {
                user: await Utilisateur.read(email),
                organisations: organisations,
                errorMessage: errorMessage,
                activePage: 'my_profile'
            });
            return;
        }

        if (existingOrganisation === 'new') {
            logger.debug("Ajout d'une nouvelle organisation en attente...");
            const newOrganisation = {
                numeroSiren: newOrganisationSiren,
                nom: newOrganisationName,
                type: newOrganisationType,
                adresseAdministrative: newOrganisationAddress,
                statutOrganisation: 'en attente'
            };

            const organisationCreated = await Organisation.create(newOrganisation);
            if (!organisationCreated) {
                logger.warn("Impossible de créer la nouvelle organisation.");
                throw new Error("Impossible de créer la nouvelle organisation.");
            }
            const updated = await Utilisateur.updateTypeCompteWithOrganisation(email, 'recruteur en attente', newOrganisation.numeroSiren);
            if (!updated) {
                logger.warn("Impossible de mettre à jour le type de compte.");
                throw new Error("Impossible de mettre à jour le type de compte avec la nouvelle organisation.");
            }
            logger.info("Nouvelle organisation ajoutée et demande de changement de type de compte envoyée.");
        } else {
            const updated = await Utilisateur.updateTypeCompteWithOrganisation(email, 'recruteur en attente', existingOrganisation);
            if (!updated) {
                logger.warn("Impossible de mettre à jour le type de compte.");
                throw new Error("Impossible de mettre à jour le type de compte avec l'organisation existante.");
            }
            logger.info("Demande de changement de type de compte envoyée avec organisation existante.");
        }
        res.redirect('/dashboard/my_profile');
    } catch (error) {
        logger.error("Erreur lors de la demande de changement de type de compte:", error);
        res.status(500).render('error', { message: "Erreur de serveur.", error: error });
    }
});

router.get('/cancel-recruiter-request', isLoggedIn, async (req, res) => {
    logger.debug("Annulation de la demande de changement de type de compte...");
    try {
        const email = req.session.userEmail;
        const user = await Utilisateur.read(email);

        if (!user) {
            logger.warn("Aucun utilisateur trouvé avec cet email.");
            throw new Error("Détails de l'utilisateur non trouvés.");
        }

        // Mettre à jour le type de compte de l'utilisateur et son organisation
        const updated = await Utilisateur.updateTypeCompte(email, 'candidat');
        if (!updated) {
            logger.warn("Impossible de mettre à jour le type de compte.");
            throw new Error("Impossible de mettre à jour le type de compte.");
        }

        if (user.IdOrganisation) {
            //supprimer l'organisation des attributs de l'utilisateur
            const updated = await Utilisateur.updateTypeCompteWithOrganisation(email, 'candidat', null);
            if (!updated) {
                logger.warn("Impossible de supprimer l'organisation de l'utilisateur.");
                throw new Error("Impossible de supprimer l'organisation de l'utilisateur.");
            }
        }
        logger.info("Type de compte mis à jour en 'candidat' et organisation dissociée.");

        // Vérifier si l'organisation de l'utilisateur est en attente
        const organisation = await Organisation.read(user.IdOrganisation);
        if (organisation && organisation.StatutOrganisation === 'en attente') {
            // Supprimer l'organisation
            await Organisation.delete(user.IdOrganisation);
            if (!organisationDeleted) {
                logger.warn("Impossible de supprimer l'organisation.");
                throw new Error("Impossible de supprimer l'organisation.");
            }
            logger.info("Organisation supprimée.");
        }

        res.redirect('/dashboard/my_profile');
    } catch (error) {
        logger.error("Erreur lors de l'annulation de la demande de changement de type de compte:", error);
        res.status(500).render('error', { message: "Erreur de serveur.", error: error });
    }
});

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

        if (userDetails.IdOrganisation === organisationNumber) {
            const organisationUpdated = await Organisation.updateStatus(organisationNumber, 'approuvée');
            if (!organisationUpdated) {
                logger.warn("Impossible de mettre à jour le statut de l'organisation.");
                throw new Error("Impossible de mettre à jour le statut de l'organisation.");
            }
        }

        const updated = await Utilisateur.updateTypeCompte(email, 'recruteur');
        if (!updated) {
            logger.warn("Impossible de mettre à jour le type de compte.");
            throw new Error("Impossible de mettre à jour le type de compte.");
        }

        logger.info("Demande acceptée et type de compte mis à jour en 'recruteur'.");
        res.redirect('/applications/manage_requests');
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

        // Mettre à jour le type de compte de l'utilisateur et supprimer l'association avec l'organisation
        const updated = await Utilisateur.updateTypeCompteWithOrganisation(email, 'candidat', null);
        if (!updated) {
            logger.warn("Impossible de mettre à jour le type de compte.");
            throw new Error("Impossible de mettre à jour le type de compte.");
        }

        logger.info("Type de compte mis à jour en 'candidat' et organisation dissociée.");

        // Vérifier si l'organisation de l'utilisateur est en attente
        const organisation = await Organisation.read(userDetails.IdOrganisation);
        if (organisation && organisation.StatutOrganisation === 'en attente') {
            // Supprimer l'organisation
            const organisationDeleted = await Organisation.delete(userDetails.IdOrganisation);
            if (!organisationDeleted) {
                logger.warn("Impossible de supprimer l'organisation.");
                throw new Error("Impossible de supprimer l'organisation.");
            }
            logger.info("Organisation en attente supprimée.");
        }

        res.redirect('/applications/manage_requests');
    } catch (error) {
        logger.error("Erreur lors du rejet de la demande:", error);
        res.status(500).render('error', { message: "Erreur de serveur.", error: error });
    }
});



router.get('/offers', function(req, res, next) {
    res.render('applications/browse_sent.ejs', { title: 'Mes Offres' });
});
router.get('/job-descriptions', function(req, res, next) {
    res.render('applications/browse_sent.ejs', { title: 'Mes Fiches Emploi' });
});

module.exports = router;