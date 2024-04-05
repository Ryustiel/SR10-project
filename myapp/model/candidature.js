const pool = require('./db'); // Assurez-vous que ce chemin est correct

const Candidature = {
    create({ idCandidat, idOffre, dateCandidature }, callback) {
        const query = `
            INSERT INTO Candidature 
            (IdCandidat, IdOffre, DateCandidature) 
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [idCandidat, idOffre, dateCandidature];
        pool.query(query, values, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    read(id, callback) {
        const query = `SELECT * FROM Candidature WHERE IdCandidature = $1;`;
        pool.query(query, [id], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    update(id, { idCandidat, idOffre, dateCandidature }, callback) {
        const query = `
            UPDATE Candidature 
            SET IdCandidat = $2, IdOffre = $3, DateCandidature = $4
            WHERE IdCandidature = $1
            RETURNING *;
        `;
        const values = [id, idCandidat, idOffre, dateCandidature];
        pool.query(query, values, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    delete(id, callback) {
        const query = `DELETE FROM Candidature WHERE IdCandidature = $1;`;
        pool.query(query, [id], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, true);
            }
        });
    },

    readall(callback) {
        const query = `SELECT * FROM Candidature;`;
        pool.query(query, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows);
            }
        });
    },

    areValid: function(idCandidature, callback) {
        const sql = "SELECT * FROM Candidature WHERE IdCandidature = $1;";
        pool.query(sql, [idCandidature], function(err, results) {
            if (err) {
                throw err;
            }
            callback(results.rows.length > 0);
        });
    }
};

module.exports = Candidature;
