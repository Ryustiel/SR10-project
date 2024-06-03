const pool = require('./db');
const Candidature = require('./candidature');
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

        await pool.query(query, values);
        return this.read(id);
    },

    async delete(idOffre) {
        // Suppression des candidatures associées
        await Candidature.deleteByOffre(idOffre);

        const query = `DELETE FROM OffreEmploi WHERE IdOffre = ?`;
        await pool.query(query, [idOffre]);
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
        SELECT IdOffre, Intitule, DateValidite, Etat 
        FROM OffreEmploi AS O
        JOIN FichePoste AS F ON O.IdFiche = F.IdFiche
        WHERE IdRecruteur = ?
        ORDER BY DateValidite ASC;
    `;
        const [results] = await pool.query(query, [idRecruteur]);
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
        AND DateValidite >= CURDATE()
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
        AND DateValidite >= CURDATE()
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

    async readWithFichePosteAndOrganisation(idOffre) {
        const query = `
        SELECT O.IdOffre, O.Etat, O.DateValidite, O.ListePieces, O.NombrePieces, 
               F.Intitule, F.Description, F.StatutPoste, F.ResponsableHierarchique, 
               F.TypeMetier, F.LieuMission, F.Rythme, F.Salaire, 
               Org.Nom AS OrganisationNom, Org.NumeroSiren AS IdOrganisation
        FROM OffreEmploi AS O
        JOIN FichePoste AS F ON O.IdFiche = F.IdFiche
        JOIN Organisation AS Org ON F.IdOrganisation = Org.NumeroSiren
        WHERE O.IdOffre = ?;
    `;
        const [results] = await pool.query(query, [idOffre]);
        return results[0];
    },


    async countByFiche(idFiche) {
        const query = `SELECT COUNT(*) as count FROM OffreEmploi WHERE IdFiche = ?`;
        const [results] = await pool.query(query, [idFiche]);
        return results[0].count;
    },

    async deleteByFiche(idFiche) {
        // Récupérer toutes les offres d'emploi associées à la fiche
        const [offres] = await pool.query(`SELECT IdOffre FROM OffreEmploi WHERE IdFiche = ?`, [idFiche]);

        // Pour chaque offre d'emploi, supprimer les candidatures associées
        for (const offre of offres) {
            await Candidature.deleteByOffre(offre.IdOffre);
        }

        // Ensuite, supprimer les offres d'emploi
        const query = `DELETE FROM OffreEmploi WHERE IdFiche = ?`;
        await pool.query(query, [idFiche]);
    },

    async deleteByRecruteur(idRecruteur) {
        const query = `DELETE FROM OffreEmploi WHERE IdRecruteur = ?`;
        await pool.query(query, [idRecruteur]);
    },

    async listOffersForOrganisation(idOrganisation, search, limit, offset) {
        const query = `
            SELECT O.IdOffre, F.Intitule, O.DateValidite, O.Etat 
            FROM OffreEmploi AS O
            JOIN FichePoste AS F ON O.IdFiche = F.IdFiche
            WHERE F.IdOrganisation = ? AND F.Intitule LIKE ?
            LIMIT ? OFFSET ?;
        `;
        const values = [idOrganisation, `%${search}%`, limit, offset];
        const [results] = await pool.query(query, values);
        return results;
    },

    async countOffersForOrganisation(idOrganisation, search) {
        const query = `
            SELECT COUNT(*) as totalOffers 
            FROM OffreEmploi AS O
            JOIN FichePoste AS F ON O.IdFiche = F.IdFiche
            WHERE F.IdOrganisation = ? AND F.Intitule LIKE ?;
        `;
        const values = [idOrganisation, `%${search}%`];
        const [[{ totalOffers }]] = await pool.query(query, values);
        return totalOffers;
    },

    async isUserInOrganisation(idOffre, userEmail) {
        const query = `
            SELECT COUNT(*) FROM OffreEmploi AS O
            JOIN FichePoste AS F ON O.IdFiche = F.IdFiche
            JOIN Organisation AS Org ON F.IdOrganisation = Org.NumeroSiren
            JOIN Utilisateur AS U ON Org.NumeroSiren = U.IdOrganisation
            WHERE O.IdOffre = ? AND U.Email = ?;
        `;
        const [results] = await pool.query(query, [idOffre, userEmail]);
        logger.info(`isUserInOrganisation : ${idOffre} ${userEmail} ${results[0]['COUNT(*)']}`);
        return results[0]['COUNT(*)'] > 0;
    },
    async getLatestOffers(idCandidat, excludeOrganisationId = null) {
        let query = `
    SELECT F.Intitule, F.LieuMission, F.Salaire, O.DateValidite
    FROM OffreEmploi O
    JOIN FichePoste F ON O.IdFiche = F.IdFiche
    LEFT JOIN Candidature C ON O.IdOffre = C.IdOffre AND C.IdCandidat = ?
    WHERE O.Etat = 'publié'
      AND O.DateValidite >= CURDATE()
      AND C.IdOffre IS NULL
    `;
        let values = [idCandidat];

        if (excludeOrganisationId) {
            query += ` AND F.IdOrganisation != ?`;
            values.push(excludeOrganisationId);
        }

        query += ` ORDER BY O.DateValidite DESC`;

        const [results] = await pool.query(query, values);
        return results;
    }
};

module.exports = OffreEmploi;
