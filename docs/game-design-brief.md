# VAMORT TCG — Game Design Brief / Asset List

> **Projeto:** VAMORT TCG (Herois & Vampiros)
> **URL Produção:** https://vamort.vercel.app (deployment `dpl_7o33d3we6-almirs-projects-99168cbe.vercel.app`, status **READY**)
> **Build:** `npm run build` ✅ (25 chunks, ~25 MB total, code-split `manualChunks`)
> **Testes:** 25/25 Vitest + 26/26 Playwright E2E ✅
> **Auditoria Lighthouse:** Accessibility 0.95 · Best Practices 1.0 · SEO 0.6
> **Idiomas:** pt-BR, EN, ES, FR, DE, JA, KO (7)

---

## 1. Visão Geral

VAMORT é um TCG (Tradicional Card Game) onde **Vampiros** (classe `VAMPIRE`) enfrentam **Humanos** (`HUMAN`). Jogo de cartas estratégico baseado em decisões, não em vantagens aleatórias ou roletas/pay-to-win. Progresso acumulado por batalhas, missões, eventos limitados e criadores forma **Journeys** (tábua de jornada). Sistema de progressão integrado como componentes *Journey* tabs.

### Requisitos de Conformidade
- **No pay-to-win, gacha, roleta** — apenas cosméticos.
- Suporte PT-BR, EN, ES, FR, DE, JA, KO (7 idiomas).
- 99% visual parity com Google Stitch (desktop/mobile).
- Monetização limitada a **cosméticos** (cartões, cartelas, skins, emotes). Battle Pass e energia são sistemas de progressão.

---

## 2. Estrutura do Jogo (Screens & Tabs)

| # | Screen / Tab | Função Principal |
|---|--------------|-----------------|
| 1 | **MainMenu** | Ações principais: Entrar na Arena, Crônicas Solo, Jornada, Forjar Grimório, Relicário, Códice de Regras. Contém **FirstPurchaseOffer**. |
| 2 | **Arena** | Salão de Batalha — escolher facção (Corte Vampírica / Ordem Humana), invocar lacaios, atacar. Integra **Tutorial** ao primeiro battle entry. |
| 3 | **Campaign** | Crônicas Solo (6 encontros, dinastia). |
| 4 | **Journey** | 9 abas: Missions, Achievements, Daily Rewards, Battle-Pass, Cosmetic-Shop, Energy, Blood-Pact, Limited Event, Creators. |
| 5 | **DeckBuilder** | Forjar Grimório — ajustar curva, filtros, 30 cartas. |
| 6 | **Battle** | Campo de Batalha, HeroPanel, MinionView, Floating Numbers (card-play animations), Victory/Defeat Modal. |
| 7 | **Collection** | Catálogo completo + **Marketplace** integrado. |
| 8 | **Guide** | Palavras-chave, turnos e alvos. |
| 9 | **Settings** | Idioma, áudio, música, notificações, modo escuro. |
| 10 | **Profile** | 4 abas: Visão Geral, Ranking Competitivo, Escada de Ranques, Ranking Global. |
| 11 | **Auth** | Signup/login via Supabase (anon + email/password), cloud progress sync. |
| 12 | **AuthScreen** | Login/Signup form. |
| 13 | **Campaign** | Stage completion. |

### Abas da Journey (8 abas)
1. Missões
2. Conquistas
3. Recompensas
4. Passe de Batalha (Battle Pass)
5. Loja de Cosméticos (Cosmetic Shop)
6. Energia
7. Pacto de Sangue (Blood Pact)
8. Evento Limitado (Limited Event)
9. Criadores (Creator System)

---

## 3. Componentes Principais

