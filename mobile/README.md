# CampusConnect AI — Application Mobile React Native

Application mobile intelligente développée en **React Native / Expo** pour centraliser les services académiques et la vie étudiante avec intelligence artificielle.

---

## 🚀 Fonctionnalités Implémentées

### 1. 🎨 Identité Visuelle & Charte Graphique
- **Logo officiel** : reproduction fidèle avec chapeau de diplômé, circuit imprimé IA et anneau orbital électrique.
- **Palette académique & high-tech** :
  - Bleu Marine Académique (`#1E3A8A`)
  - Bleu Électrique (`#3B82F6`)
  - Or doux & Ambre (`#F59E0B`)
  - Ardoise / Nuit (`#0F172A`, `#172554`)
  - Blanc cassé & Cartes ombrées (`#F8FAFC`, `#FFFFFF`)

### 2. 🔐 Authentification & Commutateur de Rôles Démo
- **Connexion** : email + mot de passe sécurisé via JWT Bearer token FastAPI.
- **Inscription** : prénom, nom, email universitaire, mot de passe, sélection de classe (L3 Informatique, M1 Génie Logiciel).
- **Accès Démo 1-Clic** :
  - 🎓 **Étudiant** : `etudiant@campusconnect.dev` / `StudentDemo123!` (Alexandre Dubois)
  - 👨‍🏫 **Enseignant** : `enseignant@campusconnect.dev` / `TeacherDemo123!` (Prof. Jean-Marc Lecoq)
  - 🛡️ **Administration** : `admin@campusconnect.dev` / `AdminDemo123!` (Stéphane Duchêne)

### 3. 📊 Tableau de Bord Étudiant (Accueil)
- Salutation personnalisée et statut des cours.
- Métriques académiques : Moyenne générale (14,8/20), Présence (96.2%), Crédits ECTS (14/30).
- **Prochain cours en temps réel** : compte à rebours ("Dans 25 min"), amphi/salle, professeur, support pré-analysé par l'IA.
- **Alerte Correspondance IA Prioritaire** : notification immédiate avec score de fiabilité (ex: 88%) et boutons d'action rapide.
- Grille d'actions rapides (déclaration d'absence, objet perdu, assistant IA, devoirs).

### 4. 📅 Emploi du Temps Intelligent
- Sélecteur de jours de la semaine (Lun - Sam).
- Séances horodatées (CM, TD, TP), salles et enseignants.
- **Détection des changements par l'IA** : badge orange de modification de salle (ex: cours de Compilation déplacé en Salle B2).
- Bouton de signalement d'absence direct depuis une séance.

### 5. 📝 Devoirs et Examens
- Onglet dédié basculant entre **Devoirs à rendre** et **Sessions d'Examens**.
- Alertes d'échéances ("Demain 23:59"), coefficients, salles d'examen.
- **Planificateur de révisions IA** : suggestion automatique de sessions de révision basée sur l'échéance.
- Dépôt de devoir simulé.

### 6. 🔍 Objets Perdus & Trouvés + Système de Correspondance IA (Fonctionnalité Phare)
- Déclaration intuitive : objet perdu ou trouvé, catégorie, couleur, localisation précise, photo, description.
- **Moteur de similarité sémantique & spatiale** :
  - Rapprochement automatique des objets déclarés.
  - Calcul d'un score de similarité (ex: 88% de correspondance).
  - Comparaison côte à côte des deux signalements.
  - Boutons de validation : *« C'est le mien ! »* (confirme et génère les instructions de restitution) ou *« Rejeter »*.

### 7. 🏥 Démarches Administratives / Déclaration d'Absence
- Sélection du cours concerné dans l'emploi du temps.
- **Assistant IA de rédaction** : génère automatiquement une lettre d'excuse formelle et administrative avec les mentions requises.
- Upload de justificatif médical (PDF/JPG).
- Suivi du statut en temps réel (*En attente*, *Acceptée*, *Refusée*) avec commentaire de l'administration.

### 8. 🤖 Assistant Conversationnel IA CampusConnect
- Chat interactif connecté à l'endpoint FastAPI `/assistant/question`.
- Réponses précises basées sur les données officielles de l'université.
- Suggestions rapides en un clic :
  - *« Quand est mon prochain cours ? »*
  - *« Quels devoirs dois-je rendre ? »*
  - *« Y a-t-il une alerte pour mon objet perdu ? »*
  - *« Comment déclarer une absence ? »*

### 9. 💬 Messagerie & Groupes
- Canaux de groupe de promotion (L3 Informatique) et conversations individuelles (enseignant référent).
- Envoi et réception de messages synchronisés avec le backend FastAPI `/conversations`.

### 10. 🔔 Centre de Notifications
- Alertes prioritaires (changement de salle, correspondance IA d'objet, note disponible).
- Marquage individuel ou groupé (*« Tout marquer comme lu »*).

### 11. 🛡️ Console d'Administration & Supervision
- Métriques globales : utilisateurs actifs, absences en attente, objets trouvés, précision du moteur IA.
- Validation des justificatifs administratifs et modération.

---

## 🛠️ Démarrage Rapide

### 1. Lancer le Backend FastAPI
Dans un terminal PowerShell :
```powershell
cd C:\CampusConnect-AI\backend
python -m uvicorn app.main:app --reload --port 8000
```
*Vérifiez sur http://localhost:8000/docs que l'API est active.*

### 2. Lancer l'Application Mobile React Native
Dans un second terminal PowerShell :
```powershell
cd C:\CampusConnect-AI\mobile
npx expo start
```

- **Aperçu dans le navigateur Web** : appuyez sur `w` ou lancez `npx expo start --web`.
- **Sur smartphone physique** : scannez le QR code avec l'application **Expo Go** (Android ou iOS).
- **Sur émulateur Android** : appuyez sur `a`.
