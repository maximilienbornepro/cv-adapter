---
name: deploy
description: Deployer l'application en production via deploy-remote.sh
invocation: user
---

# Deploiement en production

## REGLE ABSOLUE

**Toujours utiliser `./deploy-remote.sh` depuis la machine locale.**
Ne JAMAIS se connecter en SSH pour deployer manuellement.
Ne JAMAIS executer `deploy.sh` directement - c'est le script cote serveur, appele automatiquement par `deploy-remote.sh`.

## Commandes disponibles

| Commande | Usage |
|----------|-------|
| `./deploy-remote.sh deploy` | Deploiement complet (tests + backup + build Docker + restart) |
| `./deploy-remote.sh quick` | Deploiement rapide (tests + pull + restart, sans rebuild Docker) |
| `./deploy-remote.sh restart` | Redemarrer les services distants |
| `./deploy-remote.sh logs` | Voir les logs distants |
| `./deploy-remote.sh status` | Etat des services distants |
| `./deploy-remote.sh backup` | Backup de la base distante |

## Workflow de deploiement

1. **Verifier** que tous les tests passent localement (`npm test`)
2. **Commiter et pusher** les changements sur origin
3. **Executer** `./deploy-remote.sh deploy` (ou `quick` si pas de changement Docker)
4. **Verifier** les logs apres deploiement : `./deploy-remote.sh logs`
5. **Verifier** le statut : `./deploy-remote.sh status`

## Quand utiliser `deploy` vs `quick`

- **`deploy`** : Changements dans `Dockerfile.prod`, `docker-compose.prod.yml`, `package.json` (nouvelles deps), ou `nginx.conf`
- **`quick`** : Changements de code uniquement (TypeScript, CSS, HTML)

## Pre-requis

- Fichier `.deploy.env` configure (copier `.deploy.env.example`)
- Acces SSH au serveur
- Git initialise sur le serveur distant (origin pointe vers le repo)

## Depannage

### `Permission denied` sur deploy.sh
```bash
ssh <user>@<host> "chmod +x /path/to/deploy.sh"
```

### Container qui redémarre en boucle
```bash
./deploy-remote.sh logs
```
Verifier les erreurs dans les logs du container concerne.

### `not a git repository` sur le serveur
```bash
ssh <user>@<host> "cd /path/to/app && git init && git remote add origin <repo-url> && git fetch origin main && git reset --hard origin/main"
```

## Ce que fait deploy-remote.sh

1. Execute `npm test` en local (bloquant si echec)
2. Se connecte en SSH au serveur
3. Execute `deploy.sh` sur le serveur qui :
   - Backup la base de donnees
   - `git pull origin main`
   - Rebuild les images Docker si necessaire
   - Restart les containers
   - Healthcheck des services
