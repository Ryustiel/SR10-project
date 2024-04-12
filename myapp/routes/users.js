const express = require('express');
const router = express.Router();
const userModel = require('../model/utilisateur');

router.get('/userslist', async (req, res, next) => {
  try {
    const users = await userModel.readall();
    res.render('usersList', { title: 'Liste des Utilisateurs', users: users });
  } catch (error) {
    next(error); // Passe les erreurs au gestionnaire d'erreurs
  }
});

module.exports = router;