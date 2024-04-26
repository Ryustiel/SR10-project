const db = require("../model/db");
const bcrypt = require('bcryptjs');
const utilisateur = require("../model/utilisateur");

jest.mock("../model/db", () => ({
    query: jest.fn(),
    close: jest.fn()
}));

jest.mock('bcryptjs', () => ({
    compare: jest.fn()
}));

describe("Model Tests - Utilisateur", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        db.close();
    });

    test("create user successfully", async () => {
        const mockUser = {
            email: "tests@tests.fr",
            motDePasse: "password123",
            nom: "Doe",
            prenom: "John",
            telephone: "1234567890",
            dateCreation: new Date(),
            statutCompte: "actif",
            typeCompte: "admin",
            idOrganisation: 1
        };
        db.query.mockResolvedValueOnce([{}, { insertId: 1 }]);
        db.query.mockResolvedValueOnce([[mockUser], {}]);

        const result = await utilisateur.create(mockUser);
        expect(result).toEqual(mockUser);
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("read user successfully", async () => {
        const email = "tests@tests.fr";
        const mockUser = { email: email, nom: "Doe" };
        db.query.mockResolvedValueOnce([[mockUser], {}]);

        const result = await utilisateur.read(email);
        expect(result).toEqual(mockUser);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("update user successfully", async () => {
        const email = "tests@tests.fr";
        const updates = { nom: "John Updated", motDePasse: "newpassword123" };
        db.query.mockResolvedValueOnce([{}, {}]);
        db.query.mockResolvedValueOnce([[{ ...updates, email: email }], {}]);

        const result = await utilisateur.update(email, updates);
        expect(result).toEqual({ ...updates, email: email });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("delete user successfully", async () => {
        const email = "tests@tests.fr";
        db.query.mockResolvedValueOnce([{}, {}]);

        await utilisateur.delete(email);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("read all users successfully", async () => {
        const mockUsers = [{ email: "tests@tests.fr", nom: "Doe" }];
        db.query.mockResolvedValueOnce([mockUsers, {}]);

        const result = await utilisateur.readall();
        expect(result).toEqual(mockUsers);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("check user password validity", async () => {
        const email = "tests@tests.fr";
        const password = "password123";
        const hashedPassword = "$2a$10$example";
        bcrypt.compare.mockResolvedValue(true);
        db.query.mockResolvedValueOnce([[{ motDePasse: hashedPassword }], {}]);

        const isValid = await utilisateur.areValid(email, password);
        expect(isValid).toBeTruthy();
        expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("check user password invalidity", async () => {
        const email = "tests@tests.fr";
        const password = "wrongpassword";
        const hashedPassword = "$2a$10$example";
        bcrypt.compare.mockResolvedValue(false);
        db.query.mockResolvedValueOnce([[{ motDePasse: hashedPassword }], {}]);

        const isValid = await utilisateur.areValid(email, password);
        expect(isValid).toBeFalsy();
        expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("user not found returns false", async () => {
        const email = "nonexistent@tests.com";
        const password = "testpassword";
        db.query.mockResolvedValueOnce([[], {}]);

        const isValid = await utilisateur.areValid(email, password);
        expect(isValid).toBeFalsy();
        expect(db.query).toHaveBeenCalledTimes(1);
    });
});