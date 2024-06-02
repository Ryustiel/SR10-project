const db = require('../model/db');
const Utilisateur = require('../model/utilisateur');
const FichePoste = require('../model/ficheposte');
const OffreEmploi = require('../model/offreemploi');
const Organisation = require('../model/organisation');

jest.mock('../model/db', () => ({
    query: jest.fn(),
    close: jest.fn()
}));

jest.mock('../model/utilisateur');
jest.mock('../model/ficheposte');
jest.mock('../model/offreemploi');

describe('Model Tests - Organisation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.close();
    });

    test('create organisation successfully', async () => {
        const mockOrganisation = {
            numeroSiren: '123456789',
            nom: 'Tech Corp',
            type: 'Entreprise',
            adresseAdministrative: '123 rue de Paris',
            statutOrganisation: 'en attente'
        };

        db.query.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce([[mockOrganisation], {}]);

        const result = await Organisation.create(mockOrganisation);

        expect(result).toEqual(mockOrganisation);
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test('read organisation successfully', async () => {
        const numeroSiren = '123456789';
        const mockOrganisation = { numeroSiren, nom: 'Tech Corp' };

        db.query.mockResolvedValueOnce([[mockOrganisation], {}]);

        const result = await Organisation.read(numeroSiren);

        expect(result).toEqual(mockOrganisation);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('update organisation successfully', async () => {
        const numeroSiren = '123456789';
        const updates = {
            nom: 'Tech Corp Updated',
            type: 'Entreprise',
            adresseAdministrative: '123 rue de Paris',
            statutOrganisation: 'approuvée'
        };
        const updatedOrganisation = {
            numeroSiren,
            ...updates
        };

        db.query.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce([[updatedOrganisation], {}]);

        const result = await Organisation.update(numeroSiren, updates);

        expect(result).toEqual(updatedOrganisation);
        expect(db.query).toHaveBeenCalledTimes(2);

        const expectedUpdateQuery = `
            UPDATE Organisation
            SET Nom = ?, Type = ?, AdresseAdministrative = ?, StatutOrganisation = ?
            WHERE NumeroSiren = ?;
        `.replace(/\s+/g, ' ').trim();

        const receivedUpdateQuery = db.query.mock.calls[0][0].replace(/\s+/g, ' ').trim();
        expect(receivedUpdateQuery).toBe(expectedUpdateQuery);
        expect(db.query).toHaveBeenNthCalledWith(1,
            expect.any(String),
            expect.arrayContaining(['Tech Corp Updated', 'Entreprise', '123 rue de Paris', 'approuvée', numeroSiren])
        );

        const expectedSelectQuery = `
            SELECT *
            FROM Organisation
            WHERE NumeroSiren = ?;
        `.replace(/\s+/g, ' ').trim();

        const receivedSelectQuery = db.query.mock.calls[1][0].replace(/\s+/g, ' ').trim();
        expect(receivedSelectQuery).toBe(expectedSelectQuery);
        expect(db.query).toHaveBeenNthCalledWith(2,
            expect.any(String),
            expect.arrayContaining([numeroSiren])
        );
    });

    test('delete organisation successfully', async () => {
        const numeroSiren = '123456789';

        db.query.mockResolvedValueOnce([{affectedRows: 1}]);

        const result = await Organisation.delete(numeroSiren);

        expect(result).toBe(true);
        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM Organisation WHERE NumeroSiren = ?;'), [numeroSiren]);
    });

    test('delete organisation returns false for non-existent organisation', async () => {
        const numeroSiren = 'nonexistent';

        db.query.mockResolvedValueOnce([{affectedRows: 0}]);

        const result = await Organisation.delete(numeroSiren);

        expect(result).toBe(false);
        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM Organisation WHERE NumeroSiren = ?;'), [numeroSiren]);
    });


    test('read all organisations successfully', async () => {
        const mockOrganisations = [{ numeroSiren: '123456789', nom: 'Tech Corp' }];

        db.query.mockResolvedValueOnce([mockOrganisations, {}]);

        const result = await Organisation.readall();

        expect(result).toEqual(mockOrganisations);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('areValid returns true for existing organisation', async () => {
        const numeroSiren = '123456789';
        const mockOrganisation = { numeroSiren, nom: 'Tech Corp' };

        db.query.mockResolvedValueOnce([[mockOrganisation], {}]);

        const result = await Organisation.areValid(numeroSiren);

        expect(result).toBe(true);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('areValid returns false for non-existent organisation', async () => {
        const numeroSiren = 'nonexistent';

        db.query.mockResolvedValueOnce([[], {}]);

        const result = await Organisation.areValid(numeroSiren);

        expect(result).toBe(false);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('updateStatus updates status of organisation', async () => {
        const numeroSiren = '123456789';
        const statutOrganisation = 'approuvée';

        db.query.mockResolvedValueOnce([{affectedRows: 1}]);

        const result = await Organisation.updateStatus(numeroSiren, statutOrganisation);

        expect(result).toBe(true);
        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE Organisation SET StatutOrganisation = ? WHERE NumeroSiren = ?;'), [statutOrganisation, numeroSiren]);
    });

    test('updateStatus returns false for non-existent organisation', async () => {
        const numeroSiren = 'nonexistent';
        const statutOrganisation = 'approuvée';

        db.query.mockResolvedValueOnce([{affectedRows: 0}]);

        const result = await Organisation.updateStatus(numeroSiren, statutOrganisation);

        expect(result).toBe(false);
        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE Organisation SET StatutOrganisation = ? WHERE NumeroSiren = ?;'), [statutOrganisation, numeroSiren]);
    });

    test('readApproved returns all approved organisations', async () => {
        const mockOrganisations = [{ numeroSiren: '123456789', nom: 'Tech Corp', statutOrganisation: 'approuvée' }];

        db.query.mockResolvedValueOnce([mockOrganisations, {}]);

        const result = await Organisation.readApproved();

        expect(result).toEqual(mockOrganisations);
        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM Organisation WHERE StatutOrganisation = "approuvée"'));
    });

    test('readAllWithPagination returns paginated organisations and total count', async () => {
        const search = 'Tech';
        const limit = 10;
        const offset = 0;
        const mockOrganisations = [{ numeroSiren: '123456789', nom: 'Tech Corp' }];
        const mockTotal = { totalOrganisations: 1 };

        db.query.mockResolvedValueOnce([mockOrganisations, {}]);
        db.query.mockResolvedValueOnce([[mockTotal], {}]);

        const result = await Organisation.readAllWithPagination(search, limit, offset);

        expect(result).toEqual({ organisations: mockOrganisations, totalOrganisations: mockTotal.totalOrganisations });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test('archiveOrganisationAndAssociations archives organisation and associated data', async () => {
        const numeroSiren = '123456789';
        const mockUsers = [{Email: 'jane.doe@example.com'}];
        const mockFiches = [{IdFiche: 1}];

        Utilisateur.readAllByOrganisation.mockResolvedValueOnce(mockUsers);
        Utilisateur.updateTypeCompteWithOrganisation.mockResolvedValue();
        FichePoste.listFichesForOrganization.mockResolvedValueOnce(mockFiches);
        OffreEmploi.deleteByFiche.mockResolvedValue();
        FichePoste.delete.mockResolvedValue();
        db.query.mockResolvedValueOnce([{affectedRows: 1}]);

        const result = await Organisation.archiveOrganisationAndAssociations(numeroSiren);

        expect(result).toBe(true);
        expect(Utilisateur.readAllByOrganisation).toHaveBeenCalledWith(numeroSiren);
        expect(Utilisateur.updateTypeCompteWithOrganisation).toHaveBeenCalledTimes(mockUsers.length);
        for (const user of mockUsers) {
            expect(Utilisateur.updateTypeCompteWithOrganisation).toHaveBeenCalledWith(user.Email, 'candidat', null);
        }
        expect(FichePoste.listFichesForOrganization).toHaveBeenCalledWith(numeroSiren);
        expect(OffreEmploi.deleteByFiche).toHaveBeenCalledTimes(mockFiches.length);
        for (const fiche of mockFiches) {
            expect(OffreEmploi.deleteByFiche).toHaveBeenCalledWith(fiche.IdFiche);
            expect(FichePoste.delete).toHaveBeenCalledWith(fiche.IdFiche);
        }
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE Organisation SET StatutOrganisation = 'refusée' WHERE NumeroSiren = ?;"), [numeroSiren]);
    });


});
