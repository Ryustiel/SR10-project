const db = require('../model/db');
const DemandeAjoutOrganisation = require('../model/demandeajoutorganisation');

jest.mock('../model/db', () => ({
    query: jest.fn(),
    close: jest.fn()
}));

describe("Model Tests - DemandeAjoutOrganisation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.close();  // Assuming there's a close method
    });

    test("create demande ajout organisation successfully", async () => {
        const mockDemande = {
            idDemandeur: 1,
            idOrganisation: 2
        };
        db.query.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce([[{ id: 1, ...mockDemande }], {}]);  // Simulating insert and then fetch

        const result = await DemandeAjoutOrganisation.create(mockDemande);
        expect(result).toEqual({ id: 1, ...mockDemande });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("read demande ajout organisation successfully", async () => {
        const id = 1;
        const mockDemande = { id, idDemandeur: 1, idOrganisation: 2 };
        db.query.mockResolvedValueOnce([[mockDemande], {}]);

        const result = await DemandeAjoutOrganisation.read(id);
        expect(result).toEqual(mockDemande);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("update demande ajout organisation successfully", async () => {
        const id = 1;
        const updates = {
            idDemandeur: 1,
            idOrganisation: 3
        };
        db.query.mockResolvedValueOnce([{}, {}]);
        db.query.mockResolvedValueOnce([[{ id, ...updates }], {}]);

        const result = await DemandeAjoutOrganisation.update(id, updates);
        expect(result).toEqual({ id, ...updates });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("delete demande ajout organisation successfully", async () => {
        const id = 1;
        db.query.mockResolvedValueOnce([{}, {}]);

        await DemandeAjoutOrganisation.delete(id);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("read all demandes ajout organisation successfully", async () => {
        const mockDemandes = [{ id: 1, idDemandeur: 1, idOrganisation: 2 }];
        db.query.mockResolvedValueOnce([mockDemandes, {}]);

        const result = await DemandeAjoutOrganisation.readall();
        expect(result).toEqual(mockDemandes);
        expect(db.query).toHaveBeenCalledTimes(1);
    });
});