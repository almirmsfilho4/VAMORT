# GitHub Secrets Configuration para CI/CD

Configure estes secrets no GitHub: **Settings → Secrets and variables → Actions → New repository secret**

---

## 🔐 Secrets Obrigatórios

### Vercel (Deploy)
| Secret | Valor | Onde obter |
|--------|-------|------------|
| `VERCEL_TOKEN` | `vercel_xxxxxxxx` | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `team_xxxxxxxx` | `vercel inspect <deployment-url>` → `orgId` |
| `VERCEL_PROJECT_ID` | `prj_xxxxxxxx` | `vercel inspect <deployment-url>` → `projectId` |

### Sentry (Source Maps + Error Tracking)
| Secret | Valor | Onde obter |
|--------|-------|------------|
| `SENTRY_AUTH_TOKEN` | `sntrys_xxxxxxxx` | https://sentry.io/settings/account/api/auth-tokens/ |
| `SENTRY_ORG` | `your-org-slug` | URL do Sentry: `sentry.io/settings/<org>/` |
| `SENTRY_PROJECT` | `your-project-slug` | URL do Sentry: `sentry.io/settings/<org>/projects/<project>/` |

### Push Notifications (VAPID)
| Secret | Valor | Onde obter |
|--------|-------|------------|
| `VAPID_PRIVATE_KEY` | `po0AdacNLagYJExDhOvpLuojWfMyicDxy8YsXbOYpQU` | Gerado com `npx web-push generate-vapid-keys` |

---

## 🔧 Secrets Opcionais (para features futuras)

### Supabase (se usar edge functions)
| Secret | Valor |
|--------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_URL` | `https://your-project.supabase.co` |

### Analytics Customizados
| Secret | Valor |
|--------|-------|
| `GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` |
| `PLAUSIBLE_DOMAIN` | `vamort.vercel.app` |

---

## 📋 Como obter VERCEL_ORG_ID e VERCEL_PROJECT_ID

```bash
# Instalar Vercel CLI
npm i -g vercel@latest

# Login
vercel login

# Link do projeto (na pasta do projeto)
vercel link

# Isso cria .vercel/project.json com orgId e projectId
cat .vercel/project.json
```

Ou inspecionar um deploy existente:
```bash
vercel inspect https://vamort.vercel.app --token=SEU_TOKEN
```

---

## 🚀 Como funciona o CI/CD

### Workflow: `.github/workflows/ci-cd.yml`

**Triggers:**
- Push to `main` → Deploy Production
- Push to `develop` → Deploy Preview
- Pull Request → Build + Test + Lint

**Jobs:**
1. **lint** - ESLint + TypeScript check
2. **test** - Vitest + Coverage
3. **build** - Vite production build
4. **deploy-preview** - Deploy para Vercel Preview (PRs, develop)
5. **deploy-production** - Deploy para Vercel Production (main)
6. **security-scan** - npm audit + Snyk (opcional)
7. **upload-sourcemaps** - Upload para Sentry (production)

---

## ✅ Checklist Pós-Configuração

- [ ] Adicionar todos os secrets obrigatórios
- [ ] Criar branch `develop` para preview deploys
- [ ] Fazer push para `main` → verifica deploy production
- [ ] Criar PR → verifica deploy preview + checks
- [ ] Verificar Sentry recebe source maps (após 1º deploy production)
- [ ] Testar push notification em dispositivo móvel
- [ ] Verificar Background Sync offline

---

## 🔄 Atualizar Secrets

Se precisar rotacionar tokens:
1. Gere novo token no provedor (Vercel/Sentry)
2. Atualize no GitHub Secrets
3. Próximo deploy usará automaticamente

---

## 📝 Notas Importantes

- **NUNCA** commite secrets no código
- `.env.local` é ignorado pelo git (já no .gitignore)
- `VAPID_PRIVATE_KEY` só no servidor (GitHub Secrets + Vercel Env)
- `VITE_VAPID_PUBLIC_KEY` pode ficar no código (é público)
- Sentry DSN (`VITE_SENTRY_DSN`) também é público, mas auth token não