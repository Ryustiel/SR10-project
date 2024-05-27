const pool = require('./db');
const logger = require('../logger.js');

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

    async update(id, fields) {
        const allowedFields = ['Etat', 'ListePieces', 'NombrePieces', 'IdFiche', 'IdRecruteur'];
        const setClauses = [];
        const values = [];

        for (const field of allowedFields) {
            if (fields[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                values.push(fields[field]);
            }
        }

        if (fields['DateValidite'] !== undefined) {
            setClauses.push(`DateValidite = ?`);
            values.push(fields['DateValidite']);
        }

        if (setClauses.length === 0) {
            throw new Error('No fields to update');
        }

        const query = `
            UPDATE OffreEmploi
            SET ${setClauses.join(', ')}
            WHERE IdOffre = ?;
        `;
        values.push(id);

        logger.info(`Executing query: ${query}`);
        logger.info(`With values: ${JSON.stringify(values)}`);

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
            SELECT IdOffre, Intitule, DateValidite
            FROM OffreEmploi AS O
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
                   NombrePieces, Org.nom AS organisationNom, idOrganisation 
            FROM OffreEmploi AS Off 
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
    },

    async updateRecruiterEmail(oldEmail, newEmail) {
        const query = `UPDATE OffreEmploi SET IdRecruteur = ? WHERE IdRecruteur = ?;`;
        await pool.query(query, [newEmail, oldEmail]);
    },

    async browseOffers(search, sort, typeMetier, minSalaire, maxSalaire, limit, offset, excludeOrganisationId, userRole) {
        let query = `
            SELECT IdOffre, Intitule, Description, StatutPoste, ResponsableHierarchique, 
                   TypeMetier, LieuMission, Rythme, Salaire, DateValidite, ListePieces, 
                   NombrePieces, F.IdOrganisation 
            FROM OffreEmploi AS O 
            JOIN FichePoste AS F 
            ON O.IdFiche = F.IdFiche
            WHERE Etat = 'publié' 
            AND Intitule LIKE ? 
            AND Salaire BETWEEN ? AND ?
        `;
        let values = [`%${search}%`, minSalaire, maxSalaire];

        if (typeMetier) {
            query += ` AND TypeMetier = ?`;
            values.push(typeMetier);
        }

        if (userRole !== 'candidat') {
            query += ` AND F.IdOrganisation != ?`;
            values.push(excludeOrganisationId);
        }

        if (sort === 'date') {
            query += ` ORDER BY DateValidite DESC`;
        } else if (sort === 'lieu') {
            query += ` ORDER BY LieuMission ASC`;
        } else if (sort === 'salaire') {
            query += ` ORDER BY Salaire DESC`;
        }

        query += ` LIMIT ? OFFSET ?`;
        values.push(limit, offset);

        const [offres] = await pool.query(query, values);

        let countQuery = `
            SELECT COUNT(*) as totalOffres 
            FROM OffreEmploi AS O 
            JOIN FichePoste AS F 
            ON O.IdFiche = F.IdFiche
            WHERE Etat = 'publié' 
            AND Intitule LIKE ? 
            AND Salaire BETWEEN ? AND ?
        `;
        let countValues = [`%${search}%`, minSalaire, maxSalaire];

        if (typeMetier) {
            countQuery += ` AND TypeMetier = ?`;
            countValues.push(typeMetier);
        }

        if (userRole !== 'candidat') {
            countQuery += ` AND F.IdOrganisation != ?`;
            countValues.push(excludeOrganisationId);
        }

        const [[{ totalOffres }]] = await pool.query(countQuery, countValues);

        return { offres, totalOffres };
    },

    async getTypesMetier() {
        const query = `SELECT DISTINCT TypeMetier
                       FROM FichePoste`;
        const [results] = await pool.query(query);
        return results.map(row => row.TypeMetier);
    },
};

module.exports = OffreEmploi;
