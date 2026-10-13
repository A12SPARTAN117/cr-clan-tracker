/* Loads data/cards.csv → window.OACards (Promise<Card[]>). */
(function () {
  if (window.OACards) return;
  const LOCAL = ['archers','arrows','baby-dragon','barbarian-barrel','barbarian-hut','barbarians','battle-healer','battle-ram','berserker','bomber','bomb-tower','boss-bandit'];
  const slug = (n) => n.toLowerCase().replace(/\./g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  window.OACards = fetch('data/cards.csv').then((r) => r.text()).then((t) => {
    const [head, ...lines] = t.trim().split(/\r?\n/);
    const keys = head.split(',');
    return lines.map((l) => {
      const v = l.split(','); const o = {}; keys.forEach((k, i) => (o[k] = v[i] || ''));
      const s = slug(o.name);
      return {
        name: o.name, slug: s, type: o.type, rarity: o.type === 'Tower Troop' ? 'tower' : o.rarity.toLowerCase(), rarityName: o.rarity,
        elixir: o.elixir === '' ? null : o.elixir, maxLevel: +o.max_level, evo: o.has_evolution === 'true', hero: o.has_hero === 'true',
        img: LOCAL.includes(s) ? 'images/cards/' + s + '.png' : o.image, evoImg: o.evolution_image, heroImg: o.hero_image
      };
    });
  });
})();
