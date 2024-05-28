const pool = require('./db');
const OffreEmploi = require('./offreemploi');
const logger = require('../logger');

const FichePoste = {
    async create({ intitule, statutPoste, responsableHierarchique, typeMetier, lieuMission, rythme, salaire, description, idOrganisation }) {
        const query = `
            INSERT INTO FichePoste 
            (Intitule, StatutPoste, ResponsableHierarchique, TypeMetier, LieuMission, Rythme, Salaire, Description, IdOrganisation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const values = [intitule, statutPoste, responsableHierarchique, typeMetier, lieuMission, rythme, salaire, description, idOrganisation];
        await pool.query(query, values);
        return this.read(idOrganisation);
    },

    async read(id) {
        const query = `SELECT * FROM FichePoste WHERE IdFiche = ?;`;
        const [results] = await pool.query(query, [id]);
        return results[0];
    },

    async update(id, { intitule, statutPoste, responsableHierarchique, typeMetier, lieuMission, rythme, salaire, description, idOrganisation }) {
        const query = `
            UPDATE FichePoste
            SET Intitule = ?, StatutPoste = ?, ResponsableHierarchique = ?, TypeMetier = ?, LieuMission = ?, Rythme = ?, Salaire = ?, Description = ?, IdOrganisation = ?
            WHERE IdFiche = ?;
        `;
        const values = [intitule, statutPoste, responsableHierarchique, typeMetier, lieuMission, rythme, salaire, description, idOrganisation, id];
        await pool.query(query, values);
        return this.read(id);
    },

    async list() {
        const query = `SELECT idFiche, intitule FROM FichePoste;`;
        const [results] = await pool.query(query);
        return results;
    },

    async delete(id) {
        const query = `DELETE FROM FichePoste WHERE IdFiche = ?;`;
        await pool.query(query, [id]);
    },

    async readall() {
        const query = `SELECT * FROM FichePoste;`;
        const [results] = await pool.query(query);
        return results;
    },

    async listFiches(idOrganisation) {
        const query = `
            SELECT F.IdFiche, F.Intitule, F.StatutPoste, F.ResponsableHierarchique, F.TypeMetier, F.LieuMission, F.Rythme, F.Salaire, F.Description, F.IdOrganisation, O.Nom AS OrganisationNom
            FROM FichePoste F
            JOIN Organisation O ON F.IdOrganisation = O.NumeroSiren
            WHERE F.IdOrganisation = ?;
        `;
        const [results] = await pool.query(query, [idOrganisation]);
        return results;
    },

    async isUserLegitimate(idFiche, idOrganisationRecruteur) {
        const query = `SELECT COUNT(*) FROM FichePoste WHERE IdFiche = ? AND IdOrganisation = ?`;
        const [results] = await pool.query(query, [idFiche, idOrganisationRecruteur]);
        return results[0]['COUNT(*)'] > 0;
    },

    async hasDependents(idFiche) {
        return await OffreEmploi.countByFiche(idFiche) > 0;
    },

    async deleteWithDependents(idFiche) {
        try {
            await pool.query('START TRANSACTION');
            await OffreEmploi.deleteByFiche(idFiche);
            await pool.query(`DELETE FROM FichePoste WHERE IdFiche = ?`, [idFiche]);
            await pool.query('COMMIT');
            logger.info(`Suppression de la fiche ${idFiche} réussie.`);
        } catch (error) {
            await pool.query('ROLLBACK');
            logger.error(`Erreur lors de la suppression de la fiche ${idFiche}: ${error.message}`);
            throw error;
        }
    },

    async listFichesForOrganization(idOrganisation) {
        const query = `SELECT IdFiche, Intitule FROM FichePoste WHERE IdOrganisation = ?;`;
        const [results] = await pool.query(query, [idOrganisation]);
        return results;
    },

    async listFichesWithPaginationAndSearch(idOrganisation, search, limit, offset) {
        const query = `
        SELECT F.IdFiche, F.Intitule, F.StatutPoste, F.ResponsableHierarchique, F.TypeMetier, F.LieuMission, F.Rythme, F.Salaire, F.Description, F.IdOrganisation
        FROM FichePoste F
        WHERE F.IdOrganisation = ?
        AND F.Intitule LIKE ?
        LIMIT ? OFFSET ?;
    `;
        const [results] = await pool.query(query, [idOrganisation, `%${search}%`, limit, offset]);
        return results;
    },

    async countFichesWithSearch(idOrganisation, search) {
        const query = `
        SELECT COUNT(*) as count
        FROM FichePoste
        WHERE IdOrganisation = ?
        AND Intitule LIKE ?;
    `;
        const [results] = await pool.query(query, [idOrganisation, `%${search}%`]);
        return results[0].count;
    }
};

module.exports = FichePoste;
