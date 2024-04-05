const pool = require('./db'); // Assurez-vous que ce chemin est correct

const AssociationFichiers = {
    create({ idCandidature, fichier }, callback) {
        const query = `
            INSERT INTO AssociationFichiers 
            (IdCandidature, Fichier) 
            VALUES ($1, $2)
            RETURNING *;
        `;
        const values = [idCandidature, fichier];
        pool.query(query, values, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    read(id, callback) {
        const query = `SELECT * FROM AssociationFichiers WHERE IdAssociation = $1;`;
        pool.query(query, [id], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    update(id, { idCandidature, fichier }, callback) {
        const query = `
            UPDATE AssociationFichiers 
            SET IdCandidature = $2, Fichier = $3
            WHERE IdAssociation = $1
            RETURNING *;
        `;
        const values = [id, idCandidature, fichier];
        pool.query(query, values, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    delete(id, callback) {
        const query = `DELETE FROM AssociationFichiers WHERE IdAssociation = $1;`;
        pool.query(query, [id], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, true);
            }
        });
    },

    readall(callback) {
        const query = `SELECT * FROM AssociationFichiers;`;
        pool.query(query, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows);
            }
        });
    },

    areValid: function(identifiant, callback) {
        const sql = "SELECT * FROM AssociationFichiers WHERE IdAssociation = $1;";
        pool.query(sql, [identifiant], function(err, results) {
            if (err) {
                throw err;
            }
            callback(results.rows.length > 0);
        });
    }
};

module.exports = AssociationFichiers;
