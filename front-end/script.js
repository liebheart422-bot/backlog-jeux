// ============================================
// CONFIGURATION
// ============================================

// CORRECTION : l'adresse ne doit PAS se terminer par "/jeux" — chaque appel
// plus bas ajoute déjà la route précise (/jeux, /connexion, /inscription...).
// Avec "/jeux" laissé ici, toutes les requêtes partaient vers de mauvaises
// adresses (ex: .../jeux/connexion au lieu de .../connexion). Le serveur
// répondait alors avec une erreur HTML (pas du JSON), et reponse.json()
// plantait silencieusement -> c'était la cause principale des formulaires
// de connexion/inscription qui ne faisaient rien.
const API_URL = "https://backlog-jeux.onrender.com";

console.log("js connecté");

// CORRECTION : chargerBlague() (test de la Phase 2, plus utile) supprimée —
// elle s'exécutait à chaque chargement de page pour rien.

// ============================================
// ÉTAT DE CONNEXION (affiche le profil au lieu des boutons)
// ============================================

function mettreAJourEtatConnexion() {
    const token = localStorage.getItem("token");
    const boutonsAuth = document.getElementById("nav-auth-boutons");
    const profil = document.getElementById("nav-profil");
    if (boutonsAuth && profil) {
        boutonsAuth.style.display = token ? "none" : "flex";
        profil.style.display = token ? "flex" : "none";
    }
}

document.getElementById("btn-deconnexion")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    mettreAJourEtatConnexion();
    document.getElementById("table-jeux").innerHTML = "";
});

// ============================================
// POPUP CONNEXION / INSCRIPTION (ouvrir / fermer)
// ============================================

function ouvrirModal(section) { section.classList.add("actif"); }
function fermerModal(section) { section.classList.remove("actif"); }

// ============================================
// INDICATEUR DE CHARGEMENT SUR LES BOUTONS
// ============================================

// NOUVEAU : le service Render gratuit s'endort après inactivité et peut
// mettre jusqu'à 50-60 secondes à répondre à la première requête après une
// pause. Sans indicateur, le bouton a juste l'air mort pendant ce temps —
// c'est exactement ce qui a fait croire à tes amis que le site ne marchait
// pas, alors que le serveur finissait par répondre.
function demarrerChargement(bouton, texteChargement) {
    bouton.dataset.texteOriginal = bouton.textContent;
    bouton.textContent = texteChargement;
    bouton.disabled = true;
}

function arreterChargement(bouton) {
    bouton.textContent = bouton.dataset.texteOriginal || bouton.textContent;
    bouton.disabled = false;
}

// ============================================
// FORMULAIRE "AJOUTER UN JEU"
// ============================================

