const pool = require('./db');

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

    async update(email, { motDePasse, nom, prenom, telephone, dateCreation, statutCompte, typeCompte, idOrganisation }) {
        const query = `
      UPDATE Utilisateur 
      SET MotDePasse = ?, Nom = ?, Prenom = ?, Telephone = ?, DateCreation = ?, StatutCompte = ?, TypeCompte = ?, IdOrganisation = ?
      WHERE Email = ?;
    `;
        const values = [motDePasse, nom, prenom, telephone, dateCreation, statutCompte, typeCompte, idOrganisation, email];
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
    }
};

module.exports = Utilisateur;