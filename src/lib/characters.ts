// Transparent troop renders in public/characters (from RoyaleAPI cr-api-assets).
const FILES = new Set(["archers.png","arrows.png","baby_dragon.png","balloon.png","bandit.png","barbarian_barrel.png","barbarians.png","barbarians_bit_dl.png","bats.png","battle_healer.png","battle_ram.png","bomber.png","bombtower_dl.png","bowler.png","cannon_cart.png","champion_hires_archer_queen.png","champion_hires_golden_knight.png","champion_hires_mighty_miner_dl.png","champion_hires_skeleton_king.png","clone_dl.png","dark_prince_dl.png","dart_goblin.png","earthquake_dl.png","electro_dragon.png","electro_giant.png","electro_spirit.png","electro_wizard.png","elite_barbarians_dl.png","elixir_golem.png","executioner_dl.png","firecracker.png","fisherman.png","flying_machine.png","giant.png","giant_skeleton.png","goblin_barrel.png","goblin_cage.png","goblin_drill.png","goblin_giant.png","goblin_hut.png","goblinhut_dl.png","goblins.png","goblins_gang.png","golem_dl.png","graveyard_dl.png","guards.png","heal_spirit.png","hog_rider.png","hunter.png","ice_golem.png","ice_spirit.png","ice_wizard.png","inferno_dragon.png","knight.png","lava_hound.png","lumberjack.png","magic_archer.png","mega_knight.png","mega_minion_dl.png","miner.png","mini_pekka.png","minions.png","minions_horde.png","mirror_dl.png","mortar.png","mother_witch.png","musketeer.png","night_witch.png","pekka.png","phoenix_dl.png","prince.png","princess.png","ram_rider.png","rascals.png","rocket.png","royal_delivery.png","royal_delivery_dl_old.png","royal_ghost.png","royal_giant_dl.png","royal_hogs.png","royal_recruits.png","skeleton_army.png","skeleton_barrel.png","skeleton_dragon.png","skeletons.png","sparky_dl.png","spear_goblins.png","tesla.png","the_log.png","the_log_christmas.png","three_musketeers.png","tombstone_dl.png","tornado.png","valkyrie.png","wall_breakers.png","witch.png","wizard.png","zap_dl.png","zappies.png"]);

// Card slugs whose render file uses a different name.
const ALIAS: Record<string, string> = {
  'goblin-gang': 'goblins_gang',
  'minion-horde': 'minions_horde',
  'bomb-tower': 'bombtower',
};

/** Character render for a card slug, or null when we have none. */
export function characterFor(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const u = ALIAS[slug] ?? slug.replace(/-/g, '_');
  for (const f of ['champion_hires_' + u + '.png', 'champion_hires_' + u + '_dl.png', u + '.png', u + '_dl.png']) {
    if (FILES.has(f)) return '/characters/' + f;
  }
  return null;
}
