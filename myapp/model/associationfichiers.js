const pool = require('./db');

const AssociationFichiers = {
    async create({ idCandidature, fichier }) {
        const query = `
      INSERT INTO AssociationFichiers 
      (IdCandidature, Fichier) 
      VALUES (?, ?);
    `;
        const values = [idCandidature, fichier];
        await pool.query(query, values);
        return this.read(idCandidature);
    },

    async read(id) {
        const query = `SELECT * FROM AssociationFichiers WHERE IdAssociation = ?;`;
        const [results] = await pool.query(query, [id]);
        return results[0];
    },

    async update(id, { idCandidature, fichier }) {
        const query = `
      UPDATE AssociationFichiers 
      SET IdCandidature = ?, Fichier = ?
      WHERE IdAssociation = ?;
    `;
        const values = [idCandidature, fichier, id];
        await pool.query(query, values);
        return this.read(id);
    },

    async delete(id) {
        const query = `DELETE FROM AssociationFichiers WHERE IdAssociation = ?;`;
        await pool.query(query, [id]);
    },

    async readall() {
        const query = `SELECT * FROM AssociationFichiers;`;
        const [results] = await pool.query(query);
        return results;
    }
};

module.exports = AssociationFichiers;