const express = require("express");
const app = express();
app.use(express.json());
app.get("/", (req, res) => {
    res.send("hello");
});
app.get("/jeux", (req, res) => {
    const jeux = [
        {titre:"elden ring" , statut:"en cours" },
        {titre:"God of war" , statut:"terminé" },
        {titre:"Halo" , statut:"A jouer" }
    ];
    res.json(jeux);
});
app.post("/jeux", (req, res) => {
    const nouveauJeu = req.body;
    console.log("jeu recu:", nouveauJeu);
    res.json(nouveauJeu);
});
app.listen(3000, () => {
    console.log("serveur démarré sur  http://localhost:3000 ");
});