| Componente | Propriedades Chave | Papel |
|------------|--------------------|-------|
| `App.jsx` | `go`, `stats`, `setStats`, `playerClass`, `user`, `deckIds`, `screen`, `load()`, `save()` | Hash routing, save/load state, leaderboard upsert, deck loading per class. |
| `MainMenu.jsx` | `go`, `stats`, `playerClass`, `deckIds` | Ações do menu principal, deck count, rank points, factions, gold/XP/damage/minions/streak. |
| `Arena.jsx` | `go`, `stats`, `playerClass`, `deckIds` | Salão de batalha, startBattle, tutorialOpen (localStorage `vamort_tutorial_done`), hero panel, enemy board, player board. |
| `BattleScreen.jsx` | `go`, `deckIds`, `onBattleEnd`, `playerClass`, `stats` | Battle loop, targeting minions/heroes, floating card-play animation, victory/defeat modal, cardPlayAnim. |
| `Journey.jsx` | `onClaim` (LimitedEvent, BloodPact, etc.) | 9 tabs wired with rewards, claim logic, streak tracking. |
| `Collection.jsx` | `showMarketplace`, `gold`, `onSpend`, `onEarn`, `ownedCards` | Cartão grid + integração Marketplace (localStorage `vamort_marketplace`, 5% tax). |
| `Marketplace.jsx` | `gold`, `onSpend`, `onEarn`, `ownedCards` | Venda de cartas com preço, 5% tax, seed listings from `hv_cards.json`. |
| `Profile.jsx` | `go`, `stats`, `setStats`, `playerClass` | 4 tabs: overview, ranking, ladder, global. CompetitiveRanking, RankLadder, Leaderboard. |
| `AuthScreen.jsx` | Email/password + Supabase | SIGNUP/LOGIN, cloud progress sync. |
| `FirstPurchaseOffer.jsx` | `onBuy`, `onDismiss` | Oferta inicial no MainMenu (precisa de `setStats` prop). |
| `LimitedEvent.jsx` | `onClaim` | Evento temporário com recompensas escalonadas. |
| `CompetitiveRanking.jsx` | `wins`, `losses`, `games` | Integrado em Profile. |
| `RankLadder.jsx` | `currentPoints`, `compact` | Integrado em Profile. |
| `Tutorial.jsx` | `onComplete`, `step`, `done` | Overlay multi-step (Bem-vindo → Mão → Campo → Atacar → Palavras-chave → Turno → Pronto). Auto-abre se `!localStorage.getItem('vamort_tutorial_done')`. |
| `BloodPact.jsx` | `onClaim`, `selectedCovenant`, `streak` | Pacto semanal rotativo (dawn / dusk), recompensas variáveis, bonificação +25% no destaque. |
| `EnergySystem.jsx` | (verificado) | Sistema de energia (energysystem). |
| `DailyRewards.jsx` | (verificado) | Recompensas diárias. |
| `CreatorSystem.jsx` | localStorage-based | Programa de criadores (Twitch/YouTube/Kick). |
| `Leaderboard.jsx` | (verificado) | Tabela de líderes globais. |
| `CardView.jsx` | `card.cost`, `cost-badge` | Exibe custo de carta na mão ("Cartas na mão custam X"). |
| `StitchLayout.jsx` | `go`, `stats`, `playerClass`, `currentScreen` | Layout hash-routing (no react-router). |
| `StitchCardRelic.jsx` | `relic-cost` | Relíquias (63 assets). |
| `Missions.jsx` | (verificado) | Missões. |
| `Achievements.jsx` | (verificado) | Conquistas. |
| `DeckBuilder.jsx` | `cost`, distribution | Forja Grimório. |
| `Guide.jsx` | (verificado) | Palavras-chave, turnos, alvos. |

### ManualChunks (vite.config.js)
- `vendor` (~386 KB)
- `screen-*` (~3–36 KB each)
- `component-*` (~0.03–19 KB)
- Total chunks: ~25

---

## 4. Sistema de Progressão (Journey)

