console.log("js connecté")
const jeu1 = document.getElementById("jeu1");
jeu1.addEventListener("click", () =>{
    jeu1.style.backgroundColor = "#6c5dd3";
});
const form = document.getElementById("add-game-form");
const erreur = document.getElementById("erreur");
form.addEventListener("submit", (event) => {
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
    erreur.style.display = "none";
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