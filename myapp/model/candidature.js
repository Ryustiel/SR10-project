const pool = require('./db');
const AssociationFichiers = require('./associationfichiers.js');
const logger = require('../logger');

const Candidature = {

    async create(idCandidat, idOffre, dateCandidature, files) {
        const query = `
            INSERT INTO Candidature (IdCandidat, IdOffre, DateCandidature)
            VALUES (?, ?, ?);
        `;

        const values = [idCandidat, idOffre, dateCandidature];
        await pool.query(query, values);

        if (files.length > 0) {
            for (const file of files) {
                logger.info(`Creating file entry for ${file.filename} with user ${idCandidat} and offer ${idOffre}`);
                await AssociationFichiers.create(idCandidat, idOffre, file.filename, file.originalname);
            }
        }

        return this.read(idCandidat, idOffre);
    },

    async read(idCandidat, idOffre) {
        const query = `SELECT * FROM Candidature WHERE IdCandidat = ? AND IdOffre = ?;`;
        const [results] = await pool.query(query, [idCandidat, idOffre]);
        return results[0];
    },

    async update(idCandidat, idOffre, { dateCandidature }) {
        const query = `
            UPDATE Candidature
            SET DateCandidature = ?
            WHERE IdCandidat = ? AND IdOffre = ?;
        `;

        const values = [dateCandidature, idCandidat, idOffre];
        await pool.query(query, values);
        return this.read(idCandidat, idOffre);
    },

    async delete(idCandidat, idOffre) {
        await AssociationFichiers.deleteFiles(idCandidat, idOffre);
        const query = `DELETE FROM Candidature WHERE IdCandidat = ? AND IdOffre = ?;`;
        await pool.query(query, [idCandidat, idOffre]);
    },

    async readall() {
        const query = `SELECT * FROM Candidature;`;
        const [results] = await pool.query(query);
        return results;
    },

    async isCandidate(idCandidat, idOffre) {
        const query = `SELECT COUNT(*) FROM Candidature WHERE IdCandidat = ? AND IdOffre = ?;`;
        const [results] = await pool.query(query, [idCandidat, idOffre]);
        return results[0]['COUNT(*)'] > 0;
    },

    async getApplicationsRecruteur(idRecruteur) {
        const query = `
            SELECT O.IdOffre, IdCandidat, Nom, Prenom, Intitule, DateCandidature
            FROM Candidature AS C
            JOIN OffreEmploi AS O ON C.IdOffre = O.IdOffre
            JOIN Utilisateur AS U ON C.IdCandidat = U.email
            JOIN FichePoste AS F ON F.IdFiche = O.IdFiche
            WHERE O.IdRecruteur = ?;
        `;
        const [results] = await pool.query(query, [idRecruteur]);
        return results;
    },

    async getApplicationsCandidat(idCandidat) {
        const query = `
            SELECT O.IdOffre, Intitule, DateCandidature
            FROM Candidature AS C
                     JOIN OffreEmploi AS O ON C.IdOffre = O.IdOffre
                     JOIN FichePoste AS F ON F.IdFiche = O.IdFiche
            WHERE C.IdCandidat = ?;
        `;
        const [results] = await pool.query(query, [idCandidat]);
        return results;
    },

    async updateCandidateEmail(oldEmail, newEmail) {
        const query = `UPDATE AssociationFichiers SET IdCandidat = ? WHERE IdCandidat = ?;`;
        await pool.query(query, [newEmail, oldEmail]);
    },

    async deleteByOffre(idOffre) {
        // Supprimer les fichiers associés
        await AssociationFichiers.deleteFilesByOffre(idOffre);

        // Supprimer les candidatures
        const query = `DELETE FROM Candidature WHERE IdOffre = ?`;
        await pool.query(query, [idOffre]);
    },
    async getApplicationsForOrganisation(idOrganisation) {
        const query = `
            SELECT O.IdOffre, C.IdCandidat, U.Nom, U.Prenom, F.Intitule, C.DateCandidature
            FROM Candidature AS C
            JOIN OffreEmploi AS O ON C.IdOffre = O.IdOffre
            JOIN Utilisateur AS U ON C.IdCandidat = U.email
            JOIN FichePoste AS F ON F.IdFiche = O.IdFiche
            WHERE F.IdOrganisation = ?;
        `;
        const [results] = await pool.query(query, [idOrganisation]);
        return results;
    }

};

module.exports = Candidature;
