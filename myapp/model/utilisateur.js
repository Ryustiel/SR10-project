const pool = require('./db');
const bcrypt = require('bcryptjs');

const Utilisateur = {
    async create({ email, motDePasse, nom, prenom, telephone, dateCreation, statutCompte, typeCompte, idOrganisation }) {
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
        const query = `SELECT * FROM Utilisateur WHERE Email = ?;`;
        const [results] = await pool.query(query, [email]);
        return results[0];
    },

    async update(email, updates) {
        const fields = Object.keys(updates).map(field =>`${field} = ?`).join(', ');
        const values = [...Object.values(updates), email];
        const query = `UPDATE Utilisateur SET ${fields} WHERE Email = ?;`;
        await pool.query(query, values);
        return this.read(email);
    },

    async delete(email) {
        const query = `DELETE FROM Utilisateur WHERE Email = ?;`;
        await pool.query(query, [email]);
    },

    async readall() {
        const query = `SELECT * FROM Utilisateur;`;
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
        const query = `SELECT TypeCompte FROM Utilisateur WHERE Email = ?;`;
        const [results] = await pool.query(query, [email]);
        if (results.length > 0) {
            return results[0].TypeCompte;
        } else {
            return null;
        }
    },

    async getNom(email) {
        const query = `SELECT Nom, Prenom FROM Utilisateur WHERE Email = ?;`;
        const [results] = await pool.query(query, [email]);
        if (results.length > 0) {
            return results[0].Nom + ' ' + results[0].Prenom;
        } else {
            return null;
        }
    },

    async getOrganisationId(email) {
        const query = `SELECT IdOrganisation FROM Utilisateur WHERE Email = ?;`;
        const [results] = await pool.query(query, [email]);
        if (results.length > 0) {
            return results[0].IdOrganisation;
        } else {
            return null;
        }
    },

    async updateTypeCompte(email, newTypeCompte) {
        const query = `UPDATE Utilisateur SET TypeCompte = ? WHERE Email = ?;`;
        const values = [newTypeCompte, email];
        const [result] = await pool.query(query, values);
        return result.affectedRows > 0; // Retourne true si une ligne a été mise à jour
    },

    async updateTypeCompteWithOrganisation(email, newTypeCompte, idOrganisation) {
        const query = `UPDATE Utilisateur SET TypeCompte = ?, IdOrganisation = ? WHERE Email = ?;`;
        const values = [newTypeCompte, idOrganisation, email];
        const [result] = await pool.query(query, values);
        return result.affectedRows > 0; // Retourne true si une ligne a été mise à jour
    },

    async getRecruiterRequests() {
        const query = `
        SELECT 
            u.Nom, u.Prenom, u.Email, u.IdOrganisation, 
            o.Nom AS OrganisationNom, o.Type AS OrganisationType, 
            o.AdresseAdministrative, o.StatutOrganisation 
        FROM 
            Utilisateur u 
        LEFT JOIN 
            Organisation o 
        ON 
            u.IdOrganisation = o.NumeroSiren 
        WHERE 
            u.TypeCompte = 'recruteur en attente';
    `;
        const [results] = await pool.query(query);
        return results;
    },
};

module.exports = Utilisateur;