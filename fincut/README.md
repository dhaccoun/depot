# Fincut — pont `C:\fincut` → agent cloud

## Pourquoi l’agent ne voit pas `C:\fincut`

L’agent tourne sur une **VM Linux distante**. Il n’a **pas** accès à votre disque Windows (`C:\`), ni à votre session OneDrive locale.

## Comment charger les fichiers (1 clic)

Sur votre PC Windows, dans ce dossier du dépôt :

```powershell
powershell -ExecutionPolicy Bypass -File .\SYNC-FROM-WINDOWS.ps1
```

Le script :
1. Lit `C:\fincut` (puis OneDrive\fincut si besoin)
2. Copie vers `fincut\inbox\` (local)
3. Crée un ZIP sur le Bureau : `fincut-YYYYMMDD-HHMMSS.zip`
4. **Ne pousse rien** sur GitHub (dépôt public)

Puis **glissez le ZIP** dans le chat de l’agent :  
https://cursor.com/agents/bc-92c6019c-00ef-4712-9842-00c19fffa158

## Alternatives

- **Glisser-déposer** : sélectionnez les fichiers de `C:\fincut` et déposez-les dans le chat
- **Lien OneDrive** : clic droit sur `C:\fincut` (s’il est synchronisé OneDrive) → Partager → collez le lien ici

## Déjà dans le workspace

| Fichier | Rôle |
|---|---|
| `Fincut_Reponse_SAV_David_Haccoun.docx` | Réponse SAV + formulaire de rétractation |
| `Fincut_Reponse_SAV_David_Haccoun.pdf` | Même contenu en PDF |
| `inbox/` | Contenu de `C:\fincut` (après sync — non versionné) |

**Sécurité :** ne committez jamais factures / pièces d’identité sur ce dépôt GitHub public.
