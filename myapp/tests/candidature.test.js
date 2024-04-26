const db = require('../model/db');
const Candidature = require('../model/candidature');

jest.mock('../model/db', () => ({
    query: jest.fn(),
    close: jest.fn()
}));

describe("Model Tests - Candidature", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.close();  // Assuming there's a close method
    });

    test("create candidature successfully", async () => {
        const mockCandidature = {
            idCandidat: 123,
            idOffre: 456,
            dateCandidature: new Date()
        };
        db.query.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce([[{ id: 1, ...mockCandidature }], {}]);  // Simulating insert and then fetch

        const result = await Candidature.create(mockCandidature);
        expect(result).toEqual({ id: 1, ...mockCandidature });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("read candidature successfully", async () => {
        const id = 1;
        const mockCandidature = { id, idCandidat: 123, idOffre: 456, dateCandidature: new Date() };
        db.query.mockResolvedValueOnce([[mockCandidature], {}]);

        const result = await Candidature.read(id);
        expect(result).toEqual(mockCandidature);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("update candidature successfully", async () => {
        const id = 1;
        const updates = {
            idCandidat: 124,
            idOffre: 457,
            dateCandidature: new Date()
        };
        db.query.mockResolvedValueOnce([{}, {}]);  // Simulating update
        db.query.mockResolvedValueOnce([[{ id, ...updates }], {}]);

        const result = await Candidature.update(id, updates);
        expect(result).toEqual({ id, ...updates });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("delete candidature successfully", async () => {
        const id = 1;
        db.query.mockResolvedValueOnce([{}, {}]);  // Simulating delete

        await Candidature.delete(id);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("read all candidatures successfully", async () => {
        const mockCandidatures = [{ id: 1, idCandidat: 123, idOffre: 456, dateCandidature: new Date() }];
        db.query.mockResolvedValueOnce([mockCandidatures, {}]);

        const result = await Candidature.readall();
        expect(result).toEqual(mockCandidatures);
        expect(db.query).toHaveBeenCalledTimes(1);
    });
});