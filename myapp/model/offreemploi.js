const pool = require('./db');

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

    async update(id, { etat, dateValidite, listePieces, nombrePieces, idFiche, idRecruteur }) {
        const query = `
      UPDATE OffreEmploi 
      SET Etat = ?, DateValidite = ?, ListePieces = ?, NombrePieces = ?, IdFiche = ?, IdRecruteur = ?
      WHERE IdOffre = ?;
    `;
        const values = [etat, dateValidite, listePieces, nombrePieces, idFiche, idRecruteur, id];
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
    }
};

module.exports = OffreEmploi;