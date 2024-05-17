const express = require('express');
const router = express.Router();
const logger = require('../logger');
const multer = require('multer');

const OffreEmploi = require('../model/offreemploi');
const Candidature = require('../model/candidature');

const isLoggedIn = require('../middleware/isLoggedIn.js');
const requireRecruitorStatus = require('../middleware/requireRecruitorStatus.js');
const requireAffiliation = require('../middleware/requireAffiliation.js');

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
    const { idOffre } = req.body;
    if (await Candidature.isCandidate(req.session.userEmail, idOffre)) {
        await Candidature.delete(req.session.userEmail, idOffre);
        req.session.notification = `
            Vous ne candidatez plus à ${await OffreEmploi.getNom(idOffre)}
        `;
        res.redirect('/jobs/browse_offers');
    } else {
        res.render('error', {
            message: 'Vous n\'êtes pas autorisé à annuler cette candidature'
        });
    }
});

router.get('/my-applications', function(req, res, next) {

    let notification = req.session.notification;
    req.session.notification = '';

    res.render('applications/my_applications.ejs');
});
router.get('/incoming-applications', function(req, res, next) {
    res.render('applications/incoming_applications.ejs');
});



router.get('/recruitor-requests', function(req, res, next) {
    res.render('applications/browse_received.ejs', { title: 'Requêtes Recruteur' });
});
router.get('/organization-requests', function(req, res, next) {
    res.render('applications/browse_received.ejs', { title: 'Requêtes Organisations' });
});
router.get('/applicants', function(req, res, next) {
    res.render('applications/browse_received.ejs', { title: 'Requêtes Emploi' });
});

router.get('/offers', function(req, res, next) {
    res.render('applications/browse_sent.ejs', { title: 'Mes Offres' });
});
router.get('/job-descriptions', function(req, res, next) {
    res.render('applications/browse_sent.ejs', { title: 'Mes Fiches Emploi' });
});


router.post('/apply', isLoggedIn, async function(req, res, next) {
    const { idOffre } = req.body;
    const offre = await OffreEmploi.candidateViewOffer(idOffre);
    res.render('jobs/view_offer', { offre: offre });
});

module.exports = router;