export const STITCH_ASSETS = {
  MainMenu: {
    hero: '/hero-banner.jpg',
    heroAlt: 'Gothic grand cathedral interior with shattered stained glass, crimson moonlight',
    cardSpotlight: '/assets/stitch/Dark_gothic_fantasy_card_illustration_of_Carmilla,.png',
  },
  Arena: {
    battlefield: '/assets/stitch/VAMORT_Desktop_-_Arena_de_Duelo_Tático.png',
    opponentPortrait: '/assets/stitch/VAMORT_Desktop_-_Seleção_de_Facção_&_Pactos_Primor.png',
    handBackground: '/assets/stitch/VAMORT_-_Duelo_de_Cartas_In-Game.png',
  },
  Battle: {
    board: '/assets/stitch/VAMORT_Desktop_-_Arena_de_Duelo_Tático.png',
    logBackground: '/assets/stitch/VAMORT_-_Histórico_de_Duelos_Detalhado.png',
  },
  Campaign: {
    banner: '/assets/stitch/VAMORT_-_Modo_Campanha_&_Crônicas.png',
    stageBackground: '/assets/stitch/Crônicas_&_Campanha_Solo.png',
  },
  Journey: {
    hero: '/assets/stitch/VAMORT_Desktop_-_Santuário_do_Coven_&_Guerra_Terri.png',
    dailyRitual: '/assets/stitch/VAMORT_Desktop_-_Desvelo_Ritualístico_de_Boosters_.png',
    battlePass: '/assets/stitch/VAMORT_Desktop_-_Desvelo_do_Passe_de_Batalha_&_Pac.png',
    bloodPact: '/assets/stitch/VAMORT_Desktop_-_Altar_dos_Juramentos_&_Pactos_de_.png',
    energy: '/assets/stitch/VAMORT_Desktop_-_Cofre_&_Desvelo_de_Selos_Místicos.png',
    limitedEvent: '/assets/stitch/VAMORT_Desktop_-_Torneio_Noturno_&_Chaveamento_do_.png',
    creatorSystem: '/assets/stitch/VAMORT_Desktop_-_Câmara_dos_Arautos_&_Diplomacia_d.png',
  },
  Collection: {
    grid: '/assets/stitch/VAMORT_-_Museu_de_Relíquias_Ancestrais_&_G.png',
    marketplace: '/assets/stitch/VAMORT_-_Loja_&_Mercado_de_Relíquias_(Refinada).png',
    cardInspect: '/assets/stitch/VAMORT_-_Inspeção_de_Carta.png',
  },
  DeckBuilder: {
    workspace: '/assets/stitch/VAMORT_-_Forjador_de_Grimórios_(Deck_Builder).png',
    grimorio: '/assets/stitch/VAMORT_-_Grimório_da_Vitória_(Banquete_Carmesim).png',
  },
  Profile: {
    overview: '/assets/stitch/VAMORT_-_Perfil_&_Configurações.png',
    ranking: '/assets/stitch/VAMORT_Desktop_-_Ranks_&_Mural_de_Honra.png',
    ladder: '/assets/stitch/VAMORT_Desktop_-_Salão_de_Troféus_&_Conquistas_de_.png',
    leaderboard: '/assets/stitch/VAMORT_Desktop_-_Salão_de_Troféus_&_Códice_de_Glór.png',
  },
  Settings: {
    panel: '/assets/stitch/VAMORT_-_Perfil_&_Configurações.png',
  },
  Guide: {
    codex: '/assets/stitch/VAMORT_-_Lore_&_Chronicles.png',
    bestiary: '/assets/stitch/VAMORT_Desktop_-_Bestiário_Arcano_&_Códice_de_Lore.png',
  },
  Auth: {
    background: '/assets/stitch/VAMORT_-_Seleção_de_Facção.png',
  },
  Marketplace: {
    bazaar: '/assets/stitch/VAMORT_-_Mercado_&_Loja_de_Relíquias.png',
    auction: '/assets/stitch/VAMORT_Desktop_-_Mercado_Negro_&_Leilão_de_Relíqui.png',
  },
  BloodPact: {
    altar: '/assets/stitch/VAMORT_Desktop_-_Altar_dos_Juramentos_&_Pactos_de_.png',
  },
  BattlePass: {
    rewards: '/assets/stitch/VAMORT_Desktop_-_Desvelo_do_Passe_de_Batalha_&_Pac.png',
  },
  CosmeticShop: {
    relics: '/assets/stitch/VAMORT_Desktop_-_Museu_de_Relíquias_Ancestrais_&_G.png',
    forge: '/assets/stitch/VAMORT_Desktop_-_Forja_Ritualística_de_Relíquias_&.png',
  },
  EnergySystem: {
    vault: '/assets/stitch/VAMORT_Desktop_-_Cofre_&_Desvelo_de_Selos_Místicos.png',
  },
  LimitedEvent: {
    tournament: '/assets/stitch/VAMORT_Desktop_-_Torneio_Noturno_&_Chaveamento_do_.png',
  },
  CreatorSystem: {
    heralds: '/assets/stitch/VAMORT_Desktop_-_Câmara_dos_Arautos_&_Diplomacia_d.png',
  },
  CompetitiveRanking: {
    mural: '/assets/stitch/VAMORT_Desktop_-_Salão_de_Troféus_&_Códice_de_Glór.png',
  },
  RankLadder: {
    ladder: '/assets/stitch/VAMORT_Desktop_-_Ranks_&_Mural_de_Honra.png',
  },
  DailyRewards: {
    ritual: '/assets/stitch/VAMORT_Desktop_-_Desvelo_Ritualístico_de_Boosters_.png',
  },
  Achievements: {
    hall: '/assets/stitch/VAMORT_Desktop_-_Salão_de_Troféus_&_Conquistas_de_.png',
  },
  Replay: {
    analysis: '/assets/stitch/VAMORT_Desktop_-_Replay_&_Análise_Tática_de_Duelo.png',
  },
  History: {
    codex: '/assets/stitch/VAMORT_Desktop_-_Histórico_de_Duelos_&_Códice_de_C.png',
  },
  Lore: {
    chronicles: '/assets/stitch/VAMORT_-_Lore_&_Chronicles.png',
  },
};

export function getStitchAsset(screen, variant = 'default') {
  const assets = STITCH_ASSETS[screen];
  if (!assets) return null;
  return assets[variant] || assets.hero || assets.banner || Object.values(assets)[0] || null;
}