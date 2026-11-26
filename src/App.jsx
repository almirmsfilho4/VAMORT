import React, { useEffect, useMemo, useState } from 'react';
import { SCREENS, STORAGE_KEYS, GAME } from './data/constants.js';
import cards from './data/hv_cards.json';
import MainMenu from './screens/MainMenu.jsx';
import DeckBuilder from './screens/DeckBuilder.jsx';
import BattleScreen from './screens/BattleScreen.jsx';
import Collection from './screens/Collection.jsx';
import Guide from './screens/Guide.jsx';
import Profile from './screens/Profile.jsx';
import Settings from './screens/Settings.jsx';
import Journey from './screens/Journey.jsx';
import AuthScreen from './screens/AuthScreen.jsx';
import { signInAnonymous, getCurrentUser, saveProgress, upsertLeaderboard } from './supabase.js';
import Arena from './screens/Arena.jsx';
import Campaign from './screens/Campaign.jsx';
import Lobby from './screens/Lobby.jsx';
import PvPBattleScreen from './screens/PvPBattleScreen.jsx';
import MatchHistory from './screens/MatchHistory.jsx';
import Practice from './screens/Practice.jsx';
import Spectate from './screens/Spectate.jsx';
import Tournaments from './screens/Tournaments.jsx';
import Clans from './screens/Clans.jsx';
import Draft from './screens/Draft.jsx';
import CosmeticShop from './screens/CosmeticShop.jsx';
import Replay from './screens/Replay.jsx';
import VIPScreen from './screens/VIPScreen.jsx';

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function storageKeyForDeck(cls) {
  return 'heroisEVampirosDeck_' + (cls || 'NEUTRAL');
}

function defaultDeck() {
  // balanced starter: up to 2 of each until 30
  const ids = [];
  for (const c of cards) {
    const n = Math.min(2, c.maxInDeck || 2);
    for (let i = 0; i < n && ids.length < GAME.maxDeckSize; i++) ids.push(c.id);
  }
  return ids.slice(0, GAME.maxDeckSize);
}

function filterCardsByClass(classId) {
  if (classId === 'VAMPIRE') {
    return cards.filter(c => c.faction === 'VAMPIRE' || c.faction === 'NEUTRAL');
  }
  if (classId === 'HUMAN') {
    return cards.filter(c => c.faction === 'HUMAN' || c.faction === 'NEUTRAL');
  }
  return cards;
}

import { LanguageProvider } from './i18n/LanguageContext.jsx';

function getScreenFromHash() {
  const hash = window.location.hash.slice(1);
  const screenName = hash.startsWith('/') ? hash.slice(1) : hash;
  if (!screenName) return SCREENS.MainMenu;
  // Handle replay route with match ID: #replay/MATCH_ID or #replay?matchId=MATCH_ID
  if (screenName.startsWith('replay/') || screenName.startsWith('replay?')) {
    return SCREENS.Replay;
  }
  // Handle private match join: #pvp?code=ABC123
  if (screenName.startsWith('pvp?') || screenName.startsWith('pvp/')) {
    return SCREENS.Lobby;
  }
  // Case-insensitive match to SCREENS values
  const matched = Object.values(SCREENS).find(s => s.toLowerCase() === screenName.toLowerCase());
  return matched || SCREENS.MainMenu;
}

