var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.redirect('/view')
});

const userModel = require('../model/utilisateur');

router.get('/view', function(req, res, next) {
  res.render('users/view_profile', { user: 'GET NAME HERE' });
});
router.post('/view', function(req, res, next) {
  userModel.readall(function(error, result) {
    if (error) {
      return next(error);
    }
    res.render('users/view_profile', { user: 'EXTRACT NAME FROM POST' });
  });
});

router.get('/browse', function(req, res, next) {
  userModel.readall(function(error, result) {
    if (error) {
      return next(error);
    }
    res.render('users/browse_users', { users: result || [] });
  });
});

module.exports = router;