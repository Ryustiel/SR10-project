const db = require('../model/db');
const FichePoste = require('../model/ficheposte');

jest.mock('../model/db', () => ({
    query: jest.fn(),
    close: jest.fn()
}));

describe("Model Tests - FichePoste", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.close();  // Assuming there is a close method to clean up resources
    });

    test("create fiche poste successfully", async () => {
        const mockFiche = {
            intitule: "Developer",
            statutPoste: "vacant",
            responsableHierarchique: "CTO",
            typeMetier: "Engineering",
            lieuMission: "Remote",
            rythme: "Full-time",
            salaire: 50000,
            description: "Software development",
            idOrganisation: 1
        };
        db.query.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce([[{ id: 1, ...mockFiche }], {}]);  // Simulating insert and then fetch

        const result = await FichePoste.create(mockFiche);
        expect(result).toEqual({ id: 1, ...mockFiche });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("read fiche poste successfully", async () => {
        const id = 1;
        const mockFiche = { id, intitule: "Developer" };
        db.query.mockResolvedValueOnce([[mockFiche], {}]);

        const result = await FichePoste.read(id);
        expect(result).toEqual(mockFiche);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("update fiche poste successfully", async () => {
        const id = 1;
        const updates = {
            intitule: "Senior Developer",
            statutPoste: "occupied",
            responsableHierarchique: "CTO",
            typeMetier: "Engineering",
            lieuMission: "Office",
            rythme: "Part-time",
            salaire: 60000,
            description: "Advanced Software development",
            idOrganisation: 1
        };
        db.query.mockResolvedValueOnce([{}, {}]);
        db.query.mockResolvedValueOnce([[{ id, ...updates }], {}]);  // Simulating update and then fetch

        const result = await FichePoste.update(id, updates);
        expect(result).toEqual({ id, ...updates });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("delete fiche poste successfully", async () => {
        const id = 1;
        db.query.mockResolvedValueOnce([{}, {}]);

        await FichePoste.delete(id);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("read all fiches postes successfully", async () => {
        const mockFiches = [{ id: 1, intitule: "Developer" }];
        db.query.mockResolvedValueOnce([mockFiches, {}]);

        const result = await FichePoste.readall();
        expect(result).toEqual(mockFiches);
        expect(db.query).toHaveBeenCalledTimes(1);
    });
});