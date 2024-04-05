const pool = require('./db');

const Utilisateur = {
    create({ email, motDePasse, nom, prenom, telephone, dateCreation, statutCompte, typeCompte, idOrganisation }, callback) {
        const query = `
            INSERT INTO Utilisateur 
            (Email, MotDePasse, Nom, Prenom, Telephone, DateCreation, StatutCompte, TypeCompte, IdOrganisation) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        const values = [email, motDePasse, nom, prenom, telephone, dateCreation, statutCompte, typeCompte, idOrganisation];
        pool.query(query, values, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    read(email, callback) {
        const query = `SELECT * FROM Utilisateur WHERE Email = $1;`;
        pool.query(query, [email], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    update(email, { motDePasse, nom, prenom, telephone, dateCreation, statutCompte, typeCompte, idOrganisation }, callback) {
        const query = `
            UPDATE Utilisateur 
            SET MotDePasse = $2, Nom = $3, Prenom = $4, Telephone = $5, DateCreation = $6, StatutCompte = $7, TypeCompte = $8, IdOrganisation = $9
            WHERE Email = $1
            RETURNING *;
        `;
        const values = [email, motDePasse, nom, prenom, telephone, dateCreation, statutCompte, typeCompte, idOrganisation];
        pool.query(query, values, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    delete(email, callback) {
        const query = `DELETE FROM Utilisateur WHERE Email = $1;`;
        pool.query(query, [email], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, true);
            }
        });
    },

    readall(callback) {
        const query = `SELECT * FROM Utilisateur;`;
        pool.query(query, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows);
            }
        });
    },

    areValid: function(email, motDePasse, callback) {
        const sql = "SELECT MotDePasse FROM Utilisateur WHERE Email = $1;";
        pool.query(sql, [email], function(err, results) {
            if (err) {
                throw err;
            }
            if (results.rows.length === 1 && results.rows[0].motdepasse === motDePasse) {
                callback(true);
            } else {
                callback(false);
            }
        });
    }
};

module.exports = Utilisateur;
