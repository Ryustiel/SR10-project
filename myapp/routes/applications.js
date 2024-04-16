var express = require('express');
var router = express.Router();

router.get('/recruitor-requests', function(req, res, next) {
    res.render('applications/browse_received.ejs', { title: 'Requêtes Recruteur' });
});
router.get('/organization-requests', function(req, res, next) {
    res.render('applications/browse_received.ejs', { title: 'Requêtes Organisations' });
});
router.get('/applicants', function(req, res, next) {
    res.render('applications/browse_received.ejs', { title: 'Requêtes Emploi' });
});

router.get('/my-applications', function(req, res, next) {
    res.render('applications/browse_sent.ejs', { title: 'Mes Candidatures' });
});
router.get('/offers', function(req, res, next) {
    res.render('applications/browse_sent.ejs', { title: 'Mes Offres' });
});
router.get('/job-descriptions', function(req, res, next) {
    res.render('applications/browse_sent.ejs', { title: 'Mes Fiches Emploi' });
});

module.exports = router;