const form = document.getElementById("add-game-form");
const erreur = document.getElementById("erreur");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const titre = document.getElementById("titre").value;
    const note = document.getElementById("note").value;

    if (titre.trim() === "") {
        erreur.textContent = "Le titre est obligatoire.";
        erreur.style.display = "block";
        return;
    }
    if (note !== "" && (note < 0 || note > 10)) {
        erreur.textContent = "La note doit être entre 0 et 10.";
        erreur.style.display = "block";
        return;
    }

    const token = localStorage.getItem("token");
    const boutonEnregistrer = form.querySelector('button[type="submit"]');

    // NOUVEAU : le bouton affiche "Enregistrement..." et se désactive
    // pendant l'envoi, pour qu'on sache que quelque chose se passe même si
    // le serveur met du temps à répondre (cold start Render).
    demarrerChargement(boutonEnregistrer, "Enregistrement...");

    // CORRECTION : ajout d'un try/catch — vu ta connexion instable, si le
    // réseau coupe pendant l'envoi, on affiche un message clair au lieu que
    // la page reste bloquée sans rien dire (c'est ce qui s'est passé avant).
    try {
        const reponse = await fetch(`${API_URL}/jeux`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                titre: titre,
                // CORRECTION : le champ plateforme a un id fiable maintenant,
                // plus besoin du sélecteur fragile (querySelectorAll + espace
                // en trop dans le sélecteur CSS) qu'il y avait avant.
                plateforme: document.getElementById("plateforme").value,
                // CORRECTION : le <select> a maintenant id="statut" ; avant,
                // querySelectorAll(...).value renvoyait undefined (une liste
                // n'a pas de .value) -> c'était la cause du statut "undefined".
                statut: document.getElementById("statut").value,
                note: note
            })
        });

        if (reponse.ok) {
            erreur.style.display = "none";
            await chargerJeux();
            form.reset();
        } else {
            const donneesErreur = await reponse.json();
            // CORRECTION : "messahe" -> "message" (faute de frappe qui empêchait
            // d'afficher le vrai message d'erreur renvoyé par le serveur)
            erreur.textContent = donneesErreur.message || "Erreur lors de l'ajout du jeu";
            erreur.style.display = "block";
        }
    } catch (erreurReseau) {
        erreur.textContent = "Impossible de contacter le serveur. Vérifie ta connexion.";
        erreur.style.display = "block";
    } finally {
        arreterChargement(boutonEnregistrer);
    }
    // CORRECTION : l'ancien alert("jeu ajouté") était placé hors du if/else,
    // donc il s'affichait même en cas d'échec. Supprimé — chargerJeux() qui
    // rafraîchit le tableau + le message d'erreur suffisent comme retour.
});

// ============================================
// FILTRE "AFFICHER SEULEMENT LES JEUX TERMINÉS"
// ============================================

const butonFiltre = document.getElementById("filtre-termine");
let filtreActif = false;

butonFiltre.addEventListener("click", () => {
    const lignes = document.querySelectorAll("#table-jeux tr");
    filtreActif = !filtreActif;
    lignes.forEach((ligne) => {
        // CORRECTION : la cellule de statut contient un <select> (menu
        // déroulant), donc lire son .textContent renvoyait le texte de
        // TOUTES les options collées ("À jouerEn coursTerminé..."), jamais
        // juste la valeur choisie. On lit maintenant la vraie valeur du
        // <select> directement.
        const selectStatut = ligne.querySelector(".statut-select");
        const statut = selectStatut ? selectStatut.value : "";
        if (filtreActif && statut !== "terminé") {
            ligne.style.display = "none";
        } else {
            ligne.style.display = "";
        }
    });
    butonFiltre.textContent = filtreActif
        ? "Afficher tous les jeux"
        : "Afficher seulement les jeux Terminés";
});

// ============================================
// CHARGER ET AFFICHER LES JEUX
// ============================================

