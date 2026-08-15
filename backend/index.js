require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose")
const cors = require("cors");
const { body, validationResult } = require("express-validator");
// CORRECTION : bcrypt et jsonwebtoken sont remontés ici, avec les autres
// require(). Avant, ils étaient déclarés à la ligne ~126, après leur
// utilisation dans verifierToken (ligne 34) — ça fonctionnait par chance
// (le fichier entier se charge avant qu'une vraie requête arrive), mais
// c'était fragile et trompeur à la lecture.
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("connecté a MongoBD !"))
.catch((erreur) => console.log("Erreur de connexion:", erreur));

const jeuSchema = new mongoose.Schema({
    titre: String,
    plateforme: String,
    statut: String,
    note: Number,
    utilisateur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "utilisateur"
    }
});
const jeu = mongoose.model("jeu", jeuSchema);

function verifierToken(req, res, next) {
    const enTete = req.headers.authorization;
    if (!enTete){
        return res.status(401).json({message: "aucun token fourni! connecte toi d'abord"});
    }
    const token = enTete.split(" ")[1];
    try{
        const donneesToken = jwt.verify(token, process.env.JWT_SECRET);
        req.utilisateurId = donneesToken.id;
        next();
    }catch(erreur){
        console.log("erreur:", erreur);
        res.status(401).json({message: "token invalide ou expiré"})
    }
}

app.get("/jeux", verifierToken, async (req, res) => {
    try{
        const page = parseInt(req.query.page) || 1;
        const limite = 10;
        const recherche = req.query.recherche || "";
        const tri = req.query.tri || "titre";

        const filtre = {
            utilisateur: req.utilisateurId,
            titre: {$regex: recherche, $options: "i"}
        };

        const jeux = await jeu.find(filtre)
        .sort(tri)
        .skip((page - 1)* limite)
        .limit(limite);

        const total = await jeu.countDocuments(filtre)

        res.json({
            jeux: jeux,
            page: page,
            // CORRECTION : "totalpages" -> "totalPages" (camelCase), pour
            // rester cohérent avec la convention utilisée ailleurs si le
            // frontend vient à s'en servir (pagination visuelle plus tard)
            totalPages: Math.ceil(total / limite)
        });

    }catch(erreur) {
        res.status(500).json({message: "erreur lors de la recuperation des jeux"})
    }
});


app.post("/jeux", verifierToken, 
    [
        body("titre").notEmpty().withMessage("Le titre est obligatoire"),
        body("note").optional().isFloat({min: 0, max: 10}).withMessage("la note doit etre entre 0 et 10")
    ],
    async (req, res) => {

        const erreurs = validationResult(req);
        if(!erreurs.isEmpty()){
            // CORRECTION : "erreurs.array" -> "erreurs.array()". Sans les
            // parenthèses, on envoyait la fonction elle-même au lieu du
            // résultat -> le vrai détail des erreurs de validation
            // n'arrivait jamais jusqu'au frontend.
            return res.status(400).json({erreurs: erreurs.array()});
        }

   try{
         const nouveauJeu = new jeu({...req.body, utilisateur: req.utilisateurId });
        await nouveauJeu.save();
        res.status(201).json(nouveauJeu);
   }catch(erreur)
        {res.status(500).json({message: "erreur lors de l'ajout des jeux"})}
});

app.put("/jeux/:id", verifierToken, async(req,  res) => {
    try{
        const jeuModifie = await jeu.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!jeuModifie) {
            return res.status(404).json({message: "jeu introuvable"});
        }
        res.json(jeuModifie);
    }catch(erreur){
        res.status(500).json({message: "erreur lors de la modifications du jeu"});
    }
});

app.delete("/jeux/:id", verifierToken, async (req, res) => {
    try{
        const jeuSupprime = await jeu.findByIdAndDelete(req.params.id);
        if(!jeuSupprime) {
            return res.status(404).json({message: "jeu introuvable"});
        }
        res.json({ message: "jeu supprimé avec succès"});
    }catch(erreur){
        res.status(500).json({message: "erreur lors de la suppression du jeu"});
    }
});

const utilisateurSchema = new mongoose.Schema({
    email: String,
    motDePasse: String
});

const Utilisateur = mongoose.model("utilisateur", utilisateurSchema);


 //ROUTE

 app.post("/inscription", async (req, res) => {
    try{
        const {email, motDePasse} = req.body;

        // CORRECTION : aucune vérification n'existait avant la création du
        // compte -> on pouvait s'inscrire plusieurs fois avec le même email.
        // On vérifie maintenant qu'aucun compte n'existe déjà avec cet email.
        const utilisateurExistant = await Utilisateur.findOne({ email: email });
        if (utilisateurExistant) {
            return res.status(409).json({ message: "Un compte existe déjà avec cet email" });
        }

        const motDePasseHashe = await  bcrypt.hash(motDePasse, 10);

        const nouvelUtilisateur = new Utilisateur({
            email: email,
            motDePasse: motDePasseHashe
        });
        await nouvelUtilisateur.save();
        res.status(201).json({message: "compte créé avec succès"});
    }catch(erreur) {
        res.status(500).json({message: "erreur lors de l'inscription"});
    }
 })


 app.post("/connexion", async (req, res) => {
    try {
        const { email, motDePasse } = req.body;
        const utilisateur = await Utilisateur.findOne({email: email});
        if(!utilisateur) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect"});
        }
        const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
        if (!motDePasseValide) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect"});
        }
        const token = jwt.sign(
            {id: utilisateur._id},
            process.env.JWT_SECRET,
            {expiresIn:  "7d"}
        );
        res.json({token: token});
    }catch(erreur) {
        console.log("erreur reele:", erreur);
        res.status(500).json({message: "erreur lors de la connexion"});
    }
 });


app.use((erreur, req, res, next) => {
    console.error("erreur non géré:", erreur);
    res.status(500).json({ message: "une erreur inattendue esu survenue"});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`serveur démarré sur  le port ${PORT}` );
    
});

module.exports = app;