### Abas (8)
1. **Missões**
2. **Conquistas**
3. **Recompensas**
4. **Passe de Batalha** (Battle Pass)
5. **Loja de Cosméticos** (Cosmetic Shop)
6. **Energia**
7. **Pacto de Sangue** (Blood Pact)
8. **Evento Limitado** (Limited Event)
9. **Criadores**

### Recompensas por Tab
- **Blood Pact**: 4 recompensas base (Baús 3, Essência 250, Grimório 15, Ouro 500); bonus +25% no pacto em destaque; recompensa selada guardada no `vamort_blood_pact_sealed`.
- **Limited Event**: +1000 ouro +200 XP +100 poeira.
- **Cosmetic Shop**: preços de cartas (300–450 ouro), 5% tax, seed listings `hv_cards.json`.
- **Battle Pass**: pontos baseados em vitórias/derrotas/games.

### Streak (Pacto de Sangue)
- Contagem de semanas consecutivas com pacto selado; bônus visual +25% e badge verde.

---

## 5. Monetização (Somente Cosméticos)

- Apenas **cartões, cartelas, skins, emotes**.
- Nenhum sistema de roleta, gacha ou vantagem competitiva.
- Battle Pass e energia = progressão, não vantagem.
- Preços no marketplace: 80–450 ouro (ex.: Lady Carmilla 350, Necromante Obscuro 450).

---

## 6. Idiomas (7)

| Código | Nome | Tradução |
|--------|------|---------|
| pt-BR | português (Brazil) | Português Brasileiro |
| EN | English | Inglês |
| ES | Español | Espanhol |
| FR | Français | Francês |
| DE | Deutsch | Alemão |
| JA | Japanese | Japonês |
| KO | Korean | Coreano |

Configurações de idioma via `useLanguage()` → `LANG_LABELS[code]` em `src/i18n/LanguageContext.jsx`.

---

## 7. Prices (Lista Completa)

