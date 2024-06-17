const express = require('express');
const router = express.Router();
const Utilisateur = require('../model/utilisateur');
const Candidature = require('../model/candidature');
const OffreEmploi = require('../model/offreemploi');
const Organisation = require('../model/organisation');
const HistoriqueDemandes = require('../model/historiquedemandes');
//import is admin, is logged and readMessage in functions from middleware folder
const isLoggedIn = require('../middleware/isLoggedIn');
const isAdmin = require('../middleware/isAdmin');
const readMessage = require('../middleware/readMessage');

router.get('/', isLoggedIn, readMessage, async (req, res, next) => {
    try {
        const email = req.session.userEmail;
        const userDetails = await Utilisateur.read(email);

        if (!userDetails) {
            throw new Error("Détails de l'utilisateur non trouvés.");
        }

        if (userDetails.TypeCompte.toLowerCase() === 'candidat') {
            // Récupérer les candidatures de l'utilisateur
            const candidatures = await Candidature.getApplicationsCandidat(email);
            // Récupérer les dernières offres (hors celles déjà postulées et hors les offres de la même entreprise pour un recruteur en mode candidat)
            const offres = await OffreEmploi.getLatestOffers(email, userDetails.IdOrganisation);

            res.render('dashboards/dashboard_candidat', { user: userDetails, candidatures, offres });
        } else if (userDetails.TypeCompte.toLowerCase() === 'administrateur') {
            res.redirect('/dashboard/admin');
        } else {
            if (req.session.space === 'candidat') {
                const candidatures = await Candidature.getApplicationsCandidat(email);
                const offres = await OffreEmploi.getLatestOffers(email, userDetails.IdOrganisation);
                res.render('dashboards/dashboard_candidat', { user: userDetails, candidatures, offres });
            }
            else {
                res.redirect('/dashboard/recruteur');
            }
        }
    } catch (error) {
        error.status = 500;
        error.message = "Erreur lors de l'accès au dashboard";
        next(error);
    }
});

// Route pour le dashboard admin
router.get('/admin', isLoggedIn, isAdmin, readMessage, async (req, res, next) => {
    try {
        const utilisateurs = await Utilisateur.readAllOrderedByDateCreation();
        const organisations = await Organisation.readall();
        const demandesEnAttente = await HistoriqueDemandes.readEnAttente();

        res.render('dashboards/dashboard_admin', { utilisateurs, organisations, demandesEnAttente });
    } catch (error) {
        error.status = 500;
        error.message = "Erreur lors de l'accès au dashboard administrateur";
        next(error);
    }
});

// Route pour le dashboard recruteur
router.get('/recruteur', isLoggedIn, readMessage, async (req, res, next) => {
    try {
        const email = req.session.userEmail;
        const userDetails = await Utilisateur.read(email);

        if (!userDetails) {
            throw new Error("Détails de l'utilisateur non trouvés.");
        }

        if (userDetails.TypeCompte.toLowerCase() === 'recruteur') {
            // Récupérer les offres publiées par le recruteur
            const offres = await OffreEmploi.listRecruitorsOffers(email);
            // Récupérer les candidatures reçues pour les offres du recruteur
            const candidatures = await Candidature.getApplicationsRecruteur(email);
            res.render('dashboards/dashboard_recruteur', { user: userDetails, offres, candidatures });
            }
        else {
            res.redirect('/dashboard');
        }
    } catch (error) {
        error.status = 500;
        error.message = "Erreur lors de l'accès au dashboard";
        next(error);
    }
});

router.get('/switch-to-recruiter-space', isLoggedIn, (req, res) => {
    req.session.space = 'recruteur';
    res.redirect('/'); // Rediriger vers la page de dashboard ou toute autre page appropriée
});

router.get('/switch-to-candidate-space', isLoggedIn, (req, res) => {
    req.session.space = 'candidat';
    res.redirect('/'); // Rediriger vers la page de dashboard ou toute autre page appropriée
});

module.exports = router;