import React from 'react';
import { SCREENS, RANKS } from '../data/constants.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { LANG_LABELS } from '../i18n/translations.js';
import {
  StitchButton,
  StitchCard,
  StitchBadge,
  StitchDivider,
  StitchIconButton,
  StitchStat,
} from './StitchUI.jsx';

const NAV_ITEMS = [
  { screen: SCREENS.MainMenu, labelKey: 'nav.home', icon: 'home' },
  { screen: SCREENS.Arena, labelKey: 'nav.arena', icon: 'sports_mma' },
  { screen: SCREENS.Lobby, labelKey: 'nav.lobby', icon: 'match' },
  { screen: SCREENS.Campaign, labelKey: 'nav.campaign', icon: 'map' },
  { screen: SCREENS.Journey, labelKey: 'nav.journey', icon: 'workspace_premium' },
  { screen: SCREENS.DeckBuilder, labelKey: 'nav.deck', icon: 'auto_stories' },
  { screen: SCREENS.Collection, labelKey: 'nav.collection', icon: 'collections_bookmark' },
  { screen: SCREENS.Profile, labelKey: 'nav.ranking', icon: 'leaderboard' },
  { screen: SCREENS.MatchHistory, labelKey: 'nav.matchHistory', icon: 'history' },
  { screen: SCREENS.Replay, labelKey: 'replay.title', icon: 'replay' },
  { screen: SCREENS.Spectate, labelKey: 'nav.spectate', icon: 'tv' },
  { screen: SCREENS.Tournaments, labelKey: 'nav.tournaments', icon: 'emoji_events' },
  { screen: SCREENS.Clans, labelKey: 'nav.clans', icon: 'groups' },
  { screen: SCREENS.Draft, labelKey: 'draft.title', icon: 'style' },
  { screen: SCREENS.CosmeticShop, labelKey: 'nav.cosmetic', icon: 'palette' },
  { screen: SCREENS.VIP, labelKey: 'vip.title', icon: 'diamond' },
  { screen: SCREENS.Guide, labelKey: 'nav.guide', icon: 'menu_book' },
  { screen: SCREENS.Settings, labelKey: 'nav.settings', icon: 'settings' },
  { screen: SCREENS.Auth, labelKey: 'nav.auth', icon: 'person' },
];

const MOBILE_SCREENS = [SCREENS.MainMenu, SCREENS.Arena, SCREENS.Lobby, SCREENS.Campaign, SCREENS.DeckBuilder, SCREENS.Profile, SCREENS.MatchHistory, SCREENS.Replay, SCREENS.Spectate, SCREENS.Tournaments, SCREENS.Clans, SCREENS.Draft, SCREENS.CosmeticShop, SCREENS.VIP];

function NavItem({ item, selected, onClick, t }) {
  return (
    <StitchButton
      variant={selected ? 'tonal' : 'ghost'}
      fullWidth
      justify="start"
      leftIcon={item.icon}
      leftIconColor={selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)'}
      onClick={onClick}
      aria-current={selected ? 'page' : undefined}
      className="min-h-11 text-[0.85rem] transition-colors"
      style={{
        backgroundColor: selected ? 'var(--md-sys-color-primary-container)' : 'transparent',
        color: selected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
        fontWeight: selected ? 700 : 500,
      }}
    >
      {t(item.labelKey)}
    </StitchButton>
  );
}

function MobileNavItem({ item, selected, onClick, t }) {
  return (
    <StitchButton
      variant={selected ? 'tonal' : 'ghost'}
      size="sm"
      icon={item.icon}
      iconColor={selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)'}
      onClick={onClick}
      aria-current={selected ? 'page' : undefined}
      className="min-w-12 min-h-10 px-1 flex-col gap-0"
      style={{
        color: selected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
        backgroundColor: selected ? 'var(--md-sys-color-primary-container)' : 'transparent',
      }}
    >
      <span className="text-[0.55rem] max-w-14 truncate">{t(item.labelKey)}</span>
    </StitchButton>
  );
}

