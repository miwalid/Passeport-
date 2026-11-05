# رحلة حول العالم — Passeport
Interface GitHub Pages et serveur Supabase Edge Functions. 50 pays, 500 indices, GPS, mode solo et collecte par membres, passeports et export PDF.

Les tables sont interdites aux clients ; la fonction Edge contrôle les jetons des organisateurs, équipes et membres. Les mises à jour utilisent un numéro de version pour éviter les pertes lors des collectes simultanées.

Configurer `config.js` avec l’URL publique de la fonction, appliquer `supabase/schema/rihla.sql`, puis déployer la fonction compilée `bundle.ts` avec vérification JWT de passerelle désactivée : elle vérifie elle-même les jetons du jeu. Ne jamais publier de clé service_role.

`npm ci` puis `npm run build`. Publier le contenu de dist à la racine du dépôt. Dans Settings → Pages : Deploy from a branch → main → / (root). Aucun workflow de déploiement personnalisé.

Les anciennes parties restent sur l’ancien serveur. Avant démarrage, les réglages peuvent être transférés avec l’export/import JSON de l’organisateur. Les liens QR et sessions sont propres au nouvel hébergement.
