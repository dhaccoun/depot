# Iberia litige — documents (David HACCONN)

## Problème d’accès cloud

Le chemin Windows `C:\Users\dhacc\OneDrive\Documents\iberia litige` n’est **pas** visible depuis l’agent cloud Cursor (VM Linux distante, sans montage de votre disque ni session OneDrive authentifiée).

## Solution mise en place

1. **Bureau distant de l’agent** : page de connexion OneDrive ouverte pour `dhaccoun@gmail.com`. Une fois connecté dans la session agent, les fichiers peuvent être téléchargés ici.
2. **Sync local en 1 clic** (recommandé) : sur votre PC Windows, dans ce dossier du dépôt, exécutez :

```powershell
powershell -ExecutionPolicy Bypass -File .\SYNC-FROM-ONEDRIVE.ps1
```

Le script copie `OneDrive\Documents\iberia litige` vers `iberia-litige/inbox`, crée une archive zip, commit et push sur `cursor/iberia-litige-sync-0d8a`.

## Structure attendue

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
| `inbox` | Copie brute OneDrive (via script) |

## Références dossier

- Vol : Iberia **IB1213**, Madrid → Nice, **15 juillet 2026 ~18:00**
- Titulaire : David HACCOUN — `dhaccoun@gmail.com` — +1 305-794-1707
- Carte : Citi®/AAdvantage® Executive World Elite Mastercard (…6650)
- Plainte Nice : UUID `a084366a-844a-11f1-a928-ab9caa028c80`
