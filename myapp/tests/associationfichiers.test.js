const db = require('../model/db');
const AssociationFichiers = require('../model/associationfichiers');

jest.mock('../model/db', () => ({
    query: jest.fn(),
    close: jest.fn()
}));

describe("Model Tests - AssociationFichiers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.close();
    });

    test("create association fichiers successfully", async () => {
        const mockAssociation = {
            idCandidature: 1,
            fichier: "resume.pdf"
        };
        db.query.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce([[{ id: 1, ...mockAssociation }], {}]);  // Simulating insert then fetch

        const result = await AssociationFichiers.create(mockAssociation);
        expect(result).toEqual({ id: 1, ...mockAssociation });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("read association fichiers successfully", async () => {
        const id = 1;
        const mockAssociation = { id, idCandidature: 1, fichier: "resume.pdf" };
        db.query.mockResolvedValueOnce([[mockAssociation], {}]);

        const result = await AssociationFichiers.read(id);
        expect(result).toEqual(mockAssociation);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("update association fichiers successfully", async () => {
        const id = 1;
        const updates = {
            idCandidature: 2,
            fichier: "cover_letter.pdf"
        };
        db.query.mockResolvedValueOnce([{}, {}]);  // Simulating update
        db.query.mockResolvedValueOnce([[{ id, ...updates }], {}]);

        const result = await AssociationFichiers.update(id, updates);
        expect(result).toEqual({ id, ...updates });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("delete association fichiers successfully", async () => {
        const id = 1;
        db.query.mockResolvedValueOnce([{}, {}]);  // Simulating delete

        await AssociationFichiers.delete(id);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("read all association fichiers successfully", async () => {
        const mockAssociations = [{ id: 1, idCandidature: 1, fichier: "resume.pdf" }];
        db.query.mockResolvedValueOnce([mockAssociations, {}]);

        const result = await AssociationFichiers.readall();
        expect(result).toEqual(mockAssociations);
        expect(db.query).toHaveBeenCalledTimes(1);
    });
});
