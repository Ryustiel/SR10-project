const pool = require('./db');
const logger = require('../logger');
const path = require('path');
const fs = require('fs');

const AssociationFichiers = {
    async create(idCandidat, idOffre, fichier, originalName) {
        const query = `
            INSERT INTO AssociationFichiers (IdCandidat, IdOffre, Fichier, NomOriginal)
            VALUES (?, ?, ?, ?);
        `;

        const values = [idCandidat, idOffre, fichier, originalName];
        await pool.query(query, values);
        return this.read(idCandidat, idOffre, fichier);
    },

    async read(idCandidat, idOffre, fichier) {
        const query = `SELECT *
                       FROM AssociationFichiers
                       WHERE IdCandidat = ?
                         AND IdOffre = ?
                         AND Fichier = ?;`;
        const [results] = await pool.query(query, [idCandidat, idOffre, fichier]);
        return results[0];
    },

    async update({ idCandidat, idOffre, fichier, originalName }) {
        const query = `
            UPDATE AssociationFichiers
            SET Fichier = ?, NomOriginal = ?
            WHERE IdCandidat = ? AND IdOffre = ?;
        `;
        const values = [fichier, originalName, idCandidat, idOffre];
        await pool.query(query, values);
        return this.read(idCandidat, idOffre, fichier);
    },

    async delete({ idCandidat, idOffre, fichier }) {
        const query = `DELETE
                       FROM AssociationFichiers
                       WHERE IdCandidat = ?
                         AND IdOffre = ?
                         AND Fichier = ?;`;
        await pool.query(query, [idCandidat, idOffre, fichier]);

        // Delete the file from the disk
        const filePath = path.join(__dirname, '..', 'uploads', fichier);
        fs.unlink(filePath, (err) => {
            if (err) {
                logger.error(`Failed to delete file: ${filePath}. Error: ${err.message}`);
            } else {
                logger.info(`Deleted file: ${filePath}`);
            }
        });
    },

    async listFiles(idCandidat, idOffre) {
        const query = `SELECT Fichier, NomOriginal
                       FROM AssociationFichiers
                       WHERE IdCandidat = ?
                         AND IdOffre = ?;`;
        const [results] = await pool.query(query, [idCandidat, idOffre]);
        return results;
    },

    async deleteFiles(idCandidat, idOffre) {
        const files = await this.listFiles(idCandidat, idOffre);
        logger.warn(`Files to be deleted: ${JSON.stringify(files)}`);

        // DELETE FILES ON DISK
        for (const file of files) {
            const filePath = path.join(__dirname, '..', 'uploads', file.Fichier);
            fs.unlink(filePath, (err) => {
                if (err) {
                    logger.error(`Failed to delete file: ${filePath}. Error: ${err.message}`);
                } else {
                    logger.info(`Deleted file: ${filePath}`);
                }
            });
        }

        // DELETE DB FILE LINKS
        const query = `DELETE FROM AssociationFichiers WHERE IdCandidat = ? AND IdOffre = ?;`;
        await pool.query(query, [idCandidat, idOffre]);
    },

    async deleteFilesByOffre(idOffre) {
        const query = `DELETE FROM AssociationFichiers WHERE IdOffre = ?`;
        await pool.query(query, [idOffre]);
    },

    async readFichier(fichier) {
        // Possible grâce à la contrainte UNIQUE sur Fichier
        const query = `SELECT IdCandidat, IdOffre, NomOriginal FROM AssociationFichiers WHERE Fichier = ?;`;
        const [results] = await pool.query(query, [fichier]);
        if (results.length === 0) {
            return null;
        }
        return results[0];
    },

    async readall() {
        const query = `SELECT *
                       FROM AssociationFichiers;`;
        const [results] = await pool.query(query);
        return results;
    }
};

module.exports = AssociationFichiers;
