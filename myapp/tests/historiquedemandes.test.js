const db = require('../model/db');
const HistoriqueDemandes = require('../model/historiqueDemandes');
const logger = require('../logger');

jest.mock('../model/db', () => ({
    query: jest.fn(),
    close: jest.fn()
}));

describe("Model Tests - HistoriqueDemandes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.close();
    });

    test("create historique demande successfully", async () => {
        const mockData = { numeroSiren: '123456789', action: 'approuvée', typeDemande: 'nouveau_recruteur', userId: 'user@example.com' };
        db.query.mockResolvedValueOnce([{ insertId: 1 }]);

        const result = await HistoriqueDemandes.create(mockData.numeroSiren, mockData.action, mockData.typeDemande, mockData.userId);
        expect(result).toBe(1);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [mockData.numeroSiren, mockData.action, mockData.typeDemande, mockData.userId]);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("read historique demande successfully", async () => {
        const idHistorique = 1;
        const mockData = { idHistorique, numeroSiren: '123456789', action: 'approuvée', typeDemande: 'nouveau_recruteur', userId: 'user@example.com' };
        db.query.mockResolvedValueOnce([[mockData]]);

        const result = await HistoriqueDemandes.read(idHistorique);
        expect(result).toEqual(mockData);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idHistorique]);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("read all historique demandes successfully", async () => {
        const mockData = [{ idHistorique: 1, numeroSiren: '123456789', action: 'approuvée', typeDemande: 'nouveau_recruteur', userId: 'user@example.com' }];
        db.query.mockResolvedValueOnce([mockData]);

        const result = await HistoriqueDemandes.readAll();
        expect(result).toEqual(mockData);
        expect(db.query).toHaveBeenCalledWith(expect.any(String));
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("read en attente historique demandes successfully", async () => {
        const mockData = [{ idHistorique: 1, numeroSiren: '123456789', action: 'en attente', typeDemande: 'nouveau_recruteur', userId: 'user@example.com' }];
        db.query.mockResolvedValueOnce([mockData]);

        const result = await HistoriqueDemandes.readEnAttente();
        expect(result).toEqual(mockData);
        expect(db.query).toHaveBeenCalledWith(expect.any(String));
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("update action successfully", async () => {
        const mockData = { numeroSiren: '123456789', userId: 'user@example.com', newAction: 'approuvée', administrateurEmail: 'admin@example.com' };
        db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

        const result = await HistoriqueDemandes.updateAction(mockData.numeroSiren, mockData.userId, mockData.newAction, mockData.administrateurEmail);
        expect(result).toBe(true);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [mockData.newAction, mockData.administrateurEmail, mockData.numeroSiren, mockData.userId]);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("update action returns false if no rows affected", async () => {
        const mockData = { numeroSiren: '123456789', userId: 'user@example.com', newAction: 'approuvée', administrateurEmail: 'admin@example.com' };
        db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

        const result = await HistoriqueDemandes.updateAction(mockData.numeroSiren, mockData.userId, mockData.newAction, mockData.administrateurEmail);
        expect(result).toBe(false);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [mockData.newAction, mockData.administrateurEmail, mockData.numeroSiren, mockData.userId]);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("read all historique demandes with pagination successfully", async () => {
        const mockData = {
            requests: [
                { idHistorique: 1, numeroSiren: '123456789', action: 'approuvée', typeDemande: 'nouveau_recruteur', userId: 'user@example.com', OrganisationNom: 'Org1', UserNom: 'Doe', UserPrenom: 'John' }
            ],
            totalRequests: 1
        };
        db.query
            .mockResolvedValueOnce([mockData.requests])
            .mockResolvedValueOnce([[{ totalRequests: mockData.totalRequests }]]);

        const result = await HistoriqueDemandes.readAllWithPagination('user', 10, 0);
        expect(result).toEqual(mockData);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), ['%user%', '%user%', 10, 0]);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), ['%user%', '%user%']);
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("delete historique demandes by organisation successfully", async () => {
        const numeroSiren = '123456789';
        db.query.mockResolvedValueOnce([{}]);

        await HistoriqueDemandes.deleteByOrganisation(numeroSiren);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [numeroSiren]);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("delete historique demandes by user successfully", async () => {
        const userId = 'user@example.com';
        db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

        const result = await HistoriqueDemandes.deleteRequests(userId);
        expect(result).toBe(true);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [userId]);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("delete historique demandes by user returns false if no rows affected", async () => {
        const userId = 'user@example.com';
        db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

        const result = await HistoriqueDemandes.deleteRequests(userId);
        expect(result).toBe(false);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [userId]);
        expect(db.query).toHaveBeenCalledTimes(1);
    });
});
