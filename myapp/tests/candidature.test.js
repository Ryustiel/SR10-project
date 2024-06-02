const db = require('../model/db');
const Candidature = require('../model/candidature');
const AssociationFichiers = require('../model/associationfichiers');
const logger = require('../logger');

jest.mock('../model/db', () => ({
    query: jest.fn(),
    close: jest.fn()
}));

jest.mock('../model/associationfichiers', () => ({
    create: jest.fn(),
    deleteFiles: jest.fn(),
    deleteFilesByOffre: jest.fn(),
    deleteFilesByCandidat: jest.fn()
}));

jest.mock('../logger', () => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
}));

describe("Model Tests - Candidature", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.close();
    });

    test("create candidature successfully", async () => {
        const mockCandidature = { idCandidat: '123', idOffre: 456, dateCandidature: new Date(), files: [] };

        db.query
            .mockResolvedValueOnce({}) // Simulating insert
            .mockResolvedValueOnce([[{ idCandidat: '123', idOffre: 456, dateCandidature: mockCandidature.dateCandidature }], {}]); // Simulating fetch

        const result = await Candidature.create(mockCandidature.idCandidat, mockCandidature.idOffre, mockCandidature.dateCandidature, mockCandidature.files);

        expect(result).toEqual({ idCandidat: '123', idOffre: 456, dateCandidature: mockCandidature.dateCandidature });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("create candidature with files successfully", async () => {
        const mockCandidature = {
            idCandidat: '123',
            idOffre: 456,
            dateCandidature: new Date(),
            files: [{ filename: "resume.pdf", originalname: "resume_original.pdf" }]
        };

        db.query
            .mockResolvedValueOnce({}) // Simulating insert
            .mockResolvedValueOnce([[{ idCandidat: '123', idOffre: 456, dateCandidature: mockCandidature.dateCandidature }], {}]); // Simulating fetch

        AssociationFichiers.create.mockResolvedValueOnce({});

        const result = await Candidature.create(mockCandidature.idCandidat, mockCandidature.idOffre, mockCandidature.dateCandidature, mockCandidature.files);

        expect(result).toEqual({ idCandidat: '123', idOffre: 456, dateCandidature: mockCandidature.dateCandidature });
        expect(db.query).toHaveBeenCalledTimes(2);
        expect(AssociationFichiers.create).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledWith(`Creating file entry for resume.pdf with user 123 and offer 456`);
    });

    test("read candidature successfully", async () => {
        const idCandidat = '123';
        const idOffre = 456;
        const mockCandidature = { idCandidat, idOffre, dateCandidature: new Date() };

        db.query.mockResolvedValueOnce([[mockCandidature], {}]);

        const result = await Candidature.read(idCandidat, idOffre);
        expect(result).toEqual(mockCandidature);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("update candidature successfully", async () => {
        const idCandidat = '123';
        const idOffre = 456;
        const updates = { dateCandidature: new Date() };

        db.query
            .mockResolvedValueOnce([{}, {}]) // Simulating update
            .mockResolvedValueOnce([[{ idCandidat, idOffre, dateCandidature: updates.dateCandidature }], {}]); // Simulating fetch after update

        const result = await Candidature.update(idCandidat, idOffre, updates);
        expect(result).toEqual({ idCandidat, idOffre, dateCandidature: updates.dateCandidature });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("delete candidature successfully", async () => {
        const idCandidat = '123';
        const idOffre = 456;

        db.query.mockResolvedValueOnce([{}, {}]); // Simulating delete
        AssociationFichiers.deleteFiles.mockResolvedValueOnce();

        await Candidature.delete(idCandidat, idOffre);
        expect(db.query).toHaveBeenCalledTimes(1);
        expect(AssociationFichiers.deleteFiles).toHaveBeenCalledTimes(1);
    });

    test("delete stops on error from deleteFiles", async () => {
        const idCandidat = '123';
        const idOffre = 456;

        // Simuler une erreur lors de la suppression des fichiers associés
        const error = new Error("Deletion failed");
        AssociationFichiers.deleteFiles.mockRejectedValueOnce(error);

        // Appeler delete et s'assurer que l'erreur est capturée et propagée
        await expect(Candidature.delete(idCandidat, idOffre)).rejects.toThrow("Deletion failed");

        // Vérifier que la requête de suppression de la candidature n'est pas appelée après l'erreur
        expect(db.query).not.toHaveBeenCalledWith(expect.stringContaining('DELETE FROM Candidature'));
    });

    test("read all candidatures successfully", async () => {
        const mockCandidatures = [{ idCandidat: '123', idOffre: 456, dateCandidature: new Date() }];

        db.query.mockResolvedValueOnce([mockCandidatures, {}]);

        const result = await Candidature.readall();
        expect(result).toEqual(mockCandidatures);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("check if candidate successfully", async () => {
        const idCandidat = '123';
        const idOffre = 456;

        db.query.mockResolvedValueOnce([[{ 'COUNT(*)': 1 }], {}]); // Simulating count

        const result = await Candidature.isCandidate(idCandidat, idOffre);
        expect(result).toBe(true);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("get applications for recruteur successfully", async () => {
        const idRecruteur = '789';
        const mockApplications = [
            {
                IdOffre: 456,
                IdCandidat: '123',
                Nom: 'Doe',
                Prenom: 'John',
                Intitule: 'Software Engineer',
                DateCandidature: new Date()
            }
        ];

        db.query.mockResolvedValueOnce([mockApplications, {}]);

        const result = await Candidature.getApplicationsRecruteur(idRecruteur);
        expect(result).toEqual(mockApplications);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("get applications for candidate successfully", async () => {
        const idCandidat = '123';
        const mockApplications = [
            {
                IdOffre: 456,
                Intitule: 'Software Engineer',
                DateCandidature: new Date()
            }
        ];

        db.query.mockResolvedValueOnce([mockApplications, {}]);

        const result = await Candidature.getApplicationsCandidat(idCandidat);
        expect(result).toEqual(mockApplications);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("deleteByOffre successfully", async () => {
        const idOffre = 456;

        db.query.mockResolvedValueOnce([{}, {}]); // Simulating delete
        AssociationFichiers.deleteFilesByOffre.mockResolvedValueOnce();

        await Candidature.deleteByOffre(idOffre);
        expect(db.query).toHaveBeenCalledTimes(1);
        expect(AssociationFichiers.deleteFilesByOffre).toHaveBeenCalledTimes(1);
    });

    test("deleteByCandidat successfully", async () => {
        const idCandidat = '123';

        db.query.mockResolvedValueOnce([{}, {}]); // Simulating delete
        AssociationFichiers.deleteFilesByCandidat.mockResolvedValueOnce();

        await Candidature.deleteByCandidat(idCandidat);
        expect(db.query).toHaveBeenCalledTimes(1);
        expect(AssociationFichiers.deleteFilesByCandidat).toHaveBeenCalledTimes(1);
    });

    test("getApplicationsForOrganisation successfully", async () => {
        const idOrganisation = '123456789';
        const mockApplications = [
            {
                IdOffre: 456,
                IdCandidat: '123',
                Nom: 'Doe',
                Prenom: 'John',
                Intitule: 'Software Engineer',
                DateCandidature: new Date()
            }
        ];

        db.query.mockResolvedValueOnce([mockApplications, {}]);

        const result = await Candidature.getApplicationsForOrganisation(idOrganisation);
        expect(result).toEqual(mockApplications);
        expect(db.query).toHaveBeenCalledTimes(1);
    });
});
