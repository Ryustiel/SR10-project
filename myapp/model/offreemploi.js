const pool = require('./db'); // Assurez-vous que ce chemin est correct

const OffreEmploi = {
    create({ etat, dateValidite, listePieces, nombrePieces, idFiche, idRecruteur }, callback) {
        const query = `
            INSERT INTO OffreEmploi 
            (Etat, DateValidite, ListePieces, NombrePieces, IdFiche, IdRecruteur) 
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [etat, dateValidite, listePieces, nombrePieces, idFiche, idRecruteur];
        pool.query(query, values, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    read(id, callback) {
        const query = `SELECT * FROM OffreEmploi WHERE IdOffre = $1;`;
        pool.query(query, [id], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    update(id, { etat, dateValidite, listePieces, nombrePieces, idFiche, idRecruteur }, callback) {
        const query = `
            UPDATE OffreEmploi 
            SET Etat = $2, DateValidite = $3, ListePieces = $4, NombrePieces = $5, IdFiche = $6, IdRecruteur = $7
            WHERE IdOffre = $1
            RETURNING *;
        `;
        const values = [id, etat, dateValidite, listePieces, nombrePieces, idFiche, idRecruteur];
        pool.query(query, values, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    delete(id, callback) {
        const query = `DELETE FROM OffreEmploi WHERE IdOffre = $1;`;
        pool.query(query, [id], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, true);
            }
        });
    },

    readall(callback) {
        const query = `SELECT * FROM OffreEmploi;`;
        pool.query(query, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows);
            }
        });
    },

    areValid: function(idOffre, callback) {
        const sql = "SELECT * FROM OffreEmploi WHERE IdOffre = $1;";
        pool.query(sql, [idOffre], function(err, results) {
            if (err) {
                throw err;
            }
            callback(results.rows.length > 0);
        });
    }
};

module.exports = OffreEmploi;