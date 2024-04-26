const db = require("../model/db");
const OffreEmploi = require("../model/offreemploi");

jest.mock('../model/db', () => ({
    query: jest.fn(),
    close: jest.fn()
}));

describe("Model Tests - OffreEmploi", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.close();
    });

    test("create offre emploi successfully", async () => {
        const mockOffre = {
            etat: "Ouvert",
            dateValidite: new Date(),
            listePieces: "CV, Lettre de motivation",
            nombrePieces: 2,
            idFiche: 1,
            idRecruteur: 1
        };
        db.query.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce([[{ id: 1, ...mockOffre }], {}]);

        const result = await OffreEmploi.create(mockOffre);
        expect(result).toEqual({ id: 1, ...mockOffre });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("read offre emploi successfully", async () => {
        const id = 1;
        const mockOffre = { id, etat: "Ouvert" };
        db.query.mockResolvedValueOnce([[mockOffre], {}]);

        const result = await OffreEmploi.read(id);
        expect(result).toEqual(mockOffre);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("update offre emploi successfully", async () => {
        const id = 1;
        const updates = {
            etat: "Fermé",
            dateValidite: new Date(),
            listePieces: "CV",
            nombrePieces: 1,
            idFiche: 1,
            idRecruteur: 2
        };
        db.query.mockResolvedValueOnce([{}, {}]);
        db.query.mockResolvedValueOnce([[{ id, ...updates }], {}]);

        const result = await OffreEmploi.update(id, updates);
        expect(result).toEqual({ id, ...updates });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("delete offre emploi successfully", async () => {
        const id = 1;
        db.query.mockResolvedValueOnce([{}, {}]);

        await OffreEmploi.delete(id);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("read all offres emploi successfully", async () => {
        const mockOffres = [{ id: 1, etat: "Ouvert" }];
        db.query.mockResolvedValueOnce([mockOffres, {}]);

        const result = await OffreEmploi.readall();
        expect(result).toEqual(mockOffres);
        expect(db.query).toHaveBeenCalledTimes(1);
    });
});