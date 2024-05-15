const pool = require('./db');

const FichePoste = {
    async create({ intitule, statutPoste, responsableHierarchique, typeMetier, lieuMission, rythme, salaire, description, idOrganisation }) {
        const query = `
            INSERT INTO FichePoste 
            (Intitule, StatutPoste, ResponsableHierarchique, TypeMetier, LieuMission, Rythme, Salaire, Description, IdOrganisation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const values = [intitule, statutPoste, responsableHierarchique, typeMetier, lieuMission, rythme, salaire, description, idOrganisation];
        await pool.query(query, values);
        // Assume it returns something meaningful
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
        const query = `SELECT IdFiche, Intitule FROM FichePoste WHERE IdOrganisation = ?;`;
        const [results] = await pool.query(query, [idOrganisation]);
        return results;
    },

    async isUserLegitimate(idFiche, idOrganisationRecruteur) {
        const query = `SELECT COUNT(*) FROM FichePoste WHERE IdFiche = ? AND IdOrganisation = ? AND StatutPoste = 'Ouvert';`;
        const [results] = await pool.query(query, [idFiche, idOrganisationRecruteur]);
        return results[0]['COUNT(*)'] > 0;
    }
};

module.exports = FichePoste;