const pool = require('./db');

const AssociationFichiers = {

    async create({ idCandidat, idOffre, fichier }) {

        const query = `

      INSERT INTO AssociationFichiers (IdCandidat, IdOffre, Fichier)

      VALUES (?, ?, ?);

    `;

        const values = [idCandidat, idOffre, fichier];

        await pool.query(query, values);

        return this.read(idCandidat, idOffre, fichier);

    },



    async read(idAssociation) {

        const query = `SELECT * FROM AssociationFichiers WHERE IdAssociation = ?;`;

        const [results] = await pool.query(query, [idAssociation]);

        return results[0];

    },



    async update(idAssociation, { idCandidat, idOffre, fichier }) {

        const query = `

      UPDATE AssociationFichiers

      SET IdCandidat = ?, IdOffre = ?, Fichier = ?

      WHERE IdAssociation = ?;

    `;

        const values = [idCandidat, idOffre, fichier, idAssociation];

        await pool.query(query, values);

        return this.read(idAssociation);

    },



    async delete(idAssociation) {

        const query = `DELETE FROM AssociationFichiers WHERE IdAssociation = ?;`;

        await pool.query(query, [idAssociation]);

    },



    async readall() {

        const query = `SELECT * FROM AssociationFichiers;`;

        const [results] = await pool.query(query);

        return results;

    }

};


module.exports = AssociationFichiers;