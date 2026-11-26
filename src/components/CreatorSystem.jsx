import React, { useState, useEffect } from 'react';
import { Video, Users, Check, X, Crown, Radio, Eye, Mic, Send, Shield } from 'lucide-react';

const ADMIN_KEY = 'vamort_admin_mode';

export default function CreatorSystem() {
  const [tab, setTab] = useState('live');
  const [applications, setApplications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vamort_creator_apps') || '[]'); } catch { return []; }
  });
  const [creators, setCreators] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vamort_creators') || '[]'); } catch { return []; }
  });
  const [liveStreams, setLiveStreams] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vamort_live_streams') || '[]'); } catch { return []; }
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    try { return localStorage.getItem(ADMIN_KEY) === 'true'; } catch { return false; }
  });

  // Application form
  const [form, setForm] = useState({ name: '', platform: 'twitch', channel: '', followers: '', reason: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('vamort_creator_apps', JSON.stringify(applications)); } catch {}
  }, [applications]);
  useEffect(() => {
    try { localStorage.setItem('vamort_creators', JSON.stringify(creators)); } catch {}
  }, [creators]);
  useEffect(() => {
    try { localStorage.setItem('vamort_live_streams', JSON.stringify(liveStreams)); } catch {}
  }, [liveStreams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.channel) return;
    const app = { ...form, id: 'app_' + Date.now(), status: 'pending', submittedAt: Date.now() };
    setApplications(prev => [app, ...prev]);
    setSubmitted(true);
    setForm({ name: '', platform: 'twitch', channel: '', followers: '', reason: '' });
  };

  const approveApp = (id) => {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    setCreators(prev => [...prev, { ...app, approvedAt: Date.now(), isLive: false }]);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
  };

  const rejectApp = (id) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
  };

  const toggleLive = (creatorId) => {
    setCreators(prev => prev.map(c => c.id === creatorId ? { ...c, isLive: !c.isLive } : c));
    const creator = creators.find(c => c.id === creatorId);
    if (!creator) return;
    if (!creator.isLive) {
      setLiveStreams(prev => [...prev, { id: 'live_' + Date.now(), creatorId, creatorName: creator.name, platform: creator.platform, channel: creator.channel, startedAt: Date.now(), viewers: Math.floor(Math.random() * 200) + 10 }]);
    } else {
      setLiveStreams(prev => prev.filter(s => s.creatorId !== creatorId));
    }
  };

  const pendingApps = applications.filter(a => a.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div className="panel-background themed-border" style={{ padding: '22px 26px', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Video size={22} color="var(--gold)" />
            <div>
              <div style={{ fontFamily: 'Newsreader, serif', fontSize: '1.2rem', color: 'var(--gold)' }}>Programa de Criadores</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aplique para se tornar criador · Admin aprova · Lives aparecem aqui</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setTab('live')} className="button-theme small" style={{ padding: '6px 14px', borderRadius: '999px', background: tab === 'live' ? 'linear-gradient(135deg, var(--gold), var(--gold-dim))' : 'rgba(40,30,20,0.5)', color: tab === 'live' ? '#16121c' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Radio size={12} /> Ao Vivo
            </button>
            <button onClick={() => setTab('apply')} className="button-theme small" style={{ padding: '6px 14px', borderRadius: '999px', background: tab === 'apply' ? 'linear-gradient(135deg, var(--gold), var(--gold-dim))' : 'rgba(40,30,20,0.5)', color: tab === 'apply' ? '#16121c' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Send size={12} /> Aplicar
            </button>
            <button onClick={() => setIsAdmin(!isAdmin)} className="button-theme small" style={{ padding: '6px 14px', borderRadius: '999px', background: isAdmin ? 'rgba(139,92,246,0.3)' : 'rgba(40,30,20,0.5)', color: isAdmin ? '#a78bfa' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={12} /> Admin
            </button>
          </div>
        </div>

        {tab === 'live' && (
          <>
            {liveStreams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                <Radio size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <div>Nenhuma live no momento. Criadores aprovados podem iniciar transmissões.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {liveStreams.map(s => (
                  <div key={s.id} style={{ padding: '16px', borderRadius: 8, background: 'linear-gradient(145deg, rgba(239,68,68,0.1), rgba(0,0,0,0.4))', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                      <span style={{ fontSize: '0.72rem', color: '#fca5a5', fontWeight: 700, textTransform: 'uppercase' }}>Ao Vivo</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Eye size={11} /> {s.viewers}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, color: '#fff', marginBottom: 2 }}>{s.creatorName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>{s.platform} · {s.channel}</div>
                    <a href={`https://${s.platform}.tv/${s.channel}`} target="_blank" rel="noopener noreferrer" className="button-theme small" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: '999px', fontSize: '0.78rem' }}>
                      <Video size={12} /> Assistir
                    </a>
                  </div>
                ))}
              </div>
            )}

            {isAdmin && creators.length > 0 && (
              <div style={{ marginTop: 16, padding: '14px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 700, marginBottom: 8 }}>Painel Admin — Criadores Aprovados</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {creators.map(c => (
                    <button key={c.id} onClick={() => toggleLive(c.id)} className="button-theme small" style={{ padding: '6px 12px', borderRadius: '999px', background: c.isLive ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.15)', color: c.isLive ? '#fca5a5' : '#86efac', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {c.isLive ? <><Radio size={11} /> Encerrar Live</> : <><Mic size={11} /> Iniciar Live</>}
                      <span style={{ marginLeft: 4 }}>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'apply' && (
          <>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <Check size={40} color="#22c55e" style={{ margin: '0 auto 12px' }} />
                <div style={{ color: '#86efac', fontWeight: 700, marginBottom: 6 }}>Candidatura enviada!</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>O admin analisará e você será notificado.</div>
                <button onClick={() => setSubmitted(false)} className="button-theme small" style={{ marginTop: 14, padding: '8px 16px', borderRadius: '999px' }}>Enviar outra</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Seu nome / nick" required style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(229,169,60,0.2)', color: '#fff', fontSize: '0.85rem' }} />
                <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(229,169,60,0.2)', color: '#fff', fontSize: '0.85rem' }}>
                  <option value="twitch">Twitch</option>
                  <option value="youtube">YouTube</option>
                  <option value="kick">Kick</option>
                </select>
                <input value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })} placeholder="Nome do canal (ex: meucanal)" required style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(229,169,60,0.2)', color: '#fff', fontSize: '0.85rem' }} />
                <input value={form.followers} onChange={e => setForm({ ...form, followers: e.target.value })} placeholder="Seguidores (aprox.)" type="number" style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(229,169,60,0.2)', color: '#fff', fontSize: '0.85rem' }} />
                <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Por que quer ser criador?" rows={3} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(229,169,60,0.2)', color: '#fff', fontSize: '0.85rem', resize: 'vertical' }} />
                <button type="submit" className="button-theme" style={{ padding: '12px', borderRadius: '999px', background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))', color: '#16121c', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Send size={14} /> Enviar Candidatura
                </button>
              </form>
            )}
          </>
        )}

        {isAdmin && tab === 'apply' && pendingApps.length > 0 && (
          <div style={{ marginTop: 20, padding: '16px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div style={{ fontSize: '0.85rem', color: '#a78bfa', fontWeight: 700, marginBottom: 10 }}>Candidaturas Pendentes ({pendingApps.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingApps.map(a => (
                <div key={a.id} style={{ padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(229,169,60,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{a.name}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 8 }}>{a.platform} · {a.channel} · {a.followers || 0} seg.</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => approveApp(a.id)} style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(34,197,94,0.2)', color: '#86efac', border: 'none', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Check size={12} /> Aprovar
                      </button>
                      <button onClick={() => rejectApp(a.id)} style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: 'none', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <X size={12} /> Rejeitar
                      </button>
                    </div>
                  </div>
                  {a.reason && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{a.reason}"</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


