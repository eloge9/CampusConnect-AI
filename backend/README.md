# CampusConnect AI — Backend

API backend du projet CampusConnect AI (hackathon). Ce document explique comment installer, lancer et utiliser l'API pour les équipes frontend web et mobile.

## Stack technique

- **Python 3.11+** / **FastAPI**
- **PostgreSQL** + **SQLAlchemy** (ORM) + **Alembic** (migrations)
- **JWT** (Bearer token) pour l'authentification
- **Pydantic** pour la validation des données

## 1. Installation

### Prérequis
- Python 3.11 ou supérieur
- PostgreSQL installé et démarré (service actif)

### Étapes

```bash
# 1. Se placer dans le dossier backend
cd backend

# 2. Créer et activer l'environnement virtuel
python -m venv .venv
.venv\Scripts\Activate.ps1        # PowerShell (Windows)
# source .venv/Scripts/activate   # Git Bash / macOS / Linux

# 3. Installer les dépendances
pip install -r requirements.txt
```

### Base de données PostgreSQL

Créer une base et un utilisateur dédiés (à exécuter une fois, connecté en tant que superutilisateur `postgres`) :

```sql
CREATE DATABASE campusconnect;
CREATE USER campusconnect_user WITH PASSWORD 'choisissez_un_mot_de_passe';
ALTER DATABASE campusconnect OWNER TO campusconnect_user;
GRANT ALL PRIVILEGES ON DATABASE campusconnect TO campusconnect_user;
\c campusconnect
ALTER SCHEMA public OWNER TO campusconnect_user;
GRANT ALL ON SCHEMA public TO campusconnect_user;
```

### Configuration

Copier `.env.example` vers `.env` et renseigner vos propres valeurs :

```bash
cp .env.example .env
```

Variables importantes :

| Variable | Description |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL (`postgresql+psycopg2://user:password@host:5432/dbname`) |
| `JWT_SECRET_KEY` | Secret pour signer les tokens JWT — générer une valeur aléatoire (ex: `python -c "import secrets; print(secrets.token_hex(32))"`), **ne jamais commiter la vraie valeur** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durée de validité d'un token (défaut : 60 min) |
| `CORS_ALLOWED_ORIGINS` | `*` en développement, ou une liste d'origines séparées par des virgules en production (ex: l'URL de l'app web) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (+ TEACHER/STUDENT) | Identifiants des comptes de démonstration créés par le script de seed |

### Appliquer les migrations

```bash
alembic upgrade head
```

### Créer les comptes de démonstration

```bash
python -m app.seed
```

