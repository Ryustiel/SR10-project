const pool = require('./db'); // Vérifiez que ce chemin est correct

const DemandeAjoutOrganisation = {
    create({ idDemandeur, idOrganisation }, callback) {
        const query = `
            INSERT INTO DemandeAjoutOrganisation
            (IdDemandeur, IdOrganisation)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const values = [idDemandeur, idOrganisation];
        pool.query(query, values, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    read(id, callback) {
        const query = `SELECT * FROM DemandeAjoutOrganisation WHERE IdDemandeAjout = $1;`;
        pool.query(query, [id], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    update(id, { idDemandeur, idOrganisation }, callback) {
        const query = `
            UPDATE DemandeAjoutOrganisation
            SET IdDemandeur = $2, IdOrganisation = $3
            WHERE IdDemandeAjout = $1
            RETURNING *;
        `;
        const values = [id, idDemandeur, idOrganisation];
        pool.query(query, values, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    delete(id, callback) {
        const query = `DELETE FROM DemandeAjoutOrganisation WHERE IdDemandeAjout = $1;`;
        pool.query(query, [id], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, true);
            }
        });
    },

    readall(callback) {
        const query = `SELECT * FROM DemandeAjoutOrganisation;`;
        pool.query(query, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows);
            }
        });
    },

    areValid: function(idDemande, callback) {
        const sql = "SELECT * FROM DemandeAjoutOrganisation WHERE IdDemandeAjout = $1;";
        pool.query(sql, [idDemande], function(err, results) {
            if (err) {
                throw err;
            }
            callback(results.rows.length > 0);
        });
    }

};

module.exports = DemandeAjoutOrganisation;