async function chargerJeux() {
    const token = localStorage.getItem("token");

    if (!token) {
        console.log("Pas encore connecté — impossible de charger les jeux");
        return;
    }

    // CORRECTION : "recherche-jeux" correspond maintenant à l'id du champ
    // dans index.html (avant : id="recherche-jeu" côté HTML -> null ici)
    const recherche = document.getElementById("recherche-jeux").value;
    // CORRECTION : "tir-jeux" -> "tri-jeux" (faute de frappe -> null -> crash)
    const tri = document.getElementById("tri-jeux").value;

    try {
        // CORRECTION : il manquait le "=" entre "tri" et "${tri}"
        // (avant : "&tri${tri}" -> après : "&tri=${tri}")
        const reponse = await fetch(
            `${API_URL}/jeux?recherche=${encodeURIComponent(recherche)}&tri=${encodeURIComponent(tri)}`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );

        const donnees = await reponse.json();
        console.log("Jeux reçus :", donnees);

        const tableJeux = document.getElementById("table-jeux");
        tableJeux.innerHTML = "";

        // CORRECTION : les 4 chiffres du dashboard étaient codés en dur dans
        // le HTML et ne bougeaient jamais. On les recalcule à chaque chargement.
        const compteurs = { "a jouer": 0, "en cours": 0, "terminé": 0, "abandonné": 0 };

        (donnees.jeux || []).forEach((jeu) => {
            if (compteurs[jeu.statut] !== undefined) compteurs[jeu.statut]++;

            const ligne = document.createElement("tr");
            // CORRECTION : les <td> n'étaient pas fermés correctement
            // (<td>...<td> au lieu de <td>...</td>)
            ligne.innerHTML = `
                <td>${jeu.titre}</td>
                <td>
                    <select data-id="${jeu._id}" class="statut-select">
                        <option value="a jouer" ${jeu.statut === "a jouer" ? "selected" : ""}>À jouer</option>
                        <option value="en cours" ${jeu.statut === "en cours" ? "selected" : ""}>En cours</option>
                        <option value="terminé" ${jeu.statut === "terminé" ? "selected" : ""}>Terminé</option>
                        <option value="abandonné" ${jeu.statut === "abandonné" ? "selected" : ""}>Abandonné</option>
                    </select>
                </td>
                <td>${jeu.note !== undefined && jeu.note !== null && jeu.note !== "" ? jeu.note + "/10" : "—"}</td>
            `;
            tableJeux.appendChild(ligne);
        });

        const majCompteur = (id, valeur) => {
            const el = document.getElementById(id);
            if (el) el.textContent = valeur;
        };
        majCompteur("stat-a-jouer", compteurs["a jouer"]);
        majCompteur("stat-en-cours", compteurs["en cours"]);
        majCompteur("stat-termine", compteurs["terminé"]);
        majCompteur("stat-abandonne", compteurs["abandonné"]);

        // Un écouteur par <select> de statut ; comme tableJeux.innerHTML = ""
        // détruit les anciennes lignes (et leurs écouteurs) à chaque appel,
        // il n'y a pas d'accumulation ici.
        document.querySelectorAll(".statut-select").forEach((select) => {
            select.addEventListener("change", async (event) => {
                const idJeu = event.target.dataset.id;
                const nouveauStatut = event.target.value;
                const tokenActuel = localStorage.getItem("token");

                try {
                    // CORRECTION : ça appelait "/connexion" au lieu de la vraie
                    // route de modification "/jeux/:id" — le changement de
                    // statut n'était donc jamais réellement sauvegardé.
                    await fetch(`${API_URL}/jeux/${idJeu}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${tokenActuel}`
                        },
                        body: JSON.stringify({ statut: nouveauStatut })
                    });
                    await chargerJeux(); // recharge pour mettre à jour les compteurs
                } catch (erreurReseau) {
                    console.log("Erreur réseau lors du changement de statut :", erreurReseau);
                }
            });
        });

    } catch (erreurReseau) {
        console.log("Impossible de charger les jeux :", erreurReseau);
    }
}

// CORRECTION : ces 2 lignes étaient À L'INTÉRIEUR de chargerJeux() — donc à
// chaque appel, 2 NOUVEAUX écouteurs s'ajoutaient par-dessus les précédents,
// sans jamais nettoyer les anciens. Elles ne doivent s'exécuter qu'une fois,
// donc elles sont maintenant en dehors de la fonction.
document.getElementById("recherche-jeux").addEventListener("input", chargerJeux);
document.getElementById("tri-jeux").addEventListener("change", chargerJeux);

// ============================================
// CONNEXION
// ============================================

const formConnexion = document.getElementById("connexion-form");
const connexionErreur = document.getElementById("connexion-erreur");
const buttonOuvrirConnexion = document.getElementById("btn-ouvrir-connexion");
const sectionConnexion = document.getElementById("section-connexion");

buttonOuvrirConnexion.addEventListener("click", () => ouvrirModal(sectionConnexion));

// Fermer via le bouton "x" ou un clic en dehors de la carte
sectionConnexion.querySelector(".fermer")?.addEventListener("click", () => fermerModal(sectionConnexion));
sectionConnexion.addEventListener("click", (event) => {
    if (event.target === sectionConnexion) fermerModal(sectionConnexion);
});

