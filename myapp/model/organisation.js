const pool = require('./db');

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
        await pool.query(query, [numeroSiren]);
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
    }
};

module.exports = Organisation;