const express = require('express');
const router = express.Router();

// URLS SPECIAUX POUR LE TESTING
router.get('/mock-recruteur', (req, res) => {
    req.session.userEmail = 'test@email.com';
    req.session.userType = 'recruteur';
    req.session.userAffiliation = '123456789';
    res.send('ok');
});

router.get('/reset-session', (req, res) => {
    req.session.userEmail = null;
    req.session.userType = null;
    req.session.userAffiliation = null;
    res.send('ok');
});

module.exports = router;