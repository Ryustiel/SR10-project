const db = require('../model/db');
const AssociationFichiers = require('../model/associationfichiers');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

jest.mock('../model/db', () => ({
    query: jest.fn(),
    close: jest.fn()
}));

jest.mock('fs', () => ({
    unlink: jest.fn((filePath, callback) => callback(null)),
    writeFileSync: jest.fn()
}));

jest.mock('../logger', () => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
}));

describe("Model Tests - AssociationFichiers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.close();
    });

    test("create association fichiers successfully", async () => {
        const mockAssociation = { idCandidat: '123', idOffre: 456, fichier: "resume.pdf", originalName: "resume_original.pdf" };

        db.query.mockResolvedValueOnce(); // Simulating insert
        db.query.mockResolvedValueOnce([[{ ...mockAssociation }], {}]); // Simulating fetch

        const result = await AssociationFichiers.create(mockAssociation.idCandidat, mockAssociation.idOffre, mockAssociation.fichier, mockAssociation.originalName);
        expect(result).toEqual(mockAssociation);
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("read association fichiers successfully", async () => {
        const mockAssociation = { idCandidat: '123', idOffre: 456, fichier: "resume.pdf", originalName: "resume_original.pdf" };

        db.query.mockResolvedValueOnce([[mockAssociation], {}]);

        const result = await AssociationFichiers.read(mockAssociation.idCandidat, mockAssociation.idOffre, mockAssociation.fichier);
        expect(result).toEqual(mockAssociation);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("update association fichiers successfully", async () => {
        const idCandidat = '123';
        const idOffre = 456;
        const updates = { fichier: "cover_letter.pdf", originalName: "cover_letter_original.pdf" };

        db.query.mockResolvedValueOnce([{}, {}]); // Simulating update
        db.query.mockResolvedValueOnce([[{ idCandidat, idOffre, ...updates }], {}]); // Simulating fetch after update

        const result = await AssociationFichiers.update({ idCandidat, idOffre, ...updates });
        expect(result).toEqual({ idCandidat, idOffre, ...updates });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("delete association fichiers successfully", async () => {
        const mockAssociation = { idCandidat: '123', idOffre: 456, fichier: "resume.pdf" };

        db.query.mockResolvedValueOnce([{}, {}]); // Simulating delete

        await AssociationFichiers.delete(mockAssociation);
        expect(db.query).toHaveBeenCalledTimes(1);
        expect(fs.unlink).toHaveBeenCalledWith(path.join(__dirname, '..', 'uploads', mockAssociation.fichier), expect.any(Function));
    });

    test("read all association fichiers successfully", async () => {
        const mockAssociations = [{ idCandidat: '123', idOffre: 456, fichier: "resume.pdf", originalName: "resume_original.pdf" }];

        db.query.mockResolvedValueOnce([mockAssociations, {}]);

        const result = await AssociationFichiers.readall();
        expect(result).toEqual(mockAssociations);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("list files successfully", async () => {
        const idCandidat = '123';
        const idOffre = 456;
        const mockFiles = [{ fichier: "resume.pdf", originalName: "resume_original.pdf" }];

        db.query.mockResolvedValueOnce([mockFiles, {}]);

        const result = await AssociationFichiers.listFiles(idCandidat, idOffre);
        expect(result).toEqual(mockFiles);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("delete files by candidate and offer successfully", async () => {
        const idCandidat = '123';
        const idOffre = 456;
        const mockFiles = [{ Fichier: "resume.pdf", NomOriginal: "resume_original.pdf" }]; // Assurez-vous que les noms de propriétés correspondent

        // Simulate database response for inserting records
        db.query
            .mockResolvedValueOnce({}) // Simulating insert
            .mockResolvedValueOnce([[{ idCandidat, idOffre, fichier: "resume.pdf", originalName: "resume_original.pdf" }], {}]) // Simulating fetch after insert
            .mockResolvedValueOnce([mockFiles, {}]) // Simulate listing files
            .mockResolvedValueOnce({}); // Simulating delete

        // Simulate file creation
        mockFiles.forEach(file => {
            const filePath = path.join(__dirname, '..', 'uploads', file.Fichier); // Assurez-vous que la propriété est 'Fichier'
            fs.writeFileSync(filePath, 'dummy content');
        });

        await AssociationFichiers.create(idCandidat, idOffre, mockFiles[0].Fichier, mockFiles[0].NomOriginal);
        await AssociationFichiers.deleteFiles(idCandidat, idOffre);

        expect(db.query).toHaveBeenCalledTimes(4); // Insert, fetch after insert, list, delete
        mockFiles.forEach(file => {
            expect(fs.unlink).toHaveBeenCalledWith(path.join(__dirname, '..', 'uploads', file.Fichier), expect.any(Function));
        });
    });

    test("delete files by offer successfully", async () => {
        const idOffre = 456;

        db.query.mockResolvedValueOnce([{}, {}]); // Simulating delete

        await AssociationFichiers.deleteFilesByOffre(idOffre);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("delete files by candidate successfully", async () => {
        const idCandidat = '123';

        db.query.mockResolvedValueOnce([{}, {}]); // Simulating delete

        await AssociationFichiers.deleteFilesByCandidat(idCandidat);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("read fichier successfully", async () => {
        const fichier = "resume.pdf";
        const mockFichier = { idCandidat: '123', idOffre: 456, originalName: "resume_original.pdf" };

        db.query.mockResolvedValueOnce([[mockFichier], {}]);

        const result = await AssociationFichiers.readFichier(fichier);
        expect(result).toEqual(mockFichier);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("readFichier returns null when no file is found", async () => {
        const fichier = "nonexistent.pdf";

        // Simulate database response with no results
        db.query.mockResolvedValueOnce([[], {}]);

        const result = await AssociationFichiers.readFichier(fichier);
        expect(result).toBeNull();
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("delete logs error when file deletion fails", async () => {
        const idCandidat = '123';
        const idOffre = 456;
        const fichier = "resume.pdf";

        // Simulate database response for deleting record
        db.query.mockResolvedValueOnce([{}, {}]);

        // Simulate file deletion failure
        const error = new Error("Deletion failed");
        fs.unlink.mockImplementationOnce((filePath, callback) => callback(error));

        await AssociationFichiers.delete({ idCandidat, idOffre, fichier });

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(fs.unlink).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(`Failed to delete file: ${path.join(__dirname, '..', 'uploads', fichier)}. Error: ${error.message}`);
    });

    test("deleteFiles logs error when file deletion fails", async () => {
        const idCandidat = '123';
        const idOffre = 456;
        const mockFiles = [{ Fichier: "resume.pdf", NomOriginal: "resume_original.pdf" }];

        // Simulate database response for listing files
        db.query.mockResolvedValueOnce([mockFiles, {}]);

        // Simulate database response for deleting records
        db.query.mockResolvedValueOnce([{}, {}]);

        // Simulate file deletion failure
        const error = new Error("Deletion failed");
        fs.unlink.mockImplementationOnce((filePath, callback) => callback(error));

        await AssociationFichiers.deleteFiles(idCandidat, idOffre);

        expect(db.query).toHaveBeenCalledTimes(2); // list, delete
        expect(fs.unlink).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(`Failed to delete file: ${path.join(__dirname, '..', 'uploads', mockFiles[0].Fichier)}. Error: ${error.message}`);
    });

});
