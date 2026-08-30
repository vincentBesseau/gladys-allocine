# AlloCiné

Films actuellement à l'affiche dans n'importe quel cinéma français —
indépendant ou en chaîne — affichés dans le widget "Prochaines sorties" de
Gladys.

## Important : intégration non officielle

Cette intégration lit les mêmes données d'horaires publiques que les pages
d'**allocine.fr utilise déjà pour n'importe quel visiteur** de son site — le
même contenu que vous verriez en ouvrant la page de votre cinéma dans un
navigateur, rien de plus. Elle n'est ni développée, ni approuvée, ni
affiliée à AlloCiné. AlloCiné peut changer son site à tout moment et casser
cette intégration sans préavis.

Aucune API payante, aucun identifiant extrait d'une application, aucun
contournement de protection anti-robot n'est utilisé : uniquement les points
d'accès publics que le site utilise déjà pour lui-même.

## Configuration

1. Ouvrez l'onglet **Configuration** de l'intégration.
2. Lancez l'action **Trouver mon cinéma** en tapant une ville, un code
   postal ou le nom d'un cinéma (le champ est obligatoire : avec ~2000
   cinémas en France, il n'y a pas de liste complète sensée à afficher par
   défaut). Le résultat s'affiche sous le bouton, au format
   `Nom du cinéma — Ville (ID: P0052)`.
3. Copiez l'identifiant du cinéma souhaité dans le champ **Identifiant du
   cinéma**, puis enregistrez.

Les films à l'affiche aujourd'hui dans ce cinéma apparaissent alors dans le
widget "Prochaines sorties" du tableau de bord. En cliquant sur une affiche,
la fiche du film affiche un tableau des horaires de séances du jour dans ce
cinéma (heure et version, VF/VOST).

## Limites connues (v1)

- Un seul cinéma à la fois par installation de l'intégration.
- Uniquement les films et horaires du jour même (pas de vue sur demain ou les
  jours suivants).
- Pas de bande-annonce (le point d'accès utilisé ne l'inclut pas ; pourrait
  être ajouté avec un appel supplémentaire à l'avenir).
- La recherche de cinéma nécessite toujours une saisie : pas de liste
  complète, ni de recherche par proximité géographique pour l'instant
  (contrairement à `gladys-ugc`/`gladys-cgr`/`gladys-pathe`).

## Dépannage

L'intégration journalise tout ce qu'elle fait : consultez les logs de
l'intégration depuis l'interface Gladys (ou `docker logs` sur l'hôte) avec
`LOG_LEVEL=debug` pour le détail complet.
