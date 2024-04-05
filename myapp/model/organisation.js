const pool = require('./db'); // Assurez-vous que ce chemin est correct

const Organisation = {
    create({ numeroSiren, nom, type, adresseAdministrative, statutOrganisation }, callback) {
        const query = `
            INSERT INTO Organisation 
            (NumeroSiren, Nom, Type, AdresseAdministrative, StatutOrganisation) 
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [numeroSiren, nom, type, adresseAdministrative, statutOrganisation];
        pool.query(query, values, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    read(numeroSiren, callback) {
        const query = `SELECT * FROM Organisation WHERE NumeroSiren = $1;`;
        pool.query(query, [numeroSiren], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    update(numeroSiren, { nom, type, adresseAdministrative, statutOrganisation }, callback) {
        const query = `
            UPDATE Organisation 
            SET Nom = $2, Type = $3, AdresseAdministrative = $4, StatutOrganisation = $5
            WHERE NumeroSiren = $1
            RETURNING *;
        `;
        const values = [numeroSiren, nom, type, adresseAdministrative, statutOrganisation];
        pool.query(query, values, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    delete(numeroSiren, callback) {
        const query = `DELETE FROM Organisation WHERE NumeroSiren = $1;`;
        pool.query(query, [numeroSiren], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, true);
            }
        });
    },

    readall(callback) {
        const query = `SELECT * FROM Organisation;`;
        pool.query(query, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows);
            }
        });
    },

    areValid: function(idOrganisation, callback) {
        const sql = "SELECT * FROM Organisation WHERE numerosiren = $1;";
        pool.query(sql, [idOrganisation], function(err, results) {
            if (err) {
                throw err;
            }
            callback(results.rows.length > 0);
        });
    }
};

module.exports = Organisation;