Crée 3 comptes (voir section [Comptes de démonstration](#comptes-de-démonstration)). Cette commande est idempotente : la relancer ne crée pas de doublons.

### Lancer le serveur

```bash
uvicorn app.main:app --reload
```

L'API est disponible sur **http://localhost:8000**.

## 2. Documentation interactive de l'API

Toute la documentation détaillée des endpoints (paramètres, schémas, réponses possibles) est générée automatiquement et **toujours à jour** :

- **http://localhost:8000/docs** — interface Swagger (recommandée, permet de tester chaque endpoint directement)
- **http://localhost:8000/redoc** — documentation en lecture seule, plus lisible pour une vue d'ensemble
- **http://localhost:8000/openapi.json** — schéma OpenAPI brut (utilisable pour générer un client TypeScript/Dart automatiquement, voir section 6)

**Comment tester un endpoint protégé dans `/docs` :**
1. Appeler `POST /auth/connexion` via "Try it out" avec `{"email": "...", "password": "..."}`
2. Copier la valeur d'`access_token` dans la réponse
3. Cliquer sur le cadenas **Authorize** en haut de la page, coller le token dans le champ **Value** (sans le préfixe `Bearer`, Swagger l'ajoute automatiquement)
4. Toutes les routes protégées fonctionnent ensuite depuis l'interface

## 3. Authentification (pour le frontend/mobile)

Toutes les routes protégées attendent un header :

```
Authorization: Bearer <access_token>
```

| Route | Méthode | Description |
|---|---|---|
| `/auth/inscription` | POST | Créer un compte (toujours rôle `STUDENT` — voir note ci-dessous) |
| `/auth/connexion` | POST | `{"email": "...", "password": "..."}` → retourne `{"access_token": "...", "token_type": "bearer"}` |
| `/auth/moi` | GET | Profil de l'utilisateur connecté |
| `/auth/changer-mot-de-passe` | POST | `{"current_password": "...", "new_password": "..."}` |

**Notes importantes :**
- `/auth/inscription` crée toujours un compte `STUDENT`. Il n'existe pas encore de création de compte TEACHER/ADMIN via l'API (utiliser le script de seed en attendant le module Administration).
- Pas de refresh token pour l'instant : quand le token expire (`ACCESS_TOKEN_EXPIRE_MINUTES`), l'utilisateur doit se reconnecter.
- Le "logout" est purement côté client (supprimer le token stocké) — il n'y a pas d'invalidation serveur du token.

### Comptes de démonstration

Créés par `python -m app.seed` (valeurs par défaut, modifiables dans `.env`) :

| Rôle | Email | Mot de passe |
|---|---|---|
| ADMIN | `admin@campusconnect.dev` | `AdminDemo123!` |
| TEACHER | `enseignant@campusconnect.dev` | `TeacherDemo123!` |
| STUDENT | `etudiant@campusconnect.dev` | `StudentDemo123!` |

## 4. Rôles et permissions

Trois rôles : `STUDENT`, `TEACHER`, `ADMIN`. Les permissions sont définies explicitement par fonctionnalité (pas d'héritage automatique). Résumé général :

- **STUDENT** : lecture seule sur la plupart des ressources, restreint à sa propre classe pour les annonces/emploi du temps
- **TEACHER** : peut créer/gérer du contenu, mais uniquement pour les classes/matières qui lui sont explicitement affectées (`/affectations-enseignants`) — un enseignant ne peut jamais agir sur une classe qu'il n'enseigne pas
- **ADMIN** : accès complet à toutes les ressources et à l'administration de la plateforme

Le détail exact des permissions par endpoint est visible dans `/docs` (chaque route indique les codes de réponse `403` possibles).

## 5. Modules disponibles actuellement

| Module | Préfixe des routes | Statut |
|---|---|---|
| Authentification | `/auth` | ✅ |
| Classes | `/classes` | ✅ |
| Matières | `/matieres` | ✅ |
| Affectations enseignants | `/affectations-enseignants` | ✅ |
| Annonces | `/annonces` | ✅ (filtres `?categorie=`, `?classe_id=`, `?recherche=`) |
| Emploi du temps | `/emploi-du-temps` | ✅ (filtres `?classe_id=`, `?date_seance=`) |
| Devoirs | `/devoirs` | ✅ (filtres `?classe_id=`, `?matiere_id=`, `?a_venir=`) |
| Examens | `/examens` | ✅ (filtres `?classe_id=`, `?matiere_id=`, `?a_venir=`) |
| Absences | `/absences` | ✅ (filtres `?statut=`, `?classe_id=` + upload justificatif via `POST /absences/{id}/justificatif`) |
| Objets perdus/trouvés | `/objets-perdus-trouves` | ✅ (filtres `?type=`, `?statut=`, `?categorie=`, `?recherche=` + upload photo) |
| Correspondance IA | `/correspondances` | ✅ (générée automatiquement à la création d'un objet, voir note IA ci-dessous) |
| Notifications | `/notifications` | ✅ (filtre `?non_lues=true`, `POST /{id}/lire`, `POST /lire-tout` — voir note ci-dessous) |
| Messagerie | `/conversations` | ✅ (1-à-1 pour l'instant, voir note ci-dessous) |
| Assistant IA | `/assistant` | ✅ (`POST /assistant/question`, voir note ci-dessous) |
| Administration | — | ⏳ à venir |

⚠️ Le projet évolue module par module — vérifier `/docs` pour la liste des routes réellement disponibles à un instant donné, ce tableau peut être en retard d'une étape.

## 6. Générer un client typé (optionnel, recommandé)

Plutôt que d'appeler l'API "à la main", vous pouvez générer un client à partir du schéma OpenAPI :

- **Web (TypeScript)** : [`openapi-typescript`](https://www.npmjs.com/package/openapi-typescript) ou [`orval`](https://orval.dev/) sur `http://localhost:8000/openapi.json`
- **Mobile (Dart/Flutter)** : [`openapi-generator`](https://openapi-generator.tech/) avec le générateur `dart-dio`

## 7. Correspondance IA (objets perdus/trouvés)

⚠️ **Ce n'est pas un modèle d'IA entraîné.** À la création d'un objet (perdu ou trouvé), le backend compare automatiquement avec les objets ouverts du type opposé via un algorithme de similarité (texte, catégorie, couleur, lieu, date — voir `app/services/lost_found_ai.py`). Au-dessus d'un seuil, une correspondance est créée avec le statut `PROPOSEE`.

Règle stricte du cahier des charges respectée : **le système ne déclare jamais automatiquement qu'un objet appartient à quelqu'un**. Seul un des deux déclarants (ou un ADMIN) peut faire passer une correspondance à `CONFIRMEE` ou `REJETEE` via `PUT /correspondances/{id}`.

## 8. Fichiers uploadés (justificatifs d'absence, photos d'objets)

`POST /absences/{id}/justificatif` (PDF/JPG/JPEG/PNG) et `POST /objets-perdus-trouves/{id}/photo` (JPG/JPEG/PNG) acceptent un fichier en `multipart/form-data` (champ `file`), 5 Mo max (configurable via `.env`). Le fichier est servi ensuite via l'URL relative renvoyée (`photo_path`/`justificatif_path`, ex: `/uploads/objets/xxx.png`), à préfixer avec l'URL de base de l'API (`http://localhost:8000/uploads/objets/xxx.png`).

## 9. Notifications

Générées automatiquement en base par le backend (pas de notifications push Firebase pour l'instant, uniquement un centre de notifications interne consultable via l'API) :

| Événement | Type | Déclenché par |
|---|---|---|
| Nouvelle annonce | `NOUVELLE_ANNONCE` | Création d'une annonce (ciblée sur la classe, ou tous les étudiants si globale) |
| Séance modifiée/annulée | `CHANGEMENT_SEANCE` | `PUT /emploi-du-temps/{id}` faisant passer le statut à `MODIFIE`/`ANNULE` |
| Nouvel examen | `NOUVEL_EXAMEN` | Création d'un examen |
| Réponse à une absence | `REPONSE_ABSENCE` | Traitement d'une demande d'absence (acceptée/refusée) |
| Correspondance objet perdu/trouvé | `CORRESPONDANCE_OBJET` | Détection automatique d'une correspondance potentielle |

Chaque notification porte `reference_type`/`reference_id` pointant vers la ressource concernée (ex: `"annonce"`/`12`), à utiliser pour rediriger l'utilisateur au clic.

⚠️ Non implémenté : le rappel "devoir proche de la date limite" (demanderait une tâche planifiée récurrente, pas encore d'infrastructure de ce type) et les notifications push mobiles réelles (Firebase/FCM — demanderait des identifiants Firebase non configurés).

## 10. Messagerie

Conversations **1-à-1 uniquement pour l'instant** (schéma prêt pour du groupe plus tard via `is_group`, mais non exposé) :

- `POST /conversations {"user_id": <id>}` — récupère la conversation existante avec cette personne si elle existe déjà (pas de doublon), sinon en crée une.
- `GET /conversations` — les miennes, triées par dernier message, avec `last_message` et `unread_count`.
- `GET /conversations/{id}/messages` — historique complet (pas de pagination pour l'instant).
- `POST /conversations/{id}/messages {"content": "..."}` — envoyer un message (déclenche une notification `NOUVEAU_MESSAGE` aux autres membres).
- `POST /conversations/{id}/lire` — marque la conversation comme lue pour l'utilisateur courant.

⚠️ Seuls les membres d'une conversation peuvent la consulter/y écrire — **l'ADMIN n'a pas d'accès de supervision aux conversations privées** (choix délibéré de respect de la vie privée, non demandé explicitement dans le cahier des charges). Pas de temps réel (WebSocket) : le frontend doit interroger `GET /conversations/{id}/messages` périodiquement.

## 11. Assistant IA

⚠️ **Ce n'est pas non plus un LLM.** `POST /assistant/question` (`{"question": "..."}`) détecte l'intention par mots-clés français (prochain cours, examens, devoirs, absence, objets perdus, annonces) puis construit sa réponse **uniquement à partir des vraies données de la plateforme**, en réutilisant les services déjà existants (aucune duplication de logique) — conforme à l'exigence du cahier des charges de ne jamais fournir d'information inventée.

Réponse : `{"intent": "...", "answer": "texte lisible", "data": [...]}` — `data` contient les objets structurés (séance, examen, devoir, annonce, correspondance...) derrière la réponse, à afficher côté frontend en plus du texte. Si la question n'est pas reconnue (`intent: "inconnu"`), l'assistant le dit honnêtement et liste les sujets qu'il sait traiter plutôt que d'improviser une réponse.

## 12. CORS

Le CORS est activé (`app/main.py`), configurable via `CORS_ALLOWED_ORIGINS` dans `.env`. En développement il est ouvert à toutes les origines (`*`). Pensez à le restreindre à l'URL réelle du frontend avant toute mise en production.

## 13. Erreurs — format standard

Toutes les erreurs suivent le format FastAPI standard :

```json
{ "detail": "Message d'erreur en français" }
```

Sauf les erreurs de validation (422) qui suivent le format Pydantic habituel avec une liste détaillée par champ.

## 14. Tests

```bash
python -m pytest tests/ -v
```

La suite de tests utilise une base SQLite isolée en mémoire — elle ne touche jamais à la base PostgreSQL réelle.
