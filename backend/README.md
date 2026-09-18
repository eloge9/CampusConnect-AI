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
| Absences | — | ⏳ à venir |
| Objets perdus/trouvés + IA | — | ⏳ à venir |
| Notifications | — | ⏳ à venir |
| Messagerie | — | ⏳ à venir |
| Assistant IA | — | ⏳ à venir |

⚠️ Le projet évolue module par module — vérifier `/docs` pour la liste des routes réellement disponibles à un instant donné, ce tableau peut être en retard d'une étape.

## 6. Générer un client typé (optionnel, recommandé)

Plutôt que d'appeler l'API "à la main", vous pouvez générer un client à partir du schéma OpenAPI :

- **Web (TypeScript)** : [`openapi-typescript`](https://www.npmjs.com/package/openapi-typescript) ou [`orval`](https://orval.dev/) sur `http://localhost:8000/openapi.json`
- **Mobile (Dart/Flutter)** : [`openapi-generator`](https://openapi-generator.tech/) avec le générateur `dart-dio`

## 7. CORS

Le CORS est activé (`app/main.py`), configurable via `CORS_ALLOWED_ORIGINS` dans `.env`. En développement il est ouvert à toutes les origines (`*`). Pensez à le restreindre à l'URL réelle du frontend avant toute mise en production.

## 8. Erreurs — format standard

Toutes les erreurs suivent le format FastAPI standard :

```json
{ "detail": "Message d'erreur en français" }
```

Sauf les erreurs de validation (422) qui suivent le format Pydantic habituel avec une liste détaillée par champ.

## 9. Tests

```bash
python -m pytest tests/ -v
```

La suite de tests utilise une base SQLite isolée en mémoire — elle ne touche jamais à la base PostgreSQL réelle.
