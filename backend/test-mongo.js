const mongoose = require("mongoose");
const uriconnexion = "mongodb://heart4122:<pasword>@ac-yhqwlhc-shard-00-00.a3sl8jg.mongodb.net:27017,ac-yhqwlhc-shard-00-01.a3sl8jg.mongodb.net:27017,ac-yhqwlhc-shard-00-02.a3sl8jg.mongodb.net:27017/?ssl=true&replicaSet=atlas-4pnc13-shard-0&authSource=admin&appName=Cluster0";
mongoose.connect(uriconnexion)
.then(() => { console.log("connecté amongo bd.!");
    insererJeux();})
.catch((erreur) => console.log("erreur de connexion:",erreur));

const jeuSchema = new mongoose.Schema({
    titre: String,
    plateforme: String,
    statut: String,
    note: Number
});
const jeu = mongoose.model("jeu", jeuSchema);
async function insererJeux() {
    await jeu.deleteMany({});
    await jeu.insertMany([
        {titre: "Elden Ring", plateforme: "PC", statut: "En cours", note: 9},
        {titre: "God of war", plateforme: "PS5", statut: "terminé", note: 9.5},
        {titre: "Hades II", plateforme: "PC", statut: "A jouer", note: 0},
        {titre: "Hollow knight", plateforme: "SWITCH", statut: "terminé", note: 8},
        {titre: "Cyberpunk 2077", plateforme: "PC", statut: "abandonné", note: 6}
    ]);
    console.log("5 jeux inderer !");
    const tousLesJeux = await jeu.find();
     console.log(tousLesJeux);
    await jeu.updateOne(
        {titre: "Hades II" },
        {note:8, statut: "En cours"}
    );
    console.log("Hades II mis a jour !");
    await jeu.deleteOne({titre: "Cyberpunk 2077"});
    console.log("cyberpunk 2077 supprimé");
    const apresModif = await jeu.find();
    console.log("Etat final:", apresModif);
    mongoose.connection.close();
}