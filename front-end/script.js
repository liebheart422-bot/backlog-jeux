console.log("js connecté")
////const jeu1 = document.getElementById("jeu1");
//jeu1.addEventListener("click", () =>{
    //jeu1.style.backgroundColor = "#6c5dd3";
//;
const form = document.getElementById("add-game-form");
const erreur = document.getElementById("erreur");
form.addEventListener("submit",async (event) => {
    event.preventDefault();
    const titre = document.getElementById("titre").value;
    const note = document.getElementById("note").value;
    if (titre.trim() === "") {
        erreur.textContent = "le titre est obligatoire.";
        erreur.style.display = "block";
        return;
    }
    if (note !== "" && (note < 0 || note > 10)) {
        erreur.textContent = "la note doit etre entre 0 et 10.";
        erreur.style.display = "block";
        return;
    }
    const token = localStorage.getItem("token");
    const reponse = await fetch(`${API_URL}/jeux`, {
        method: "POST",
        headers: {
            "Content-type": "application/json",
            "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            titre:  titre,
            plateforme: document.getElementById("plateforme")?.value || document.querySelectorAll('.add-game-form input [placeholder*="plateforme"] ').value,
            statut: document.querySelectorAll(".add-game-form select").value,
            note: note
        })
    });
    if(reponse.ok) {
        erreur.style.display = "none";
        chargerJeux();
        form.reset(); 
    }else{
        const donneesErreur = await reponse.json();
        erreur.textContent = donneesErreur.messahe || "erreur lors de l'ajout du jeu";
        erreur.style.display = "block";
    }
    alert("jeu ajouté");
});
const butonFiltre = document.getElementById("filtre-termine");
let filtreActif = false;
butonFiltre.addEventListener("click", () => {
    const lignes = document.querySelectorAll("table tr");
    filtreActif = !filtreActif;
    lignes.forEach((ligne) => {
        const statut = ligne.children[1].textContent;
        if (filtreActif && statut !== "terminé") {
            ligne.style.display="none";
        }
        else {
            ligne.style.display = "";
        }
    });
    butonFiltre.textContent = filtreActif ? "afficher tous les jeux" : "afficher seulement les jeux terminés"
});
async function chargerBlague() {
    const reponse = await fetch("https://icanhazdadjoke.com/", {
        headers: {"Accept": "application/json"}
    });
    const donnees = await reponse.json();
    console.log(donnees.joke);
}
chargerBlague();

const API_URL = "http://localhost:3000";

async function chargerJeux() {
    const token = localStorage.getItem("token");
    
    if(!token) {
        console.log("pas encore connecté - impossible de charer les jeux");
        return;
    }

    const recherche = document.getElementById("recherche-jeux").value;
    const tri = document.getElementById("tir-jeux").value;

    const reponse = await fetch(`${API_URL}/jeux?recherche=${recherche}&tri${tri}`, {
        headers: {
            "authorization": `Bearer ${token}`
        }
    });

    document.getElementById("recherche-jeux").addEventListener("input", chargerJeux);
    document.getElementById("tri-jeux").addEventListener("change", chargerJeux);


    const donnees = await reponse.json();
     console.log("jeux reçu: ", donnees);

    const tableJeux = document.getElementById("table-jeux");
    tableJeux.innerHTML = "";

    donnees.jeux.forEach((jeu) => {
        const ligne = document.createElement("tr");
        ligne.innerHTML = `<td>${jeu.titre}<td>
                           <td>
                                <select data-id="${jeu._id}" class="statut-select">
                                        <option value="a jouer" ${jeu.statut === "a jouer" ? "selected": ""}>A jouer</option>
                                        <option value="en cours" ${jeu.statut === "en cours" ? "selected": ""}>en cours</option>
                                        <option value="terminé" ${jeu.statut === "terminé" ? "selected": ""}>Terminé </option>
                                        <option value="abandonné" ${jeu.statut === "abandonné" ? "selected": ""}>Abandonn" </option>                
                                </select>
                           </td>
                           <td>${jeu.note !== undefined ? jeu.note + "/10" : "_"}<td> `;
                           tableJeux.appendChild(ligne);
    });

    document.querySelectorAll(".statut-select").forEach((select) => {
        select.addEventListener("change", async (event) => {
            const idJeu =event.target.dataset.id;
            const nouveauStatut = event.target.value;
            const token = localStorage.getItem("token");


            const reponse = await fetch(`${API_URL}/connexion`, {
        method: "PUT",
        headers: {
            "content-Type": "application/json",
            "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ statut: nouveauStatut})
    });
             
        });
    });

   

}


const formConnexion = document.getElementById("connexion-form");
const connexionErreur = document.getElementById("connexion-erreur");
const buttonOuvrirConnexion = document.getElementById("btn-ouvrir-connexion");
const sectionConnexion = document.getElementById("section-connexion");

buttonOuvrirConnexion.addEventListener("click", () => {
    const estCache = sectionConnexion.style.display === "none";

    sectionConnexion.style.display = estCache ? "block" : "none"
    if(estCache) {
        sectionConnexion.scrollIntoView({behavior: "smooth"});
    }
});

formConnexion.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("connexion-email").value;
    const motDePasse = document.getElementById("connexion-motDePasse").value;

    const reponse = await fetch(`${API_URL}/connexion`, {
        method: "POST",
        headers: {"content-Type": "application/json"},
        body: JSON.stringify({ email, motDePasse})
    });

    const donnees = await reponse.json();
    if(!reponse.ok) {
        connexionErreur.textContent = donnees.message;
        connexionErreur.style.display = "block";
        return;
    }

    localStorage.setItem("token",donnees.token);
    connexionErreur.style.display = "none";

    
    formConnexion.reset();
    sectionConnexion.style.display = "none";

    alert("connecté avec succès !");
    chargerJeux();

});

if (localStorage.getItem("token")) {
    chargerJeux
}

const boutonOuvrirInscription = document.getElementById("btn-ouvrir-inscription");
const sectionInscription = document.getElementById("section-inscription");

boutonOuvrirInscription.addEventListener("click", () => {
    sectionInscription.style.display = sectionConnexion.style.display === "none" ? "block" : "none";
});

const formInscription = document.getElementById("inscription-form");
const inscriptionErreur = document.getElementById("inscription-erreur");

formInscription.addEventListener("submit", async (event) => {

   event.preventDefault();
    const email = document.getElementById("inscription-email").value;
    const motDePasse = document.getElementById("inscription-motDePasse").value;

    const reponse = await fetch(`${API_URL}/connexion`, {
        method: "POST",
        headers: {"content-Type": "application/json"},
        body: JSON.stringify({ email, motDePasse})
    });

    const donnees = await reponse.json();
    if(!reponse.ok) {
        connexionErreur.textContent = donnees.message;
        connexionErreur.style.display = "block";
        return;
    }
    formInscription.reset();
    alert ("compte créé ! Tu peux maintenant te connecter.");
    sectionInscription.style.display = "none";
  
});