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

    async getNom(idOffre) {
        const query = `
            SELECT Intitule FROM OffreEmploi 
            JOIN FichePoste On OffreEmploi.IdFiche = FichePoste.IdFiche
            WHERE IdOffre = ?;
        `;
        const [results] = await pool.query(query, [idOffre]);
        if (!results || results.length === 0) {
            return "OFFRE INCONNUE";
        }
        return results[0]['Intitule'];
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

    async candidateListOffers() {
      const query = `
          SELECT IdOffre, Intitule, DateValidite FROM OffreEmploi AS O 
          JOIN FichePoste AS F 
          ON O.IdFiche = F.IdFiche
          WHERE Etat = 'publié';
      `;
        const [results] = await pool.query(query);
        return results;
    },

    async candidateViewOffer(idOffre) {
        const query = `
            SELECT IdOffre, Intitule, Description, StatutPoste, ResponsableHierarchique, 
                   TypeMetier, LieuMission, Rythme, Salaire, DateValidite, ListePieces, 
                   NombrePieces, nom, idOrganisation FROM OffreEmploi AS Off 
            JOIN FichePoste AS F 
            ON Off.IdFiche = F.IdFiche
            JOIN Organisation AS Org 
            ON F.IdOrganisation = Org.NumeroSiren
            WHERE IdOffre = ? AND Etat = 'publié';
        `;
        const [results] = await pool.query(query, [idOffre]);
        return results[0];
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
    },

    async isOrganisationLegitimate(idOffre, idRecruteur) {
        const query = `
            SELECT COUNT(*) FROM OffreEmploi AS O 
            JOIN FichePoste AS F 
            ON O.IdFiche = F.IdFiche
            JOIN Utilisateur AS U
            ON F.IdOrganisation = U.IdOrganisation
            WHERE O.IdOffre = ? AND U.Email = ?;
        `;
        const [results] = await pool.query(query, [idOffre, idRecruteur]);
        logger.info(`isOrganisationLegitimate : ${idOffre} ${idRecruteur} ${results[0]['COUNT(*)']}`);
        return results[0]['COUNT(*)'] > 0;
    }
};

module.exports = OffreEmploi;