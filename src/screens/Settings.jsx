import React, { useState } from 'react';
import StitchLayout from '../components/StitchLayout.jsx';
import { SCREENS } from '../data/constants.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { SUPPORTED_LANGS, LANG_LABELS } from '../i18n/translations.js';
import { getStitchAsset } from '../data/stitchAssets.js';
import {
  StitchButton,
  StitchCard,
  StitchSectionHeader,
  StitchSelect,
  StitchToggle,
  StitchHeroPanel,
  StitchBadge,
  StitchDivider,
} from '../components/StitchUI.jsx';

export default function Settings({ go, stats }) {
  const { lang, setLang } = useLanguage();
  const [sound, setSound] = useState(() => {
    try { return localStorage.getItem('vamort_sound') !== 'false'; } catch { return true; }
  });
  const [music, setMusic] = useState(() => {
    try { return localStorage.getItem('vamort_music') !== 'false'; } catch { return true; }
  });
  const [notifications, setNotifications] = useState(() => {
    try { return localStorage.getItem('vamort_notifications') !== 'false'; } catch { return true; }
  });
  const [darkMode, setDarkMode] = useState(true);
  const [saved, setSaved] = useState(false);

  const saveSettings = () => {
    try {
      localStorage.setItem('vamort_sound', String(sound));
      localStorage.setItem('vamort_music', String(music));
      localStorage.setItem('vamort_notifications', String(notifications));
      localStorage.setItem('vamort_darkmode', String(darkMode));
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetSettings = () => {
    setSound(true); setMusic(true); setNotifications(true); setDarkMode(true);
    setLang('pt-BR');
  };

  const langOptions = SUPPORTED_LANGS.map(code => ({ value: code, label: LANG_LABELS[code] }));

  return (
    <StitchLayout go={go} stats={stats} currentScreen={SCREENS.Settings}>
      <main className="stitch-main-with-nav">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-6">
          {/* Hero Panel */}
          <StitchHeroPanel
            image={getStitchAsset('Settings', 'workspace')}
            imageAlt="Gothic workshop with arcane settings dials and crystals"
            className="relative overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="relative flex flex-col gap-4">
              <div>
                <StitchBadge variant="secondary" className="mb-2">Configurações</StitchBadge>
                <h1 className="font-serif text-[clamp(1.9rem,4.3vw,3.1rem)] leading-[1.02] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
                  Personalize sua <span className="text-[var(--md-sys-color-secondary)]">experiência</span>
                </h1>
                <p className="mt-3 max-w-lg text-pretty text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                  Idioma, áudio, notificações e aparência. Suas preferências são salvas localmente.
                </p>
              </div>
            </div>
          </StitchHeroPanel>

          {/* Language */}
          <StitchCard variant="filled">
            <StitchSectionHeader title="Idioma" icon="language" className="mb-4" />
            <StitchSelect
              value={lang}
              onChange={setLang}
              options={langOptions}
              placeholder="Selecionar idioma"
              aria-label="Idioma"
            />
          </StitchCard>

          {/* Audio */}
          <StitchCard variant="filled">
            <StitchSectionHeader title="Áudio" icon="volume_up" className="mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StitchToggle
                label="Efeitos Sonoros"
                checked={sound}
                onChange={setSound}
                icon="volume_up"
              />
              <StitchToggle
                label="Música de Fundo"
                checked={music}
                onChange={setMusic}
                icon="music_note"
              />
            </div>
          </StitchCard>

          {/* Notifications */}
          <StitchCard variant="filled">
            <StitchSectionHeader title="Notificações" icon="notifications" className="mb-4" />
            <StitchToggle
              label="Notificações Push"
              checked={notifications}
              onChange={setNotifications}
              icon="notifications_active"
            />
          </StitchCard>

          {/* Appearance */}
          <StitchCard variant="filled">
            <StitchSectionHeader title="Aparência" icon="dark_mode" className="mb-4" />
            <StitchToggle
              label="Modo Escuro (Gótico)"
              checked={darkMode}
              onChange={setDarkMode}
              icon="dark_mode"
            />
            <p className="mt-3 text-sm text-[var(--md-sys-color-on-surface-variant)]">
              O modo escuro é a experiência canônica de VAMORT. O modo claro está disponível para acessibilidade.
            </p>
          </StitchCard>

          {/* Actions */}
          <StitchCard variant="outlined" className="flex flex-wrap justify-end gap-3">
            <StitchButton variant="outlined" onClick={resetSettings} leftIcon="restore">
              Restaurar Padrão
            </StitchButton>
            <StitchButton
              variant="filled"
              onClick={saveSettings}
              leftIcon={saved ? 'check' : 'save'}
            >
              {saved ? 'Salvo!' : 'Salvar'}
            </StitchButton>
          </StitchCard>
        </div>
      </main>
    </StitchLayout>
  );
}