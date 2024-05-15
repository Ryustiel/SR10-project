const FichePoste = require('.././model/ficheposte');  // remplacer par le chemin correct vers votre fichier
const pool = require('../model/db');

// Mocking the pool.query function
jest.mock('../model/db', () => ({
    query: jest.fn(),
    close: jest.fn(),
}));

describe("Model Tests - FichePoste", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await pool.close();
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

        pool.query.mockResolvedValueOnce();

        const result = await FichePoste.create(mockFiche);

        expect(result).toEqual(true);
        expect(pool.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([
            mockFiche.intitule, mockFiche.statutPoste, mockFiche.responsableHierarchique,
            mockFiche.typeMetier, mockFiche.lieuMission, mockFiche.rythme,
            mockFiche.salaire, mockFiche.description, mockFiche.idOrganisation
        ]));
    });

    test("read fiche poste successfully", async () => {
        const id = 1;
        const mockFiche = { id, intitule: "Developer" };

        pool.query.mockResolvedValueOnce([[mockFiche], {}]);

        const result = await FichePoste.read(id);

        expect(result).toEqual(mockFiche);
        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [id]);
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

        pool.query.mockResolvedValueOnce();
        pool.query.mockResolvedValueOnce([[{ id, ...updates }], {}]);

        const result = await FichePoste.update(id, updates);

        expect(result).toEqual({ id, ...updates });
        expect(pool.query).toHaveBeenCalledTimes(2);
    });

    test("list fiches successfully", async () => {
        const mockFiches = [{ idFiche: 1, intitule: "Developer" }];

        pool.query.mockResolvedValueOnce([mockFiches, {}]);

        const result = await FichePoste.list();

        expect(result).toEqual(mockFiches);
        expect(pool.query).toHaveBeenCalledWith(expect.any(String));
    });

    test("delete fiche poste successfully", async () => {
        const id = 1;

        pool.query.mockResolvedValueOnce();

        await FichePoste.delete(id);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [id]);
    });

    test("read all fiches postes successfully", async () => {
        const mockFiches = [{ id: 1, intitule: "Developer" }];

        pool.query.mockResolvedValueOnce([mockFiches, {}]);

        const result = await FichePoste.readall();

        expect(result).toEqual(mockFiches);
        expect(pool.query).toHaveBeenCalledTimes(1);
    });

    test("list fiches by organisation successfully", async () => {
        const idOrganisation = 1;
        const mockFiches = [{ idFiche: 1, intitule: "Developer" }];

        pool.query.mockResolvedValueOnce([mockFiches, {}]);

        const result = await FichePoste.listFiches(idOrganisation);

        expect(result).toEqual(mockFiches);
        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [idOrganisation]);
    });

    test("check if a user is legitimate", async () => {
        const idFiche = 1;
        const idOrganisation = 1;
        const mockCount = { 'COUNT(*)': 1 };

        pool.query.mockResolvedValueOnce([[mockCount], {}]);

        const result = await FichePoste.isUserLegitimate(idFiche, idOrganisation);

        expect(result).toBe(true);
        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [idFiche, idOrganisation]);
    });
});