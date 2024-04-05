const pool = require('./db'); // Assurez-vous que ce chemin est correct

const FichePoste = {
    create({ intitule, statutPoste, responsableHierarchique, typeMetier, lieuMission, rythme, salaire, description, idOrganisation }, callback) {
        const query = `
            INSERT INTO FichePoste 
            (Intitule, StatutPoste, ResponsableHierarchique, TypeMetier, LieuMission, Rythme, Salaire, Description, IdOrganisation) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        const values = [intitule, statutPoste, responsableHierarchique, typeMetier, lieuMission, rythme, salaire, description, idOrganisation];
        pool.query(query, values, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    read(id, callback) {
        const query = `SELECT * FROM FichePoste WHERE IdFiche = $1;`;
        pool.query(query, [id], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    update(id, { intitule, statutPoste, responsableHierarchique, typeMetier, lieuMission, rythme, salaire, description, idOrganisation }, callback) {
        const query = `
            UPDATE FichePoste 
            SET Intitule = $2, StatutPoste = $3, ResponsableHierarchique = $4, TypeMetier = $5, LieuMission = $6, Rythme = $7, Salaire = $8, Description = $9, IdOrganisation = $10
            WHERE IdFiche = $1
            RETURNING *;
        `;
        const values = [id, intitule, statutPoste, responsableHierarchique, typeMetier, lieuMission, rythme, salaire, description, idOrganisation];
        pool.query(query, values, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows[0]);
            }
        });
    },

    delete(id, callback) {
        const query = `DELETE FROM FichePoste WHERE IdFiche = $1;`;
        pool.query(query, [id], (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, true);
            }
        });
    },

    readall(callback) {
        const query = `SELECT * FROM FichePoste;`;
        pool.query(query, (error, results) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, results.rows);
            }
        });
    },

    areValid: function(idFiche, callback) {
        const sql = "SELECT * FROM FichePoste WHERE IdFiche = $1;";
        pool.query(sql, [idFiche], function(err, results) {
            if (err) {
                throw err;
            }
            callback(results.rows.length > 0);
        });
    }
};

module.exports = FichePoste;
