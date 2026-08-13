const request = require("supertest");

const app = require("./index");

describre("routes d'authentification", () => {
    test("l'inscription refuse un email vide", async () => {
        const reponse = await request(app)
        .post("/inscription")
        .send({email: "", motDePasse: "test123"});
        expect(reponse.statusCode).not.toBe(201);
    });

    test("la connexion refuse un mauvais mot de passe", async () => {
        const reponse = await request(app)
        .post("/connexion")
        .send({email: "faux@test.com", motDePasse: "faux"});
        expect(reponse.statusCode).toBe(401);
    });
});