### Cartas (hv_cards.json — 35 cartas)
| ID | Nome | Faction | Type | Cost | Attack | Health | MaxInDeck | Rarity | EffectSymbol |
|----|------|---------|------|------|-------|--------|----------|--------|-------------|
| vamp_001 | Sanguinário Voraz | VAMPIRE | MINION | 1 | 1 | 2 | 2 | COMUM | 🩸 |
| vamp_002 | Espreitador Noturno | VAMPIRE | MINION | 1 | 1 | 1 | 2 | COMUM | 👁️ |
| vamp_003 | Mordida Vampírica | VAMPIRE | ATTACK | 1 | 2 | 2 | 2 | COMUM | 🩸 |
| vamp_004 | Fúria Sangrenta | VAMPIRE | MAGIC | 2 | 2 | 2 | 2 | COMUM | ⚔️ |
| vamp_005 | Acólito Carmesim | VAMPIRE | MINION | 2 | 2 | 3 | 2 | COMUM | 🩸 |
| vamp_006 | Morcego Sombrio | VAMPIRE | MINION | 1 | 1 | 1 | 2 | COMUM | 🦇 |
| vamp_007 | Sangrador | VAMPIRE | MINION | 3 | 3 | 4 | 2 | COMUM | 🩸 |
| vamp_008 | Horda de Carniceiros | VAMPIRE | MINION | 3 | 3 | 3 | 2 | COMUM | 🛡️ |
| vamp_009 | Cavaleiro Sangrento | VAMPIRE | MINION | 3 | 3 | 4 | 2 | RARA | 🩸 |
| vamp_010 | Lorde Vampiro | VAMPIRE | MINION | 5 | 5 | 5 | 1 | RARA | 🦇 |
| vamp_011 | Ritual de Vinculação | VAMPIRE | MAGIC | 4 | 4 | 4 | 1 | RARA | ⛓️ |
| vamp_012 | Juramento de Sangue | VAMPIRE | MAGIC | 3 | 3 | 3 | 2 | RARA | 🩸 |
| vamp_013 | Ceifador de Almas | VAMPIRE | MINION | 5 | 4 | 5 | 1 | RARA | 💀 |
| hum_001 | Paladino Novato | HUMAN | MINION | 1 | 1 | 1 | 2 | COMUM | 🛡️ |
| hum_002 | Luz Sagrada | HUMAN | MAGIC | 2 | 4 | 2 | 2 | COMUM | ✨ |
| hum_003 | Santuário | HUMAN | MAGIC | 3 | 3 | 3 | 2 | COMUM | 🛡️ |
| hum_004 | Rompente da Aurora | HUMAN | MINION | 6 | 5 | 5 | 1 | RARA | ✨
| hum_005 | Sacerdotisa da Aurora | HUMAN | MINION | 2 | 2 | 3 | 2 | COMUM | ✨
| hum_006 | Besteiro | HUMAN | MINION | 2 | 2 | 3 | 2 | COMUM | 🏹 |
| hum_007 | Porta-Escudo | HUMAN | MINION | 3 | 3 | 3 | 2 | COMUM | 🛡️ |
| hum_008 | Exorcista | HUMAN | MINION | 3 | 3 | 4 | 2 | COMUM | 🔮 |
| hum_009 | Inquisidor | HUMAN | MINION | 3 | 3 | 4 | 2 | RARA | 🔥 |
| hum_010 | Alta Sacerdotisa | HUMAN | MINION | 5 | 5 | 5 | 1 | RARA | ✨
| hum_011 | Escudo Divino | HUMAN | MAGIC | 3 | 3 | 2 | 2 | RARA | ✨
| hum_012 | Cruzado | HUMAN | MINION | 4 | 4 | 4 | 2 | RARA | ✨
| epic_001 | Draco do Crepúsculo | NEUTRAL | MINION | 4 | 4 | 4 | 1 | EPICA | 🐉 |
| epic_002 | Morcego do Crepúsculo | NEUTRAL | MINION | 2 | 1 | 3 | 1 | EPICA | 🦇 |
| epic_003 | Colheita de Almas | VAMPIRE | MAGIC | 5 | 5 | 5 | 1 | EPICA | 💀 |
| epic_004 | Selador de Pactos | VAMPIRE | MINION | 6 | 5 | 5 | 1 | EPICA | 🩸 |
| epic_005 | Luz do Arcanjo | HUMAN | MAGIC | 6 | 10 | 2 | 1 | EPICA | ✨ |
| leg_001 | Vlad, o Rei Sangrento | VAMPIRE | MINION | 8 | 7 | 8 | 1 | LENDARIA | 👑 |
| leg_002 | Santa Aurelia | HUMAN | MINION | 8 | 8 | 8 | 1 | LENDARIA | ✨
| leg_003 | O Monarca do Crepúsculo | NEUTRAL | MINION | 10 | 1 | 1 | 1 | LENDARIA | 🌅 |
| ... (restantes 22 cartas) | | | | | | | | | |

*(Detalhes completos de todas as 34 cartas MINION/MAGIC/ATTACK/DEFENSE/SPECIAL disponíveis em `src/data/hv_cards.json`)*

### Cartas de Board (Tabuleiro)
- `board_dark` (Tabuleiro Sombrio): 600 ouro
- `board_light` (Tabuleiro Luminoso): 600 ouro

### Heróis
- `hero_vampire_alt`: Lorde Vampiro (VAMPIRE) — 1200 ouro
- `hero_human_alt`: Paladino Dourado (HUMAN) — 1200 ouro

### Emotes
- emote_laugh: 150
- emote_roar: 150
- emote_bow: 150

### Relíquias (StitchAsset 63)
- `StitchCardRelic.jsx` — 8.42 kB gzipped.

