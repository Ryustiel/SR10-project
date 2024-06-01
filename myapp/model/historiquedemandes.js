const pool = require('./db');
const logger = require('../logger');

const HistoriqueDemandes = {
    async create(numeroSiren, action, typeDemande, userId) {
        const query = `
            INSERT INTO HistoriqueDemandes (NumeroSiren, Action, TypeDemande, UserId)
            VALUES (?, ?, ?, ?);
        `;
        const values = [numeroSiren, action, typeDemande, userId];
        const [result] = await pool.query(query, values);
        return result.insertId;
    },

    async read(idHistorique) {
        const query = `SELECT * FROM HistoriqueDemandes WHERE IdHistorique = ?;`;
        const [results] = await pool.query(query, [idHistorique]);
        return results[0];
    },

    async readAll() {
        const query = `SELECT * FROM HistoriqueDemandes;`;
        const [results] = await pool.query(query);
        return results;
    },

    async readEnAttente() {
        const query = `SELECT * FROM HistoriqueDemandes WHERE Action = 'en attente';`;
        const [results] = await pool.query(query);
        return results;
    },

    async updateAction(numeroSiren, userId, newAction, administrateurEmail) {
        const query = `
            UPDATE HistoriqueDemandes
            SET Action = ?, AdministrateurEmail = ?
            WHERE NumeroSiren = ? AND UserId = ? AND Action = 'en attente';
        `;
        const values = [newAction, administrateurEmail, numeroSiren, userId];
        const [result] = await pool.query(query, values);
        return result.affectedRows > 0;
    },

    async readAllWithPagination(search, limit, offset) {
        const query = `
            SELECT H.*, O.Nom AS OrganisationNom, U.Nom AS UserNom, U.Prenom AS UserPrenom
            FROM HistoriqueDemandes H
                     LEFT JOIN Organisation O ON H.NumeroSiren = O.NumeroSiren
                     LEFT JOIN Utilisateur U ON H.UserId = U.Email
            WHERE H.UserId LIKE ? OR H.AdministrateurEmail LIKE ?
            ORDER BY H.DateAction DESC
            LIMIT ? OFFSET ?
        `;
        const [requests] = await pool.query(query, [`%${search}%`, `%${search}%`, limit, offset]);

        const countQuery = `
            SELECT COUNT(*) as totalRequests
            FROM HistoriqueDemandes H
                     LEFT JOIN Organisation O ON H.NumeroSiren = O.NumeroSiren
                     LEFT JOIN Utilisateur U ON H.UserId = U.Email
            WHERE H.UserId LIKE ? OR H.AdministrateurEmail LIKE ?
        `;
        const [[{ totalRequests }]] = await pool.query(countQuery, [`%${search}%`, `%${search}%`]);

        return { requests, totalRequests };
    },

    async deleteByOrganisation(numeroSiren) {
        const query = `DELETE FROM HistoriqueDemandes WHERE NumeroSiren = ?;`;
        await pool.query(query, [numeroSiren]);
    },

    async deleteRequests(userId) {
        const query = `
            DELETE FROM HistoriqueDemandes
            WHERE UserId = ?;
        `;
        const values = [userId];
        const [result] = await pool.query(query, values);
        return result.affectedRows > 0;
    },

};

module.exports = HistoriqueDemandes;
