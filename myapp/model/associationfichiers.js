const pool = require('./db');
const logger = require('../logger');
const path = require('path');
const fs = require('fs');

const AssociationFichiers = {

    async create(idCandidat, idOffre, fichier) {
        const query = `
            INSERT INTO AssociationFichiers (IdCandidat, IdOffre, Fichier)
            VALUES (?, ?, ?);
        `;

        const values = [idCandidat, idOffre, fichier];
        await pool.query(query, values);
        return this.read(idCandidat, idOffre, fichier);
    },


    async read(idCandidat, idOffre, fichier) {

        const query = `SELECT * FROM AssociationFichiers WHERE IdCandidat = ? AND IdOffre = ? AND Fichier = ?;`;
        const results = await pool.query(query, [idCandidat, idOffre, fichier]);
        return results[0];
    },


    async update({ idCandidat, idOffre, fichier }) {

        const query = `

        UPDATE AssociationFichiers

        SET Fichier = ?
      
        WHERE IdCandidat = ? AND IdOffre = ?`;

        const values = [fichier, idCandidat, idOffre];

        await pool.query(query, values);

        return this.read({ idCandidat, idOffre });

    },


    async delete({ idCandidat, idOffre, fichier }) {

            const query = `DELETE FROM AssociationFichiers WHERE IdCandidat = ? AND IdOffre = ? AND Fichier = ?;`;
            await pool.query(query, [idCandidat, idOffre, fichier]);
    },


    async listFiles(idCandidat, idOffre) {
        const query = `SELECT Fichier FROM AssociationFichiers WHERE IdCandidat = ? AND IdOffre = ?;`;
        const [results] = await pool.query(query, [idCandidat, idOffre]);
        return results;

    },


    async deleteFiles(idCandidat, idOffre) {

        const files = await this.listFiles(idCandidat, idOffre);
        logger.warn(JSON.stringify(files));

        // DELETE FILES ON DISK
        for (const file of files) {
            const filePath = path.join(__dirname, '..', 'uploads', file.Fichier);
            fs.unlink(filePath, (err) => {
                if (err) {
                    logger.error(`Failed to delete file: ${filePath}`, err);
                } else {
                    logger.info(`Deleted file: ${filePath}`);
                }
            });
        }

        // DELETE DB FILE LINKS
        const query = `DELETE FROM AssociationFichiers WHERE IdCandidat = ? AND IdOffre = ?;`;
        await pool.query(query, [idCandidat, idOffre]);
    },


    async readFichier(fichier) {
        // Possible grâce à la contrainte UNIQUE sur Fichier
        const query = `SELECT IdCandidat, IdOffre FROM AssociationFichiers WHERE Fichier = ?;`;
        const results = await pool.query(query, [fichier]);
        if (results.length === 0) {
            return null;
        }
        return results[0][0];
    },


    async readall() {

        const query = `SELECT * FROM AssociationFichiers;`;
        const [results] = await pool.query(query);
        return results;
    }

};


module.exports = AssociationFichiers;