### Marketplace Listagens
| ID | Vendedor | Carta | Preço | Data |
|----|----------|-------|-------|------|
| l1 | Conde Drácula | cards[0] | 120 | now −1h |
| l2 | Sir Galahad | cards[5] | 200 | now −2h |
| l3 | Mago Errante | cards[10] | 80 | now −3h |
| l4 | Lady Carmilla | cards[15] | 350 | now −24h |
| l5 | Inquisidor Vane | cards[20] | 280 | now −54h |
| l6 | Necromante Obscuro | cards[25] | 450 | now −108h |

### Tax (Marketplace)
- 5% sobre preço listado.

### Cards de Back (BoardBack)
- back_vampire: 300
- back_human: 300
- back_neutral: 300

### Cartas de Back (BoardBack)
- board_dark: 600
- board_light: 600

### Skin Heroes
- skin lorde vampiro: 1200
- skin paladino dourado: 1200

### Emotes
- emote laugh 150, roar 150, bow 150

### Recompensas (Blood Pact)
- Baús: 3
- Essência: 250
- Grimório: 15
- Ouro: 500

### Passe de Batalha
- Pontos baseados em wins/losses/games.

---

## 8. Performance & A11y (Lighthouse)

| Scores | Valor |
|--------|------|
| Accessibility | 0.95 |
| Best Practices | 1.00 |
| SEO | 0.60 |
| Failures | Color contrast (low on some text), missing meta description, invalid robots.txt |

**Próximos ajustes:**
- Adicionar `meta description` à página.
- Corrigir contraste de cores (texturas claras vs fundo escuro).
- Validar `robots.txt`.

---

## 9. Deploy & URLs

- **Preview server:** `npm run preview` (running).
- **Vercel CLI:** `npx vercel --prod --yes`
  - Deployment: `dpl_7o33d3we6-almirs-projects-99168cbe.vercel.app`
  - Production URL: **https://vamort.vercel.app** (READY)
  - Aliased: https://vamort-59qea8dgu-almirs-projects-99168cbe.vercel.app

---

## 10. Próximos Passos (Checklist)

- [x] Build passa (`npm run build`)
- [x] Testes unitários 25/25 Vitest
- [x] Testes E2E 26/26 Playwright (hash routing, deck builder, battle entry, progression)
- [x] Fix FirstPurchaseOffer (prop setStats) — já removido import desnecessário
- [x] Tutorial integrado ao BattleScreen (auto abre ao primeiro battle entry)
- [x] Blood Pact com rotação semanal determinística (sem gacha/roleta)
- [x] Marketplace externo (localStorage `vamort_marketplace`, 5% tax, seed listings)
- [x] Auth via Supabase (anon + email/password, cloud progress sync)
- [x] 7 idiomas (pt-BR, EN, ES, FR, DE, JA, KO)
- [x] Hash routing verificado para 9+ rotas, zero console errors
- [x] Deployado em produção: https://vamort.vercel.app
- [ ] Auditoria performance/accessibilidade (Lighthouse fixes: meta desc, contrast, robots.txt)
- [ ] Meta description na página
- [ ] Robots.txt validado
- [ ] Contraste de cores AA/AAA em todos os componentes
- [ ] Navegação por teclado (tab order)
- [ ] ARIA labels nos componentes interativos

---

## 11. Resumo de Preços (Cosméticos)

| Tipo | Faixa | Exemplos |
|------|------|----------|
| Cartas (MINION/MAGIC/ATTACK) | 1–10 mana | vamp_001 (1), hum_002 (2), epic_005 (6) |
| Cartas de Back (Board) | 300–600 | back_* (300), board_dark (600), board_light (600) |
| Heróis (Skin) | 1200 | hero_vampire_alt (1200), hero_human_alt (1200) |
| Emotes | 150 | emote_laugh (150), emote_roar (150), emote_bow (150) |
| Relíquias (Stitch) | 8.42 KB | 63 assets total |
| Marketplace listagens | 80–450 ouro | l3 (80), l4 (350), l6 (450) |

---

*Documento gerado para envio ao Stitch (Google AI video editor) — pronto para análise de DNA viral e re-criação dos designs.*