export default function App() {
  const [screen, setScreen] = useState(() => getScreenFromHash());
  const [playerClass, setPlayerClass] = useState(() => load(STORAGE_KEYS.playerClass, null));
  const [stats, setStats] = useState(() => load(STORAGE_KEYS.playerStats, { name: 'Herói', wins: 0, losses: 0, games: 0 }));
  const [user, setUser] = useState(null);
  const [deckIds, setDeckIds] = useState(() => {
    const cls = load(STORAGE_KEYS.playerClass, null);
    const d = load('heroisEVampirosDeck_' + (cls || 'NEUTRAL'), null);
    return Array.isArray(d) && d.length >= 10 ? d : defaultDeck();
  });
  useEffect(() => {
    save(STORAGE_KEYS.playerStats, stats);
    if (user?.id) {
      saveProgress(user.id, { deckIds, stats, playerClass });
      upsertLeaderboard({
        uid: user.id,
        name: stats?.name || 'Herói',
        wins: stats?.wins || 0,
        losses: stats?.losses || 0,
        games: stats?.games || 0,
        playerClass: playerClass || 'NEUTRAL'
      });
    }
  }, [stats, user, playerClass]);

  // Hash-based routing
  useEffect(() => {
    // Sync on mount in case hash wasn't ready during initial render
    const initialScreen = getScreenFromHash();
    setScreen(initialScreen);
    function onHashChange() {
      const newScreen = getScreenFromHash();
      setScreen(newScreen);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Inicializar Supabase Auth
  useEffect(() => {
    async function initAuth() {
      let u = await getCurrentUser();
      if (!u) {
        const res = await signInAnonymous();
        if (res.ok) u = await getCurrentUser();
      }
      if (u) setUser(u);
    }
    initAuth();
  }, []);

  useEffect(() => {
    save(storageKeyForDeck(playerClass), deckIds);
    if (user?.id) saveProgress(user.id, { deckIds, stats, playerClass });
  }, [deckIds, user, playerClass]);

  // Quando a classe muda, carrega o deck daquela classe
  useEffect(() => {
    const d = load(storageKeyForDeck(playerClass), null);
    if (Array.isArray(d) && d.length >= 10) {
      setDeckIds(d);
    } else {
      setDeckIds(defaultDeck());
    }
     
  }, [playerClass]);

  useEffect(() => {
    save(STORAGE_KEYS.playerClass, playerClass);
    if (user?.id) saveProgress(user.id, { deckIds, stats, playerClass });
  }, [playerClass, user]);

  const onBattleEnd = (winner, battleStats = {}) => {
    setStats(s => ({
      ...s,
      games: (s.games || 0) + 1,
      wins: (s.wins || 0) + (winner === 'player' ? 1 : 0),
      losses: (s.losses || 0) + (winner === 'enemy' ? 1 : 0),
      gold: (s.gold || 0) + (winner === 'player' ? 50 : 20),
      xp: (s.xp || 0) + (winner === 'player' ? 100 : 40),
      totalDamage: (s.totalDamage || 0) + (battleStats.damageDealt || 0),
      minionsPlayed: (s.minionsPlayed || 0) + (battleStats.minionsPlayed || 0),
      maxStreak: Math.max(s.maxStreak || 0, (s.streak || 0) + (winner === 'player' ? 1 : 0)),
      streak: winner === 'player' ? (s.streak || 0) + 1 : 0,
    }));
  };

  const common = { go: setScreen, deckIds, setDeckIds, stats, setStats, playerClass, setPlayerClass, user,
    gold: stats?.gold || 0,
    dust: stats?.dust || 0,
    xp: stats?.xp || 0,
    ownedCards: stats?.ownedCards || [],
    ownedCosmetics: stats?.ownedCosmetics || [],
    rankPoints: stats?.rankPoints || (stats?.wins * 25 - stats?.losses * 10) || 0,
  };

  return (
    <LanguageProvider>
    <div style={{ minHeight: '100%' }}>
      {screen === SCREENS.MainMenu && <MainMenu {...common} />}
      {screen === SCREENS.DeckBuilder && <DeckBuilder {...common} />}
      {screen === SCREENS.Battle && <BattleScreen {...common} onBattleEnd={onBattleEnd} />}
      {screen === SCREENS.Collection && <Collection {...common} />}
      {screen === SCREENS.Guide && <Guide {...common} />}
      {screen === SCREENS.Profile && <Profile {...common} />}
      {screen === SCREENS.Settings && <Settings {...common} />}
      {screen === SCREENS.Journey && <Journey {...common} />}
      {screen === SCREENS.Arena && <Arena {...common} />}
      {screen === SCREENS.Campaign && <Campaign {...common} />}
      {screen === SCREENS.Auth && <AuthScreen {...common} />}
      {screen === SCREENS.Lobby && <Lobby {...common} />}
      {screen === SCREENS.PvPBattle && <PvPBattleScreen {...common} />}
      {screen === SCREENS.MatchHistory && <MatchHistory {...common} />}
      {screen === SCREENS.Practice && <Practice {...common} />}
      {screen === SCREENS.Spectate && <Spectate {...common} />}
      {screen === SCREENS.Tournaments && <Tournaments {...common} />}
      {screen === SCREENS.Clans && <Clans {...common} />}
      {screen === SCREENS.Draft && <Draft {...common} />}
      {screen === SCREENS.CosmeticShop && <CosmeticShop {...common} />}
      {screen === SCREENS.Replay && <Replay {...common} />}
      {screen === SCREENS.VIP && <VIPScreen {...common} />}
    </div>
    </LanguageProvider>
  );
}