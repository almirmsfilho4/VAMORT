export const SCREENS = {
  MainMenu: 'MainMenu',
  Arena: 'Arena',
  Campaign: 'Campaign',
  Journey: 'Journey',
  DeckBuilder: 'DeckBuilder',
  Battle: 'Battle',
  Collection: 'Collection',
  Guide: 'Guide',
  Settings: 'Settings',
  Profile: 'Profile',
  Auth: 'Auth',
  Lobby: 'Lobby',
  PvPBattle: 'PvPBattle',
  MatchHistory: 'MatchHistory',
  Practice: 'Practice',
  Spectate: 'Spectate',
  Tournaments: 'Tournaments',
  Clans: 'Clans',
  Draft: 'Draft',
  CosmeticShop: 'CosmeticShop',
  Replay: 'Replay',
  Crafting: 'Crafting',
  VIP: 'VIP',
};

export const FACTIONS = {
  HUMAN: 'HUMAN',
  VAMPIRE: 'VAMPIRE',
  NEUTRAL: 'NEUTRAL',
};

export const FACTION_LABEL = {
  HUMAN: 'Humano',
  VAMPIRE: 'Vampiro',
  NEUTRAL: 'Neutro',
};

export const CARD_TYPES = {
  ATTACK: 'ATTACK',
  DEFENSE: 'DEFENSE',
  MAGIC: 'MAGIC',
  MINION: 'MINION',
  SPECIAL: 'SPECIAL',
};

export const TYPE_LABEL = {
  ATTACK: 'Ataque',
  DEFENSE: 'Defesa',
  MAGIC: 'Magia',
  MINION: 'Lacaio',
  SPECIAL: 'Especial',
};

export const RARITIES = {
  COMUM: 'COMUM',
  RARA: 'RARA',
  EPICA: 'EPICA',
  LENDARIA: 'LENDARIA',
};

export const GAME = {
  maxDeckSize: 30,
  initialHealth: 30,
  initialBlood: 1,
  maxBlood: 10,
  maxHandSize: 7,
  drawPerTurn: 1,
  maxBoardSize: 7,
};

export const STORAGE_KEYS = {
  ownedCards: 'heroisEVampirosOwnedCards',
  playerStats: 'heroisEVampirosPlayerStats',
  gameSettings: 'heroisEVampirosGameSettings',
  achievements: 'heroisEVampirosAchievements',
  deck: 'heroisEVampirosDeck',
  playerClass: 'heroisEVampirosPlayerClass',
};

export const STORAGE_KEYS_NEW = STORAGE_KEYS;

export const KEYWORDS = {
  TAUNT: 'Provocação',
  DIVINE_SHIELD: 'Escudo Divino',
  LIFESTEAL: 'Roubo de Vida',
  RUSH: 'Investida',
  FLYING: 'Voar',
  STEALTH: 'Furtivo',
};

export const RANKS = [
  { name: 'Bronze', min: 0, color: '#cd7f32' },
  { name: 'Prata', min: 100, color: '#c0c0c0' },
  { name: 'Ouro', min: 250, color: '#ffd700' },
  { name: 'Platina', min: 450, color: '#00e5ff' },
  { name: 'Diamante', min: 700, color: '#b388ff' },
  { name: 'Mestre', min: 1000, color: '#ff5252' },
  { name: 'Lorde Supremo', min: 1500, color: '#ff9100' },
];
