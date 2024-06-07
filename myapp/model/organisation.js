const pool = require('./db');
const Utilisateur = require('./utilisateur');
const FichePoste = require('./ficheposte');
const OffreEmploi = require('./offreemploi');

const Organisation = {
    async create({ numeroSiren, nom, type, adresseAdministrative, statutOrganisation }) {
        const query = `
      INSERT INTO Organisation 
      (NumeroSiren, Nom, Type, AdresseAdministrative, StatutOrganisation) 
      VALUES (?, ?, ?, ?, ?);
    `;
        const values = [numeroSiren, nom, type, adresseAdministrative, statutOrganisation];
        await pool.query(query, values);
        return this.read(numeroSiren);
    },

    async read(numeroSiren) {
        const query = `SELECT * FROM Organisation WHERE NumeroSiren = ?;`;
        const [results] = await pool.query(query, [numeroSiren]);
        return results[0];
    },

    async update(numeroSiren, { nom, type, adresseAdministrative, statutOrganisation }) {
        const query = `
      UPDATE Organisation 
      SET Nom = ?, Type = ?, AdresseAdministrative = ?, StatutOrganisation = ?
      WHERE NumeroSiren = ?;
    `;
        const values = [nom, type, adresseAdministrative, statutOrganisation, numeroSiren];
        await pool.query(query, values);
        return this.read(numeroSiren);
    },

    async delete(numeroSiren) {
        const query = `DELETE FROM Organisation WHERE NumeroSiren = ?;`;
        const [result] = await pool.query(query, [numeroSiren]);
        return result.affectedRows > 0; // Retourne true si une ligne a été supprimée
    },

    async readall() {
        const query = `SELECT * FROM Organisation;`;
        const [results] = await pool.query(query);
        return results;
    },

    async areValid(idOrganisation) {
        const sql = "SELECT * FROM Organisation WHERE NumeroSiren = ?;";
        const [results] = await pool.query(sql, [idOrganisation]);
        return results.length > 0;
    },

    async updateStatus(numeroSiren, statutOrganisation) {
        const query = `UPDATE Organisation SET StatutOrganisation = ? WHERE NumeroSiren = ?;`;
        const values = [statutOrganisation, numeroSiren];
        const [result] = await pool.query(query, values);
        return result.affectedRows > 0; // Retourne true si une ligne a été mise à jour
    },

    async readApproved() {
        const query = 'SELECT * FROM Organisation WHERE StatutOrganisation = \'approuvée\'';
        const [results] = await pool.query(query);
        return results;
    },

    async readAllWithPagination(search, limit, offset) {
        const query = `
            SELECT * FROM Organisation
            WHERE Nom LIKE ?
            LIMIT ? OFFSET ?
        `;
        const [organisations] = await pool.query(query, [`%${search}%`, limit, offset]);

        const countQuery = `
            SELECT COUNT(*) as totalOrganisations FROM Organisation
            WHERE Nom LIKE ?
        `;
        const [[{ totalOrganisations }]] = await pool.query(countQuery, [`%${search}%`]);

        return { organisations, totalOrganisations };
    },
    async archiveOrganisationAndAssociations(numeroSiren) {
        // Récupérer tous les recruteurs de l'organisation et les repasser en candidats
        const utilisateurs = await Utilisateur.readAllByOrganisation(numeroSiren);
        for (const utilisateur of utilisateurs) {
            await Utilisateur.updateTypeCompteWithOrganisation(utilisateur.Email, 'candidat', null);
        }

        // Supprimer toutes les fiches de poste et les offres d'emploi associées
        const fichesPoste = await FichePoste.listFichesForOrganization(numeroSiren);
        for (const fiche of fichesPoste) {
            await OffreEmploi.deleteByFiche(fiche.IdFiche);
            await FichePoste.delete(fiche.IdFiche);
        }

        // Mettre à jour le statut de l'organisation à "refusée"
        const query = `UPDATE Organisation SET StatutOrganisation = 'refusée' WHERE NumeroSiren = ?;`;
        const [result] = await pool.query(query, [numeroSiren]);
        return result.affectedRows > 0; // Retourne true si une ligne a été mise à jour
    },
};

module.exports = Organisation;