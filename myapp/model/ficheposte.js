const pool = require('./db');

const FichePoste = {
    async create({ intitule, statutPoste, responsableHierarchique, typeMetier, lieuMission, rythme, salaire, description, idOrganisation }) {
        const query = `
      INSERT INTO FichePoste 
      (Intitule, StatutPoste, ResponsableHierarchique, TypeMetier, LieuMission, Rythme, Salaire, Description, IdOrganisation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
        const values = [intitule, statutPoste, responsableHierarchique, typeMetier, lieuMission, rythme, salaire, description, idOrganisation];
        await pool.query(query, values);
        return this.read(values[0]); // assuming the ID or Unique Identifier is returned here
    },

    async read(id) {
        const query = `SELECT * FROM FichePoste WHERE IdFiche = ?;`;
        const [results] = await pool.query(query, [id]);
        return results[0];
    },

    async update(id, { intitule, statutPoste, responsableHierarchique, typeMetier, lieuMission, rythme, salaire, description, idOrganisation }) {
        const query = `
      UPDATE FichePoste 
      SET Intitule = ?, StatutPoste = ?, ResponsableHierarchique = ?, TypeMetier = ?, LieuMission = ?, Rythme = ?, Salaire = ?, Description = ?, IdOrganisation = ?
      WHERE IdFiche = ?;
    `;
        const values = [intitule, statutPoste, responsableHierarchique, typeMetier, lieuMission, rythme, salaire, description, idOrganisation, id];
        await pool.query(query, values);
        return this.read(id);
    },

    async delete(id) {
        const query = `DELETE FROM FichePoste WHERE IdFiche = ?;`;
        await pool.query(query, [id]);
    },

    async readall() {
        const query = `SELECT * FROM FichePoste;`;
        const [results] = await pool.query(query);
        return results;
    }
};

module.exports = FichePoste;