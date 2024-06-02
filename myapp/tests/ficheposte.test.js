const db = require('../model/db');
const OffreEmploi = require('../model/offreemploi');
const FichePoste = require('../model/ficheposte');
const logger = require('../logger');

jest.mock('../model/db', () => ({
    query: jest.fn(),
    close: jest.fn()
}));

jest.mock('../model/offreemploi');
jest.mock('../logger');

describe('Model Tests - FichePoste', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.close();
    });

    test('create fiche successfully', async () => {
        const mockFiche = {
            intitule: 'Développeur',
            statutPoste: 'Ouvert',
            responsableHierarchique: 'Jean Dupont',
            typeMetier: 'Informatique',
            lieuMission: 'Paris',
            rythme: 'Temps plein',
            salaire: 45000,
            description: 'Développeur full-stack',
            idOrganisation: '123456789'
        };

        db.query.mockResolvedValueOnce(); // Simulating insert
        db.query.mockResolvedValueOnce([[{ id: 1, ...mockFiche }], {}]); // Simulating fetch

        const result = await FichePoste.create(mockFiche);

        expect(result).toEqual({ id: 1, ...mockFiche });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test('read fiche successfully', async () => {
        const id = 1;
        const mockFiche = { id, intitule: 'Développeur' };

        db.query.mockResolvedValueOnce([[mockFiche], {}]);

        const result = await FichePoste.read(id);

        expect(result).toEqual(mockFiche);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('update fiche successfully', async () => {
        const id = 1;
        const updates = {
            intitule: 'Développeur Senior',
            statutPoste: 'Ouvert',
            responsableHierarchique: 'Jean Dupont',
            typeMetier: 'Informatique',
            lieuMission: 'Paris',
            rythme: 'Temps plein',
            salaire: 55000,
            description: 'Développeur full-stack senior',
            idOrganisation: '123456789'
        };

        db.query.mockResolvedValueOnce([{}, {}]); // Simulating update
        db.query.mockResolvedValueOnce([[{ id, ...updates }], {}]); // Simulating fetch after update

        const result = await FichePoste.update(id, updates);

        expect(result).toEqual({ id, ...updates });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test('list all fiches successfully', async () => {
        const mockFiches = [{ idFiche: 1, intitule: 'Développeur' }];

        db.query.mockResolvedValueOnce([mockFiches, {}]);

        const result = await FichePoste.list();

        expect(result).toEqual(mockFiches);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('delete fiche successfully', async () => {
        const id = 1;

        db.query.mockResolvedValueOnce([{}, {}]); // Simulating delete

        await FichePoste.delete(id);

        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('read all fiches successfully', async () => {
        const mockFiches = [{ idFiche: 1, intitule: 'Développeur' }];

        db.query.mockResolvedValueOnce([mockFiches, {}]);

        const result = await FichePoste.readall();

        expect(result).toEqual(mockFiches);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('list fiches for organisation successfully', async () => {
        const idOrganisation = '123456789';
        const mockFiches = [{ idFiche: 1, intitule: 'Développeur', organisationNom: 'Tech Solutions' }];

        db.query.mockResolvedValueOnce([mockFiches, {}]);

        const result = await FichePoste.listFiches(idOrganisation);

        expect(result).toEqual(mockFiches);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idOrganisation]);
    });

    test('check if user is legitimate successfully', async () => {
        const idFiche = 1;
        const idOrganisationRecruteur = '123456789';
        const mockCount = { 'COUNT(*)': 1 };

        db.query.mockResolvedValueOnce([[mockCount], {}]);

        const result = await FichePoste.isUserLegitimate(idFiche, idOrganisationRecruteur);

        expect(result).toBe(true);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idFiche, idOrganisationRecruteur]);
    });

    test('check if fiche has dependents successfully', async () => {
        const idFiche = 1;

        OffreEmploi.countByFiche.mockResolvedValueOnce(2);

        const result = await FichePoste.hasDependents(idFiche);

        expect(result).toBe(true);
        expect(OffreEmploi.countByFiche).toHaveBeenCalledWith(idFiche);
    });

    test('delete fiche with dependents successfully', async () => {
        const idFiche = 1;

        db.query.mockResolvedValue([{}, {}]); // Simulating delete

        await FichePoste.deleteWithDependents(idFiche);

        expect(db.query).toHaveBeenCalledTimes(3);
        expect(db.query).toHaveBeenNthCalledWith(1, 'START TRANSACTION');
        expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [idFiche]);
        expect(db.query).toHaveBeenNthCalledWith(3, 'COMMIT');
    });

    test('delete fiche with dependents and rollback on error', async () => {
        const idFiche = 1;
        const errorMessage = 'Error during deletion';

        db.query.mockResolvedValueOnce([{}, {}]); // Simulating START TRANSACTION
        db.query.mockRejectedValueOnce(new Error(errorMessage)); // Simulating delete error

        await expect(FichePoste.deleteWithDependents(idFiche)).rejects.toThrow(errorMessage);

        expect(db.query).toHaveBeenCalledTimes(3);
        expect(db.query).toHaveBeenNthCalledWith(1, 'START TRANSACTION');
        expect(db.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
        expect(logger.error).toHaveBeenCalledWith(`Erreur lors de la suppression de la fiche ${idFiche}: ${errorMessage}`);
    });

    test('list fiches for organization with pagination and search successfully', async () => {
        const idOrganisation = '123456789';
        const search = 'Developpeur';
        const limit = 10;
        const offset = 0;
        const mockFiches = [{ idFiche: 1, intitule: 'Développeur' }];

        db.query.mockResolvedValueOnce([mockFiches, {}]);

        const result = await FichePoste.listFichesWithPaginationAndSearch(idOrganisation, search, limit, offset);

        expect(result).toEqual(mockFiches);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idOrganisation, `%${search}%`, limit, offset]);
    });

    test('count fiches with search successfully', async () => {
        const idOrganisation = '123456789';
        const search = 'Developpeur';
        const mockCount = { count: 5 };

        db.query.mockResolvedValueOnce([[mockCount], {}]);

        const result = await FichePoste.countFichesWithSearch(idOrganisation, search);

        expect(result).toBe(mockCount.count);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idOrganisation, `%${search}%`]);
    });

    test('list fiches for organization successfully', async () => {
        const idOrganisation = '123456789';
        const mockFiches = [{ IdFiche: 1, Intitule: 'Développeur' }, { IdFiche: 2, Intitule: 'Manager' }];

        db.query.mockResolvedValueOnce([mockFiches, {}]);

        const result = await FichePoste.listFichesForOrganization(idOrganisation);

        expect(result).toEqual(mockFiches);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idOrganisation]);
    });

});
