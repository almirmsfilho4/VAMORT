import React, { useState } from 'react';
import { signUpWithEmail, signInWithEmail, signOut, getCurrentUser } from '../supabase.js';
import StitchLayout from '../components/StitchLayout.jsx';
import { SCREENS } from '../data/constants.js';
import { getStitchAsset } from '../data/stitchAssets.js';
import {
  StitchButton,
  StitchCard,
  StitchInput,
  StitchHeroPanel,
  StitchDivider,
} from '../components/StitchUI.jsx';

export default function AuthScreen({ go, stats, setStats }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('As senhas não coincidem');
          setLoading(false);
          return;
        }
        res = await signUpWithEmail(email, password);
      } else {
        res = await signInWithEmail(email, password);
      }
      if (res.ok) {
        const u = await getCurrentUser();
        setUser(u);
        if (u?.id) {
          const { loadProgress } = await import('../supabase.js');
          const progress = await loadProgress(u.id);
          if (progress?.stats) {
            setStats({ ...stats, ...progress.stats });
          }
        }
      } else {
        setError(res.error || 'Erro de autenticação');
      }
    } catch (err) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  React.useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  if (user) {
    return (
      <StitchLayout go={go} stats={stats} currentScreen={SCREENS.Settings}>
        <main className="stitch-main-with-nav">
          <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-8">
            <StitchHeroPanel
              image={getStitchAsset('AuthScreen', 'avatar')}
              imageAlt="Gothic portal with authenticated user glow"
              className="relative overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
            >
              <div className="relative flex flex-col gap-4">
                <div>
                  <h1 className="font-serif text-[clamp(1.9rem,4.3vw,3.1rem)] leading-[1.02] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
                    Bem-vindo de volta
                  </h1>
                  <p className="mt-3 max-w-lg text-pretty text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                    Sua conta está conectada. Progresso salvo na nuvem.
                  </p>
                </div>
              </div>
            </StitchHeroPanel>

            <StitchCard variant="elevated" style={{ borderColor: 'var(--md-sys-color-primary)', background: 'rgba(230, 25, 75, 0.05)' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--md-sys-color-primary-container)' }}>
                  <span className="material-symbols-outlined text-[24px]" style={{ color: 'var(--md-sys-color-on-primary-container)' }}>person</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)]">Conectado</h2>
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{user.email || user.id}</p>
                </div>
              </div>
              <StitchDivider className="my-4" />
              <div className="flex flex-col gap-2">
                <StitchButton variant="filled" onClick={handleSignOut} leftIcon="logout">
                  Sair da conta
                </StitchButton>
                <StitchButton variant="outlined" onClick={() => go(SCREENS.MainMenu)} leftIcon="arrow_back">
                  Voltar ao Salão
                </StitchButton>
              </div>
            </StitchCard>
          </div>
        </main>
      </StitchLayout>
    );
  }

  return (
    <StitchLayout go={go} stats={stats} currentScreen={SCREENS.Settings}>
      <main className="stitch-main-with-nav">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-8">
          <StitchHeroPanel
            image={getStitchAsset('AuthScreen', 'login')}
            imageAlt="Gothic castle gate with ancient authentication runes"
            className="relative overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="relative flex flex-col gap-4">
              <div>
                <StitchBadge variant={mode === 'signup' ? 'tertiary' : 'secondary'} className="mb-2">
                  {mode === 'signup' ? 'Criar Conta' : 'Entrar na Corte'}
                </StitchBadge>
                <h1 className="font-serif text-[clamp(1.9rem,4.3vw,3.1rem)] leading-[1.02] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
                  {mode === 'signup' ? 'Forje seu <span className="text-[var(--md-sys-color-secondary)]">Grimório</span>' : 'Acesse seu <span className="text-[var(--md-sys-color-secondary)]">Santuário</span>'}
                </h1>
                <p className="mt-3 max-w-lg text-pretty text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                  {mode === 'signup'
                    ? 'Crie sua conta para sincronizar progresso entre dispositivos e acessar o Marketplace.'
                    : 'Entre para continuar sua jornada, sincronizar progresso e acessar o Mercado Arcano.'}
                </p>
              </div>
            </div>
          </StitchHeroPanel>

          <StitchCard variant="filled">
            {error && (
              <StitchCard variant="filled" className="mb-4 p-3" style={{ backgroundColor: 'var(--md-sys-color-error-container)', borderColor: 'var(--md-sys-color-error)' }}>
                <p className="text-sm" style={{ color: 'var(--md-sys-color-on-error-container)' }}>{error}</p>
              </StitchCard>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <StitchInput
                label="E-mail"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                leftIcon="mail"
              />

              <StitchInput
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                leftIcon="lock"
                rightIcon={showPassword ? 'visibility_off' : 'visibility'}
                onRightIconClick={() => setShowPassword(!showPassword)}
              />

              {mode === 'signup' && (
                <StitchInput
                  label="Confirmar Senha"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  leftIcon="lock"
                />
              )}

              <StitchButton
                variant="filled"
                type="submit"
                disabled={loading}
                className="w-full"
                leftIcon={loading ? 'hourglass_empty' : 'arrow_forward'}
              >
                {loading ? 'Carregando...' : mode === 'signup' ? 'Criar Conta' : 'Entrar'}
              </StitchButton>
            </form>

            <StitchDivider className="my-4" />

            <p className="text-center text-sm text-[var(--md-sys-color-on-surface-variant)] mb-2">
              {mode === 'signup' ? 'Já tem conta?' : 'Não tem conta?'} {' '}
              <StitchButton
                variant="text"
                size="sm"
                onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}
              >
                {mode === 'signup' ? 'Entrar' : 'Criar conta'}
              </StitchButton>
            </p>

            <p className="text-center text-xs text-[var(--md-sys-color-on-surface-variant)]/70 mb-4">
              Ou continue anonimamente — seu progresso fica salvo localmente
            </p>

            <StitchButton variant="outlined" onClick={() => go(SCREENS.MainMenu)} className="w-full" leftIcon="skip_next">
              Continuar sem conta
            </StitchButton>
          </StitchCard>
        </div>
      </main>
    </StitchLayout>
  );
}