export default function StitchLayout({
  children,
  go,
  stats,
  playerClass,
  currentScreen = '',
  showNav = true,
}) {
  const { lang, setLang, t } = useLanguage();
  const games = stats?.games || 0;
  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const points = Math.max(0, (stats?.rankPoints ?? (wins * 25 - losses * 10)) || 0);
  const currentRank = [...RANKS].reverse().find(rank => points >= rank.min) || RANKS[0];
  const activeScreen = currentScreen === SCREENS.Battle ? SCREENS.Arena : currentScreen;
  const heroName = stats?.name || 'Herói';
  const className = playerClass === 'VAMPIRE' ? 'Lorde Vampiro' : playerClass === 'HUMAN' ? 'Paladino Humano' : currentRank.name;
  const navItems = NAV_ITEMS.map(item => ({ ...item, label: t(item.labelKey) }));
  const mobileItems = MOBILE_SCREENS.map(screen => navItems.find(item => item.screen === screen));

  const navigate = screen => {
    if (screen && screen !== currentScreen) {
      go(screen);
      window.location.hash = '/' + screen;
    }
  };

  return (
    <div className="stitch-shell min-h-screen bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] antialiased">
      {showNav && (
        <>
          {/* Left Sidebar - Desktop */}
          <aside className="stitch-sidebar hidden lg:flex flex-col h-screen fixed left-0 top-0 z-30 bg-[var(--md-sys-color-surface-container-lowest)]/95 backdrop-blur-2xl border-r border-[var(--md-sys-color-outline)]/10" aria-label="Navegação principal" style={{ width: '260px' }}>
            <div className="flex flex-col h-full overflow-y-auto p-3">
              {/* Logo / Home Button */}
              <StitchButton
                variant="filled"
                fullWidth
                justify="start"
                onClick={() => navigate(SCREENS.MainMenu)}
                aria-label="VAMORT — início"
                className="mb-2 gap-3"
                style={{
                  background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-primary-dark))',
                  boxShadow: '0 4px 16px rgba(230,25,75,0.35)',
                }}
              >
                <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-primary-dark))' }}>
                  <span className="material-symbols-outlined text-white text-[20px]" aria-hidden="true">shield_with_heart</span>
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="font-serif text-base font-semibold text-white uppercase tracking-wide">Vamort</span>
                  <span className="text-[0.65rem] text-[var(--md-sys-color-secondary)] uppercase tracking-[0.15em]">Dark Relic TCG</span>
                </div>
              </StitchButton>

              <StitchDivider className="my-3" style={{ borderColor: 'var(--md-sys-color-secondary)' }} opacity={0.3} />

              {/* Navigation Items */}
              <nav className="flex flex-col gap-1 flex-1" role="navigation" aria-label="Menu principal">
                {navItems.map(item => {
                  const selected = activeScreen === item.screen;
                  return (
                    <NavItem
                      key={item.screen}
                      item={item}
                      selected={selected}
                      onClick={() => navigate(item.screen)}
                      t={t}
                    />
                  );
                })}
              </nav>

              {/* Rank Progress Section */}
              <StitchDivider className="my-3" style={{ borderColor: 'var(--md-sys-color-secondary)' }} opacity={0.2} />
              <StitchCard variant="outlined" className="p-3" style={{ borderColor: 'var(--md-sys-color-secondary)/30', background: 'var(--md-sys-color-surface-container-low)/50' }}>
                <div className="flex items-center gap-3">
                  <StitchBadge variant="secondary" className="w-2 h-2 p-0 min-w-0" style={{ borderRadius: '50%' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">{currentRank.name}</div>
                    <StitchStat value={points} label="pts" variant="secondary" className="text-xs" style={{ '--md-sys-color-secondary': 'var(--md-sys-color-secondary)' }} />
                  </div>
                </div>
              </StitchCard>
            </div>
          </aside>

          {/* Top Header - Desktop & Mobile */}
          <header className="stitch-header fixed top-0 left-0 right-0 lg:left-[260px] z-40 flex items-center justify-between gap-2 px-3 h-12 bg-[var(--md-sys-color-surface-container-lowest)]/95 backdrop-blur-2xl border-b border-[var(--md-sys-color-outline)]/10">
            <StitchButton
              variant="ghost"
              onClick={() => navigate(SCREENS.Profile)}
              fullWidth
              justify="start"
              className="min-h-9 max-w-[280px] gap-1.5"
              aria-label="Ver perfil"
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--md-sys-color-surface-container-low)', border: '1px solid var(--md-sys-color-secondary)/40' }}>
                <span className="material-symbols-outlined text-[var(--md-sys-color-secondary)] text-[14px]" aria-hidden="true">shield_moon</span>
              </span>
              <div className="min-w-0 hidden sm:block flex-col leading-tight">
                <span className="font-serif text-sm font-semibold text-[var(--md-sys-color-on-surface)] truncate max-w-[160px]">{heroName}</span>
                <span className="text-[0.6rem] text-[var(--md-sys-color-primary)] uppercase tracking-[0.1em] truncate max-w-[160px]">{className}</span>
              </div>
            </StitchButton>

            <div className="flex items-center gap-2 shrink-0">
              {/* Currency Display — responsive: hide labels on small screens */}
              <StitchCard variant="outlined" className="flex items-center gap-1.5 px-2 py-1 hidden sm:flex" style={{ borderColor: 'var(--md-sys-color-outline)/20', background: 'var(--md-sys-color-surface-container-low)/80' }}>
                <StitchStat value={stats?.dust || 0} label="Pó" variant="primary" icon="bloodtype" iconColor="var(--md-sys-color-primary)" className="text-[0.65rem]" />
                <StitchDivider vertical className="h-4" opacity={0.2} />
                <StitchStat value={stats?.gold || 0} label="Ouro" variant="secondary" icon="monetization_on" iconColor="var(--md-sys-color-secondary)" className="text-[0.65rem]" />
                <StitchDivider vertical className="h-4" opacity={0.2} />
                <StitchStat value={stats?.xp || 0} label="XP" variant="tertiary" icon="auto_awesome" iconColor="var(--md-sys-color-tertiary)" className="text-[0.65rem]" />
              </StitchCard>
              {/* Mobile compact currency */}
              <StitchCard variant="outlined" className="flex items-center gap-0.5 px-1.5 py-0.5 sm:hidden" style={{ borderColor: 'var(--md-sys-color-outline)/20', background: 'var(--md-sys-color-surface-container-low)/80' }}>
                <span className="material-symbols-outlined text-[var(--md-sys-color-primary)] text-sm" aria-hidden="true">bloodtype</span>
                <span className="font-mono text-[0.7rem] text-[var(--md-sys-color-on-surface)] tabular-nums">{stats?.dust || 0}</span>
                <span className="material-symbols-outlined text-[var(--md-sys-color-secondary)] text-sm mx-1" aria-hidden="true">monetization_on</span>
                <span className="font-mono text-[0.7rem] text-[var(--md-sys-color-on-surface)] tabular-nums">{stats?.gold || 0}</span>
              </StitchCard>

              {/* Language Selector */}
              <select
                value={lang}
                onChange={event => setLang(event.target.value)}
                aria-label="Idioma"
                className="hidden sm:block min-h-10 max-w-28 px-2 py-1.5 rounded-lg text-[0.7rem] cursor-pointer"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--md-sys-color-secondary)/30',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                {Object.entries(LANG_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>

              {/* Battle Button */}
              <StitchButton
                variant="filled"
                leftIcon="sports_mma"
                size="md"
                onClick={() => navigate(SCREENS.Arena)}
                className="min-h-10 px-4 gap-2"
                style={{
                  background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-primary-dark))',
                  boxShadow: '0 4px 16px rgba(230,25,75,0.25)',
                }}
              >
                {t('nav.battle')}
              </StitchButton>
            </div>
          </header>
        </>
      )}

      {/* Main Content */}
      <main className={`main-content flex-1 min-h-screen bg-[var(--md-sys-color-surface)] ${showNav ? 'lg:pl-[260px] pt-14 pb-14 lg:pb-0' : 'pt-14'}`} style={{ paddingBottom: showNav ? 'calc(56px + env(safe-area-inset-bottom))' : 0 }}>
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      {showNav && (
        <nav className="stitch-bottom-nav lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-[56px] bg-[var(--md-sys-color-surface-container-lowest)]/95 backdrop-blur-2xl border-t border-[var(--md-sys-color-outline)]/10" aria-label="Navegação móvel" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {mobileItems.map(item => (
            <MobileNavItem
              key={item.screen}
              item={item}
              selected={activeScreen === item.screen}
              onClick={() => navigate(item.screen)}
              t={t}
            />
          ))}
        </nav>
      )}
    </div>
  );
}