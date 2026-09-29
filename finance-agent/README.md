# finance-agent

Finances dans le chat Cursor, sans connexion bancaire.

Déposez un export CSV de la banque dans `inbox/`. Le serveur range les opérations dans une base locale et peut résumer le mois (entrées, sorties, catégories).

La page `localhost:8787` « OAuth callback failed / access_denied » ne sert pas ici. Ne la rouvrez pas sur le bureau virtuel de l’agent, et n’y saisissez pas d’identifiants.

## Démarrage

Node.js 22+.

```bash
cd finance-agent
npm install
```

Dans Cursor, le fichier `.cursor/mcp.json` à la racine du dépôt lance déjà le serveur.

1. Depuis le site de la banque, exportez les opérations en CSV.
2. Copiez le fichier dans `finance-agent/inbox/`.
3. Dans le chat : « importe le relevé et résume septembre ».

Formats reconnus : séparateur `;` ou `,`, dates `JJ/MM/AAAA` ou `AAAA-MM-JJ`, colonnes Date + Libellé + Débit/Crédit, ou Date + Libellé + Montant. Un exemple est dans `exemples/releve-exemple.csv`.

Les CSV déposés dans `inbox/` ne sont pas versionnés.

## Outils

- `import_statement` — importe un CSV ou tout le dossier `inbox/`
- `list_statements` — relevés déjà importés
- `list_imported_transactions` — opérations
- `summarize_imported` — entrées, sorties, catégories
- `list_goals` / `upsert_goal` — objectifs
- `list_plan_notes` / `add_plan_note` — notes du mois
- `add_category_rule` — un mot du libellé devient une catégorie (ex. CARREFOUR → Courses)

## Banque en ligne, plus tard

Plaid reste disponible (`get_balances`, `summarize_cashflow`, …) après `plaid login` puis `plaid link` sur votre ordinateur, pas sur la machine virtuelle de l’agent. Tant que cette étape n’est pas faite, utilisez les relevés CSV.
