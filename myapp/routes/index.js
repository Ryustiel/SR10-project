var express = require('express');
var router = express.Router();

/* GET home page. */
router.all('/', function(req, res) {
  res.redirect('/login');
});

router.get('/candidat', function(req, res, next) {
  res.render('dashboards/candidat');
});

router.get('/recruteur', function(req, res, next) {
  res.render('dashboards/recruteur');
});

router.get('/administrateur', function(req, res, next) {
  res.render('dashboards/administrateur');
});

router.get('/register', function(req, res, next) {
  res.render('auth/register');
});
router.post('/register', function(req, res, next) {
  res.redirect('/candidat');
});

router.get('/login', function(req, res, next) {
    res.render('auth/login');
});
router.post('/login', function(req, res, next) {
  res.redirect('/candidat');
});

module.exports = router;
