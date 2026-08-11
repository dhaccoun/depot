# Iberia litige — pont documents → agent cloud

## Pourquoi l’agent ne voit pas votre dossier

L’agent tourne sur une **VM Linux distante**. Il n’a pas votre disque `C:\`, ni votre session OneDrive Windows.

Tentative déjà faite : ouverture de OneDrive web sur le bureau distant → **mur d’authentification Microsoft** (`dhaccoun@gmail.com`). Sans votre mot de passe / code MFA, impossible d’aller plus loin.

## Comment débloquer (au choix)

### Option A — 1 clic sur votre PC (recommandé)
Dans ce dossier du dépôt :

```powershell
powershell -ExecutionPolicy Bypass -File .\SYNC-FROM-ONEDRIVE.ps1
```

Le script lit d’abord `C:\iberia litige` (puis OneDrive\Documents\…), prépare un ZIP sur le Bureau, **sans** le pousser sur GitHub (le dépôt `dhaccoun/depot` est **public**).

Puis glissez le ZIP dans le chat de l’agent :  
https://cursor.com/agents/bc-5128b421-9be3-4c02-b66a-0f295b0d0d8a

### Option B — Connexion sur le bureau distant
La page de login OneDrive est ouverte dans la session agent. Connectez-vous une fois (mot de passe ou code email) ; ensuite l’agent télécharge le dossier.

### Option C — Lien de partage OneDrive
Dans OneDrive Windows : clic droit sur `iberia litige` → Partager → lien « peut voir » → collez le lien dans le chat.

## Structure cible (après réception)

| Dossier | Contenu |
|---|---|
| `01_billet` | Billet / PNR IB1213 MAD–NCE 15/07/2026 |
| `02_paiement_citi` | Preuve paiement carte …6650 / miles AA |
| `03_pir_iberia` | PIR / dossier bagages Iberia |
| `04_plainte_police` | Plainte réf. `a084366a-844a-11f1-a928-ab9caa028c80` + PV |
| `05_inventaire` | Liste objets ~5 900–6 000 € |
| `06_factures` | Justificatifs d’achat |
| `07_correspondance_iberia` | Indemnisation ~1 900 € |
| `08_photos_valise` | Photos fermeture cassée / valise ouverte |
| `inbox` | Copie brute (locale, non poussée) |

## Références dossier

- Vol : Iberia **IB1213**, Madrid → Nice, **15 juillet 2026 ~18:00**
- Titulaire : David HACCOUN — `dhaccoun@gmail.com` — +1 305-794-1707
- Carte : Citi®/AAdvantage® Executive World Elite Mastercard (…6650)
- Plainte Nice : UUID `a084366a-844a-11f1-a928-ab9caa028c80`

**Sécurité :** ne committez jamais PV, factures ou passeports sur ce dépôt GitHub public.
