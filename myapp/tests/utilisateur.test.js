const db = require('../model/db');
const Candidature = require('../model/candidature');
const HistoriqueDemandes = require('../model/historiquedemandes');
const Utilisateur = require('../model/utilisateur');
const bcrypt = require('bcryptjs');
const logger = require('../logger');

jest.mock('../model/db', () => ({
    query: jest.fn(),
    close: jest.fn()
}));

jest.mock('../model/candidature');
jest.mock('../model/historiquedemandes');
jest.mock('bcryptjs');
jest.mock('../logger');

describe('Model Tests - Utilisateur', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.close();
    });

    test('create utilisateur successfully', async () => {
        const mockUser = {
            email: 'jane.doe@example.com',
            motDePasse: 'hashedpassword',
            nom: 'Doe',
            prenom: 'Jane',
            telephone: '0123456789',
            dateCreation: new Date(),
            statutCompte: 'actif',
            typeCompte: 'recruteur',
            idOrganisation: '123456789'
        };

        db.query.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce([[mockUser], {}]);

        const result = await Utilisateur.create(mockUser);

        expect(result).toEqual(mockUser);
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test('read utilisateur successfully', async () => {
        const email = 'jane.doe@example.com';
        const mockUser = { email, nom: 'Doe', prenom: 'Jane' };

        db.query.mockResolvedValueOnce([[mockUser], {}]);

        const result = await Utilisateur.read(email);

        expect(result).toEqual(mockUser);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('update utilisateur successfully with valid fields', async () => {
        const email = 'jane.doe@example.com';
        const updates = { Nom: 'Doe', Prenom: 'John' };
        const updatedUser = {
            email,
            Nom: 'Doe',
            Prenom: 'John',
            Telephone: '0123456789',
            DateCreation: new Date(),
            StatutCompte: 'actif',
            TypeCompte: 'recruteur',
            IdOrganisation: '123456789'
        };

        db.query.mockResolvedValueOnce(); // For the UPDATE query
        db.query.mockResolvedValueOnce([[updatedUser], {}]); // For the SELECT query

        const result = await Utilisateur.update(email, updates);

        expect(result).toEqual(updatedUser);
        expect(db.query).toHaveBeenCalledTimes(2);

        // Vérifier le premier appel (UPDATE query)
        const expectedUpdateQuery = `
            UPDATE Utilisateur
            SET Nom = ?, Prenom = ?
            WHERE Email = ?;
        `.replace(/\s+/g, ' ').trim();

        const receivedUpdateQuery = db.query.mock.calls[0][0].replace(/\s+/g, ' ').trim();
        expect(receivedUpdateQuery).toBe(expectedUpdateQuery);
        expect(db.query).toHaveBeenNthCalledWith(1,
            expect.any(String),
            expect.arrayContaining(['Doe', 'John', email])
        );

        // Vérifier le deuxième appel (SELECT query)
        const expectedSelectQuery = `
            SELECT *
            FROM Utilisateur
            WHERE Email = ?;
        `.replace(/\s+/g, ' ').trim();

        const receivedSelectQuery = db.query.mock.calls[1][0].replace(/\s+/g, ' ').trim();
        expect(receivedSelectQuery).toBe(expectedSelectQuery);
        expect(db.query).toHaveBeenNthCalledWith(2,
            expect.any(String),
            expect.arrayContaining([email])
        );
    });


    test('update utilisateur with no fields to update', async () => {
        const email = 'jane.doe@example.com';
        const updates = {};

        // Expect an error to be thrown due to no fields to update
        await expect(Utilisateur.update(email, updates)).rejects.toThrow('No fields to update');

        // Ensure the query method was not called since there are no fields to update
        expect(db.query).not.toHaveBeenCalled();
    });

    test('update utilisateur with invalid field', async () => {
        const email = 'jane.doe@example.com';
        const updates = { InvalidField: 'InvalidValue' };

        // Expect an error to be thrown due to no valid fields to update
        await expect(Utilisateur.update(email, updates)).rejects.toThrow('No fields to update');

        // Ensure the query method was not called since there are no valid fields to update
        expect(db.query).not.toHaveBeenCalled();
    });

    test('delete utilisateur successfully', async () => {
        const email = 'jane.doe@example.com';
        const mockCandidatures = [{ IdOffre: 1 }, { IdOffre: 2 }];

        // Simuler les appels aux méthodes dépendantes
        Candidature.getApplicationsCandidat.mockResolvedValueOnce(mockCandidatures);
        Candidature.delete.mockResolvedValue();
        HistoriqueDemandes.deleteRequests.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce(); // For START TRANSACTION
        db.query.mockResolvedValueOnce(); // For DELETE query
        db.query.mockResolvedValueOnce(); // For COMMIT

        await Utilisateur.delete(email);

        expect(db.query).toHaveBeenCalledTimes(3); // 1 for START TRANSACTION, 1 for DELETE, 1 for COMMIT
        expect(db.query).toHaveBeenNthCalledWith(1, 'START TRANSACTION');
        expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('DELETE FROM Utilisateur WHERE Email = ?;'), [email]);
        expect(db.query).toHaveBeenNthCalledWith(3, 'COMMIT');

        expect(Candidature.getApplicationsCandidat).toHaveBeenCalledWith(email);
        expect(Candidature.delete).toHaveBeenCalledTimes(mockCandidatures.length);
        for (const candidature of mockCandidatures) {
            expect(Candidature.delete).toHaveBeenCalledWith(email, candidature.IdOffre);
        }
        expect(HistoriqueDemandes.deleteRequests).toHaveBeenCalledWith(email);
    });

    test('delete utilisateur rolls back on error', async () => {
        const email = 'jane.doe@example.com';
        const mockCandidatures = [{ IdOffre: 1 }, { IdOffre: 2 }];

        // Simuler les appels aux méthodes dépendantes
        Candidature.getApplicationsCandidat.mockResolvedValueOnce(mockCandidatures);
        Candidature.delete.mockRejectedValueOnce(new Error('Candidature deletion failed'));
        db.query.mockResolvedValueOnce(); // For START TRANSACTION
        db.query.mockResolvedValueOnce(); // For ROLLBACK

        await expect(Utilisateur.delete(email)).rejects.toThrow('Candidature deletion failed');

        expect(db.query).toHaveBeenCalledTimes(2); // 1 for START TRANSACTION, 1 for ROLLBACK
        expect(db.query).toHaveBeenNthCalledWith(1, 'START TRANSACTION');
        expect(db.query).toHaveBeenNthCalledWith(2, 'ROLLBACK');

        expect(Candidature.getApplicationsCandidat).toHaveBeenCalledWith(email);
        expect(Candidature.delete).toHaveBeenCalledTimes(1); // Only the first delete call should have been made
    });


    test('read all utilisateurs successfully', async () => {
        const mockUsers = [{ email: 'jane.doe@example.com', nom: 'Doe' }];

        db.query.mockResolvedValueOnce([mockUsers, {}]);

        const result = await Utilisateur.readall();

        expect(result).toEqual(mockUsers);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('areValid returns true for valid user', async () => {
        const email = 'jane.doe@example.com';
        const motDePasse = 'password123';
        const mockUser = { motDePasse: 'hashedpassword' };

        db.query.mockResolvedValueOnce([[mockUser], {}]);
        bcrypt.compare.mockResolvedValueOnce(true);

        const result = await Utilisateur.areValid(email, motDePasse);

        expect(result).toBe(true);
        expect(bcrypt.compare).toHaveBeenCalledWith(motDePasse, mockUser.motDePasse);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('areValid returns false for non-existent user', async () => {
        const email = 'nonexistent@example.com';
        const motDePasse = 'password123';

        db.query.mockResolvedValueOnce([[], {}]);

        const result = await Utilisateur.areValid(email, motDePasse);

        expect(result).toBe(false);
        expect(bcrypt.compare).not.toHaveBeenCalled();
        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT motDePasse FROM Utilisateur WHERE Email = ?;'), [email]);
    });


    test('getType returns type of user', async () => {
        const email = 'jane.doe@example.com';
        const mockUser = { TypeCompte: 'recruteur' };

        db.query.mockResolvedValueOnce([[mockUser], {}]);

        const result = await Utilisateur.getType(email);

        expect(result).toBe('recruteur');
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('getType returns null for non-existent user', async () => {
        const email = 'nonexistent@example.com';

        db.query.mockResolvedValueOnce([[], {}]);

        const result = await Utilisateur.getType(email);

        expect(result).toBeNull();
        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining(`SELECT TypeCompte
                       FROM Utilisateur
                       WHERE Email = ?;`), [email]);
    });

    test('getNom returns full name of user', async () => {
        const email = 'jane.doe@example.com';
        const mockUser = { Nom: 'Doe', Prenom: 'Jane' };

        db.query.mockResolvedValueOnce([[mockUser], {}]);

        const result = await Utilisateur.getNom(email);

        expect(result).toBe('Doe Jane');
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('getNom returns null for non-existent user', async () => {
        const email = 'nonexistent@example.com';

        db.query.mockResolvedValueOnce([[], {}]);

        const result = await Utilisateur.getNom(email);

        expect(result).toBeNull();
        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining(`SELECT Nom, Prenom
                       FROM Utilisateur
                       WHERE Email = ?;`), [email]);
    });

    test('getOrganisationId returns organisation ID of user', async () => {
        const email = 'jane.doe@example.com';
        const mockUser = { IdOrganisation: '123456789' };

        db.query.mockResolvedValueOnce([[mockUser], {}]);

        const result = await Utilisateur.getOrganisationId(email);

        expect(result).toBe('123456789');
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('getOrganisationId returns null for non-existent user', async () => {
        const email = 'nonexistent@example.com';

        db.query.mockResolvedValueOnce([[], {}]);

        const result = await Utilisateur.getOrganisationId(email);

        expect(result).toBeNull();
        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining(`SELECT IdOrganisation
                       FROM Utilisateur
                       WHERE Email = ?;`), [email]);
    });

    test('updateTypeCompte updates typeCompte of user', async () => {
        const email = 'jane.doe@example.com';
        const typeCompte = 'administrateur';
        const mockUser = { email, typeCompte };

        db.query.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce([[mockUser], {}]);

        const result = await Utilisateur.updateTypeCompte(email, typeCompte);

        expect(result).toEqual(mockUser);
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test('updateTypeCompteWithOrganisation updates typeCompte and idOrganisation of user', async () => {
        const email = 'jane.doe@example.com';
        const typeCompte = 'administrateur';
        const idOrganisation = '987654321';
        const mockUser = { email, typeCompte, idOrganisation };

        db.query.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce([[mockUser], {}]);

        const result = await Utilisateur.updateTypeCompteWithOrganisation(email, typeCompte, idOrganisation);

        expect(result).toEqual(mockUser);
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test('readAllWithPagination returns paginated users and total count', async () => {
        const search = 'jane';
        const limit = 10;
        const offset = 0;
        const mockUsers = [{ email: 'jane.doe@example.com', nom: 'Doe' }];
        const mockTotal = { totalUsers: 1 };

        db.query.mockResolvedValueOnce([mockUsers, {}]);
        db.query.mockResolvedValueOnce([[mockTotal], {}]);

        const result = await Utilisateur.readAllWithPagination(search, limit, offset);

        expect(result).toEqual({ users: mockUsers, totalUsers: mockTotal.totalUsers });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test('getRecruiterRequestsWithPagination returns paginated recruiter requests and total count', async () => {
        const search = 'jane';
        const limit = 10;
        const offset = 0;
        const mockRequests = [{ email: 'jane.doe@example.com', nom: 'Doe', OrganisationNom: 'Tech Corp', StatutOrganisation: 'en attente' }];
        const mockTotal = { totalRequests: 1 };

        db.query.mockResolvedValueOnce([mockRequests, {}]);
        db.query.mockResolvedValueOnce([[mockTotal], {}]);

        const result = await Utilisateur.getRecruiterRequestsWithPagination(search, limit, offset);

        expect(result).toEqual({ requests: mockRequests, totalRequests: mockTotal.totalRequests });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test('readAllByOrganisation returns users of an organisation', async () => {
        const idOrganisation = '123456789';
        const mockUsers = [{ email: 'jane.doe@example.com', nom: 'Doe' }];

        db.query.mockResolvedValueOnce([mockUsers, {}]);

        const result = await Utilisateur.readAllByOrganisation(idOrganisation);

        expect(result).toEqual(mockUsers);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('readAllOrderedByDateCreation returns users ordered by date creation', async () => {
        const mockUsers = [{ email: 'jane.doe@example.com', nom: 'Doe', dateCreation: '2023-03-29 08:00:00' }];

        db.query.mockResolvedValueOnce([mockUsers, {}]);

        const result = await Utilisateur.readAllOrderedByDateCreation();

        expect(result).toEqual(mockUsers);
        expect(db.query).toHaveBeenCalledTimes(1);
    });
});
