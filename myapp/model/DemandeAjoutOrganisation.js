const pool = require('./db');

const DemandeAjoutOrganisation = {
    async create({ idDemandeur, idOrganisation }) {
        const query = `
      INSERT INTO DemandeAjoutOrganisation 
      (IdDemandeur, IdOrganisation) 
      VALUES (?, ?);
    `;
        const values = [idDemandeur, idOrganisation];
        await pool.query(query, values);
        return this.read(idDemandeur);
    },

    async read(id) {
        const query = `SELECT * FROM DemandeAjoutOrganisation WHERE IdDemandeAjout = ?;`;
        const [results] = await pool.query(query, [id]);
        return results[0];
    },

    async update(id, { idDemandeur, idOrganisation }) {
        const query = `
      UPDATE DemandeAjoutOrganisation 
      SET IdDemandeur = ?, IdOrganisation = ?
      WHERE IdDemandeAjout = ?;
    `;
        const values = [idDemandeur, idOrganisation, id];
        await pool.query(query, values);
        return this.read(id);
    },

    async delete(id) {
        const query = `DELETE FROM DemandeAjoutOrganisation WHERE IdDemandeAjout = ?;`;
        await pool.query(query, [id]);
    },

    async readall() {
        const query = `SELECT * FROM DemandeAjoutOrganisation;`;
        const [results] = await pool.query(query);
        return results;
    }
};

module.exports = DemandeAjoutOrganisation;