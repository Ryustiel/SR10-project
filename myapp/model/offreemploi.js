const pool = require('./db');
const logger = require('../logger.js')

const OffreEmploi = {
    async create({ etat, dateValidite, listePieces, nombrePieces, idFiche, idRecruteur }) {
        const query = `
      INSERT INTO OffreEmploi 
      (Etat, DateValidite, ListePieces, NombrePieces, IdFiche, IdRecruteur) 
      VALUES (?, ?, ?, ?, ?, ?);
    `;
        const values = [etat, dateValidite, listePieces, nombrePieces, idFiche, idRecruteur];
        await pool.query(query, values);
        return this.read(idFiche);
    },

    async read(id) {
        const query = `SELECT * FROM OffreEmploi WHERE IdOffre = ?;`;
        const [results] = await pool.query(query, [id]);
        return results[0];
    },

    async update(id, { etat, dateValidite, listePieces, nombrePieces, idFiche, idRecruteur }) {
        const query = `
      UPDATE OffreEmploi 
      SET Etat = ?, DateValidite = ?, ListePieces = ?, NombrePieces = ?, IdFiche = ?, IdRecruteur = ?
      WHERE IdOffre = ?;
    `;
        const values = [etat, dateValidite, listePieces, nombrePieces, idFiche, idRecruteur, id];
        await pool.query(query, values);
        return this.read(id);
    },

    async delete(id) {
        const query = `DELETE FROM OffreEmploi WHERE IdOffre = ?;`;
        await pool.query(query, [id]);
    },

    async readall() {
        const query = `SELECT * FROM OffreEmploi;`;
        const [results] = await pool.query(query);
        return results;
    },

    async listRecruitorsOffers(idRecruteur) {
        const query = `
            SELECT IdOffre, Intitule, DateValidite, Etat FROM OffreEmploi AS O 
            JOIN FichePoste AS F 
            ON O.IdFiche = F.IdFiche
            WHERE IdRecruteur = ?;
        `;
        const [results] = await pool.query(query, [idRecruteur]);
        return results;
    },

    async publier(idOffre) {
        const query = `UPDATE OffreEmploi SET Etat = 'publié' WHERE IdOffre = ?;`;
        await pool.query(query, [idOffre]);
    },

    async depublier(idOffre) {
        const query = `UPDATE OffreEmploi SET Etat = 'non publié' WHERE IdOffre = ?;`;
        await pool.query(query, [idOffre]);
    },

    async isUserLegitimate(idOffre, idRecruteur) {
        const query = `SELECT COUNT(*) FROM OffreEmploi WHERE IdOffre = ? AND IdRecruteur = ?`;
        const [results] = await pool.query(query, [idOffre, idRecruteur]);
        logger.info(`isUserLegitimate : ${idOffre} ${idRecruteur} ${results[0]['COUNT(*)']}`);
        return results[0]['COUNT(*)'] > 0;
    }
};

module.exports = OffreEmploi;