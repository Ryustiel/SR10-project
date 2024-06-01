const pool = require('./db');
const Candidature = require('./candidature');
const logger = require('../logger');
const bcrypt = require('bcryptjs');
const HistoriqueDemandes = require('./historiquedemandes');

const Utilisateur = {
    async create({email, motDePasse, nom, prenom, telephone, dateCreation, statutCompte, typeCompte, idOrganisation}) {
        const query = `
            INSERT INTO Utilisateur
            (Email, MotDePasse, Nom, Prenom, Telephone, DateCreation, StatutCompte, TypeCompte, IdOrganisation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const values = [email, motDePasse, nom, prenom, telephone, dateCreation, statutCompte, typeCompte, idOrganisation];
        await pool.query(query, values);
        return this.read(email);
    },

    async read(email) {
        const query = `SELECT *
                       FROM Utilisateur
                       WHERE Email = ?;`;
        const [results] = await pool.query(query, [email]);
        return results[0];
    },

    async update(email, fields) {
        const allowedFields = ['MotDePasse', 'Nom', 'Prenom', 'Telephone', 'DateCreation', 'StatutCompte', 'TypeCompte', 'IdOrganisation', 'Email'];
        const setClauses = [];
        const values = [];

        for (const field of allowedFields) {
            if (fields[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                values.push(fields[field]);
            }
        }

        if (setClauses.length === 0) {
            throw new Error('No fields to update');
        }

        const query = `
            UPDATE Utilisateur
            SET ${setClauses.join(', ')}
            WHERE Email = ?;
        `;
        values.push(email);

        await pool.query(query, values);
        return this.read(email);
    },

    async delete(email) {
        const connection = await pool.query;
        try {
            await connection('START TRANSACTION');

            // Lire toutes les candidatures de l'utilisateur
            const candidatures = await Candidature.getApplicationsCandidat(email);
            for (const candidature of candidatures) {
                // Supprimer chaque candidature
                await Candidature.delete(email, candidature.IdOffre);
            }

            await HistoriqueDemandes.deleteRequests(email);
            // Supprimer l'utilisateur
            const deleteUserQuery = `DELETE FROM Utilisateur WHERE Email = ?;`;
            await connection(deleteUserQuery, [email]);

            await connection('COMMIT');
        } catch (error) {
            await connection('ROLLBACK');
            throw error;
        }
    },

    async readall() {
        const query = `SELECT *
                       FROM Utilisateur;`;
        const [results] = await pool.query(query);
        return results;
    },

    async areValid(email, motDePasse) {
        const sql = "SELECT motDePasse FROM Utilisateur WHERE Email = ?;";
        const [users] = await pool.query(sql, [email]);
        if (users.length) {
            const user = users[0];
            return bcrypt.compare(motDePasse, user.motDePasse);
        }
        return false;
    },

    async getType(email) {
        const query = `SELECT TypeCompte
                       FROM Utilisateur
                       WHERE Email = ?;`;
        const [results] = await pool.query(query, [email]);
        if (results.length > 0) {
            return results[0].TypeCompte;
        } else {
            return null;
        }
    },

    async getNom(email) {
        const query = `SELECT Nom, Prenom
                       FROM Utilisateur
                       WHERE Email = ?;`;
        const [results] = await pool.query(query, [email]);
        if (results.length > 0) {
            return results[0].Nom + ' ' + results[0].Prenom;
        } else {
            return null;
        }
    },

    async getOrganisationId(email) {
        const query = `SELECT IdOrganisation
                       FROM Utilisateur
                       WHERE Email = ?;`;
        const [results] = await pool.query(query, [email]);
        if (results.length > 0) {
            return results[0].IdOrganisation;
        } else {
            return null;
        }
    },

    async updateTypeCompte(email, typeCompte) {
        const query = `
            UPDATE Utilisateur
            SET TypeCompte = ?
            WHERE Email = ?;
        `;
        const values = [typeCompte, email];

        await pool.query(query, values);
        return this.read(email);
    },

    async updateTypeCompteWithOrganisation(email, typeCompte, idOrganisation) {
        const query = `
            UPDATE Utilisateur
            SET TypeCompte     = ?,
                IdOrganisation = ?
            WHERE Email = ?;
        `;
        const values = [typeCompte, idOrganisation, email];

        await pool.query(query, values);
        return this.read(email);
    },

    async readAllWithPagination(search, limit, offset) {
        const query = `
            SELECT * FROM Utilisateur
            WHERE Email LIKE ?
            LIMIT ? OFFSET ?
        `;
        const [users] = await pool.query(query, [`%${search}%`, limit, offset]);

        const countQuery = `
            SELECT COUNT(*) as totalUsers FROM Utilisateur
            WHERE Email LIKE ?
        `;
        const [[{ totalUsers }]] = await pool.query(countQuery, [`%${search}%`]);

        return { users, totalUsers };
    },

    async getRecruiterRequestsWithPagination(search, limit, offset) {
        const query = `
            SELECT U.*, O.Nom AS OrganisationNom, O.StatutOrganisation
            FROM Utilisateur U
            LEFT JOIN Organisation O ON U.IdOrganisation = O.NumeroSiren
            WHERE U.TypeCompte = 'recruteur en attente' AND U.Email LIKE ?
            LIMIT ? OFFSET ?
        `;
        const [requests] = await pool.query(query, [`%${search}%`, limit, offset]);

        const countQuery = `
            SELECT COUNT(*) as totalRequests 
            FROM Utilisateur
            WHERE TypeCompte = 'recruteur en attente' AND Email LIKE ?
        `;
        const [[{ totalRequests }]] = await pool.query(countQuery, [`%${search}%`]);

        return { requests, totalRequests };
    },

    async readAllByOrganisation(idOrganisation) {
        const query = `SELECT * FROM Utilisateur WHERE IdOrganisation = ?;`;
        const [results] = await pool.query(query, [idOrganisation]);
        return results;
    },

    async readAllOrderedByDateCreation() {
        const query = `SELECT * FROM Utilisateur ORDER BY DateCreation DESC;`;
        const [results] = await pool.query(query);
        return results;
    },
};

module.exports = Utilisateur;
