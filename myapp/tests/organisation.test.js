const db = require("../model/db");
const organisation = require("../model/organisation");

jest.mock("../model/db", () => ({
    query: jest.fn(),
    close: jest.fn()
}));

describe("Organisation Model Tests", () => {
    beforeEach(() => {
        db.query.mockClear();
    });
    afterAll(async () => {
        await db.close();
    });
    test("create organisation successfully", async () => {
        const mockOrg = {
            numeroSiren: "123456789",
            nom: "Example Corp",
            type: "Private",
            adresseAdministrative: "1234 Main St",
            statutOrganisation: "Active"
        };
        db.query.mockResolvedValueOnce([{}, { insertId: 1 }]);
        db.query.mockResolvedValueOnce([[mockOrg], {}]);

        const result = await organisation.create(mockOrg);
        expect(result).toEqual(mockOrg);
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("read organisation successfully", async () => {
        const numeroSiren = "123456789";
        const mockOrg = { numeroSiren, nom: "Example Corp" };
        db.query.mockResolvedValueOnce([[mockOrg], {}]);

        const result = await organisation.read(numeroSiren);
        expect(result).toEqual(mockOrg);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("update organisation successfully", async () => {
        const numeroSiren = "123456789";
        const updates = {
            nom: "Updated Corp",
            type: "Public",
            adresseAdministrative: "5678 Main St",
            statutOrganisation: "Inactive"
        };
        db.query.mockResolvedValueOnce([{}, {}]);
        db.query.mockResolvedValueOnce([[{ ...updates, numeroSiren }], {}]);

        const result = await organisation.update(numeroSiren, updates);
        expect(result).toEqual({ ...updates, numeroSiren });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("delete organisation successfully", async () => {
        const numeroSiren = "123456789";
        db.query.mockResolvedValueOnce([{}, {}]);

        await organisation.delete(numeroSiren);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("read all organisations successfully", async () => {
        const mockOrgs = [{ numeroSiren: "123456789", nom: "Example Corp" }];
        db.query.mockResolvedValueOnce([mockOrgs, {}]);

        const results = await organisation.readall();
        expect(results).toEqual(mockOrgs);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("check organisation validity", async () => {
        const idOrganisation = "123456789";
        db.query.mockResolvedValueOnce([[{}, {}], {}]); // Organisation found

        const isValid = await organisation.areValid(idOrganisation);
        expect(isValid).toBeTruthy();
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("check organisation invalidity", async () => {
        const idOrganisation = "987654321";
        db.query.mockResolvedValueOnce([[], {}]); // No organisation found

        const isValid = await organisation.areValid(idOrganisation);
        expect(isValid).toBeFalsy();
        expect(db.query).toHaveBeenCalledTimes(1);
    });
});