# Backend Django - Flotte Automobile

Ce backend est construit avec **Django** + **Django REST Framework** + **PostgreSQL** + **JWT Authentication**.

---

## 🚀 Installation et Démarrage

### 1. Prérequis
- Python 3.10+
- PostgreSQL installé et démarré
- Une base de données `flotte_db` créée

### 2. Créer la base de données PostgreSQL
Ouvrez pgAdmin ou psql et exécutez :
```sql
CREATE DATABASE flotte_db;
```

### 3. Créer et activer l'environnement virtuel
```bash
cd d:\flotte-web-app\backend_django
python -m venv venv
.\venv\Scripts\activate
```

### 4. Installer les dépendances
```bash
pip install -r requirements.txt
```

### 5. Configurer le fichier `.env`
Modifiez le fichier `.env` avec vos identifiants PostgreSQL :
```
SECRET_KEY=votre-clé-secrète
DEBUG=True
DB_NAME=flotte_db
DB_USER=postgres
DB_PASSWORD=VOTRE_MOT_DE_PASSE
DB_HOST=localhost
DB_PORT=5432
```

### 6. Appliquer les migrations
```bash
python manage.py migrate
```

### 7. Créer un superutilisateur (admin)
```bash
python manage.py createsuperuser
```

### 8. Lancer le serveur
```bash
python manage.py runserver
```

---

## 📚 Endpoints API

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/auth/token/` | Connexion (obtenir JWT) |
| POST | `/api/auth/token/refresh/` | Rafraîchir le token JWT |
| GET/POST | `/api/users/` | Liste / Créer utilisateurs |
| GET | `/api/users/me/` | Profil de l'utilisateur connecté |
| GET/POST | `/api/vehicules/` | Liste / Créer véhicules |
| GET/PUT/DELETE | `/api/vehicules/{id}/` | Détail / Modifier / Supprimer |
| GET/POST | `/api/chauffeurs/` | Liste / Créer chauffeurs |
| GET/PUT/DELETE | `/api/chauffeurs/{id}/` | Détail / Modifier / Supprimer |
| GET/POST | `/api/missions/` | Liste / Créer missions |
| GET/PUT/DELETE | `/api/missions/{id}/` | Détail / Modifier / Supprimer |
| GET/POST | `/api/carburants/` | Liste / Créer enregistrements carburant |
| GET/PUT/DELETE | `/api/carburants/{id}/` | Détail / Modifier / Supprimer |
| GET/POST | `/api/maintenances/` | Liste / Créer maintenances |
| GET/PUT/DELETE | `/api/maintenances/{id}/` | Détail / Modifier / Supprimer |
| GET | `/api/dashboard/stats/` | Statistiques du dashboard |
| GET | `/api/docs/` | Documentation Swagger UI |
| GET | `/admin/` | Interface d'administration Django |

### Paramètres de filtrage / recherche / pagination

Tous les endpoints de liste supportent :
- `?search=terme` — Recherche textuelle
- `?ordering=champ` — Tri (préfixe `-` pour ordre décroissant)
- `?page=2` — Pagination (10 éléments par page)

Filtres spécifiques :
- Véhicules : `?etat=disponible` `?marque=Toyota`
- Missions : `?statut=en_cours` `?vehicule_id=1` `?chauffeur_id=2`
- Carburant : `?vehicule_id=1` `?date_from=2024-01-01` `?date_to=2024-12-31`
- Maintenance : `?vehicule_id=1` `?date_from=2024-01-01` `?date_to=2024-12-31`

---

## 🔐 Authentification JWT

1. **Connexion** : `POST /api/auth/token/` avec `{"username": "...", "password": "..."}`
2. La réponse contient `access` et `refresh` tokens.
3. Pour chaque requête protégée, ajouter le header : `Authorization: Bearer <access_token>`
