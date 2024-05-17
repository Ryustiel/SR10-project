const pool = require('./db');

const Candidature = {
    async create({ idCandidat, idOffre, dateCandidature }) {
        const query = `
      INSERT INTO Candidature 
      (IdCandidat, IdOffre, DateCandidature) 
      VALUES (?, ?, ?);
    `;
        const values = [idCandidat, idOffre, dateCandidature];
        await pool.query(query, values);
        return this.read(values[0]); // Assuming the ID or Unique Identifier is returned here
    },

    async read(id) {
        const query = `SELECT * FROM Candidature WHERE IdCandidature = ?;`;
        const [results] = await pool.query(query, [id]);
        return results[0];
    },

    async update(id, { idCandidat, idOffre, dateCandidature }) {
        const query = `
      UPDATE Candidature 
      SET IdCandidat = ?, IdOffre = ?, DateCandidature = ?
      WHERE IdCandidature = ?;
    `;
        const values = [idCandidat, idOffre, dateCandidature, id];
        await pool.query(query, values);
        return this.read(id);
    },

    async delete(id) {
        const query = `DELETE FROM Candidature WHERE IdCandidature = ?;`;
        await pool.query(query, [id]);
    },

    async readall() {
        const query = `SELECT * FROM Candidature;`;
        const [results] = await pool.query(query);
        return results;
    },

    async isCandidate(idCandidat, idOffre) {
        const query = `SELECT COUNT(*) FROM Candidature WHERE IdCandidat = ? AND IdOffre = ?`;
        const [results] = await pool.query(query, [idCandidat, idOffre]);
        return results[0]['COUNT(*)'] > 0;
    },

    async listApplications(idRecruteur) {
        const query = `
            SELECT IdCandidature, IdCandidat, IdOffre, DateCandidature FROM Candidature AS C
            JOIN OffreEmploi AS O
            ON C.IdOffre = O.IdOffre
            WHERE O.IdRecruteur = ?;
        `;
        const [results] = await pool.query(query, [idRecruteur]);
        return results;
    }
};

module.exports = Candidature;