formConnexion.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("connexion-email").value;
    const motDePasse = document.getElementById("connexion-motDePasse").value;
    const boutonConnexion = formConnexion.querySelector('button[type="submit"]');

    // NOUVEAU : "Connexion..." + bouton désactivé pendant l'attente
    demarrerChargement(boutonConnexion, "Connexion...");

    try {
        const reponse = await fetch(`${API_URL}/connexion`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, motDePasse })
        });

        const donnees = await reponse.json();

        if (!reponse.ok) {
            connexionErreur.textContent = donnees.message;
            connexionErreur.style.display = "block";
            return;
        }

        localStorage.setItem("token", donnees.token);
        connexionErreur.style.display = "none";
        formConnexion.reset();
        fermerModal(sectionConnexion);
        mettreAJourEtatConnexion(); // affiche le profil au lieu des boutons
        chargerJeux();

    } catch (erreurReseau) {
        connexionErreur.textContent = "Impossible de contacter le serveur. Vérifie ta connexion.";
        connexionErreur.style.display = "block";
    } finally {
        arreterChargement(boutonConnexion);
    }
});

// CORRECTION : "chargerJeux" sans parenthèses ne l'exécutait pas (ça référence
// juste la fonction sans l'appeler). Ajout de "()".
if (localStorage.getItem("token")) {
    chargerJeux();
}
mettreAJourEtatConnexion(); // vérifie l'état dès le chargement de la page

// ============================================
// INSCRIPTION
// ============================================

const boutonOuvrirInscription = document.getElementById("btn-ouvrir-inscription");
const sectionInscription = document.getElementById("section-inscription");

boutonOuvrirInscription.addEventListener("click", () => ouvrirModal(sectionInscription));

sectionInscription.querySelector(".fermer")?.addEventListener("click", () => fermerModal(sectionInscription));
sectionInscription.addEventListener("click", (event) => {
    if (event.target === sectionInscription) fermerModal(sectionInscription);
});

// CORRECTION : l'id du formulaire dans index.html était "inscriptionion-form"
// (faute de frappe), alors que cette ligne cherchait "inscription-form".
// formInscription valait donc "null", et la ligne juste en dessous
// (formInscription.addEventListener(...)) faisait planter TOUT LE SCRIPT à
// cet endroit -> rien de ce qui était écrit après dans le fichier ne
// s'exécutait jamais, quels que soient les correctifs ajoutés plus bas.
// C'était la cause principale de "rien ne change".
const formInscription = document.getElementById("inscription-form");
const inscriptionErreur = document.getElementById("inscription-erreur");

formInscription.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("inscription-email").value;
    const motDePasse = document.getElementById("inscription-motDePasse").value;
    const boutonInscription = formInscription.querySelector('button[type="submit"]');

    // NOUVEAU : "Inscription..." + bouton désactivé pendant l'attente
    demarrerChargement(boutonInscription, "Inscription...");

    try {
        // CORRECTION : appelait "/connexion" au lieu de "/inscription"
        const reponse = await fetch(`${API_URL}/inscription`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, motDePasse })
        });

        const donnees = await reponse.json();

        if (!reponse.ok) {
            // CORRECTION : utilisait "connexionErreur" au lieu de
            // "inscriptionErreur" -> le message s'affichait au mauvais
            // endroit (invisible, car dans le panneau de connexion fermé)
            inscriptionErreur.textContent = donnees.message;
            inscriptionErreur.style.display = "block";
            return;
        }

        // NOUVEAU : le serveur renvoie maintenant un token dès l'inscription
        // -> on connecte directement la personne, sans lui faire retaper ses
        // identifiants dans un 2e formulaire juste après.
        localStorage.setItem("token", donnees.token);
        inscriptionErreur.style.display = "none";
        formInscription.reset();
        fermerModal(sectionInscription);
        mettreAJourEtatConnexion(); // bascule direct sur le profil
        chargerJeux();

    } catch (erreurReseau) {
        inscriptionErreur.textContent = "Impossible de contacter le serveur. Vérifie ta connexion.";
        inscriptionErreur.style.display = "block";
    } finally {
        arreterChargement(boutonInscription);
    }
});
