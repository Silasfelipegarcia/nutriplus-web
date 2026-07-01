# Nutri+ Web — Documentação

Site marketing + portal do usuário + Nutri+ Pro + admin em **Angular 19**.

**Catálogo canônico de features:** [`nutriplus-api/docs/FEATURES.md`](../../nutriplus-api/docs/FEATURES.md).  
**Hub da plataforma:** [`nutriplus-api/docs/README.md`](../../nutriplus-api/docs/README.md).

---

## Stack

| Item | Detalhe |
|------|---------|
| Framework | Angular 19 (standalone components) |
| Arquitetura | Clean Architecture + DDD |
| Design system | `src/design-system/` — tokens alinhados ao Flutter |
| Deploy | Vercel (`nutriplus.app.br`) |
| API | `nutriplus-api` via `API_BASE_URL` |

---

## Estrutura

```
src/
  design-system/       # tokens, componentes base, logo
  domain/              # entities, repository ports
  infrastructure/      # HTTP adapters, auth, tracing, payment
  presentation/        # marketing, auth, onboarding, portal, pro, admin
  app/                 # routes, config, guards
```

---

## Rotas

Fonte: `src/app/app.routes.ts`.

### Marketing e legal

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | landing | One-page marketing |
| `/planos` | marketing-plans | Planos comercial |
| `/beta` | beta-landing | Cadastro beta |
| `/baixar-app` | download-app | Redirect mobile → lojas |
| `/privacidade`, `/termos`, `/cookies`, `/seguranca` | legal-page | Páginas legais |

### Autenticação

| Rota | Descrição |
|------|-----------|
| `/auth/login` | Login (desktop) |
| `/auth/cadastro` | Cadastro paciente |
| `/auth/cadastro-nutricionista` | Cadastro nutricionista |
| `/auth/esqueci-senha` | Recuperação |
| `/auth/redefinir-senha` | Reset com token |
| `/convite/:code` | Aceitar convite nutricionista |

### Onboarding

| Rota | Etapa |
|------|-------|
| `/onboarding` | Agente Luna/Bruno |
| `/onboarding/tipo` | Tipo de perfil |
| `/onboarding/treino` | Setup atleta |
| `/onboarding/preferencias` | Gostos alimentares |
| `/onboarding/metricas` | Medidas e metas |
| `/onboarding/dieta` | Dieta |
| `/onboarding/saude` | Saúde |
| `/onboarding/termos` | Aceite legal |

### Portal paciente (`/app/*`)

Guard: desktop only (mobile redireciona para `/baixar-app`).

| Rota | Feature |
|------|---------|
| `/app/dashboard` | Hoje — check-ins, plano |
| `/app/plano` | Cardápio |
| `/app/compras` | Lista de compras |
| `/app/progresso` | Progresso |
| `/app/evolucao` | Evolução + aderência |
| `/app/treino` | Modo atleta |
| `/app/perfil` | Perfil |
| `/app/nutricionistas` | Marketplace |
| `/app/nutricionistas/:id` | Detalhe nutricionista |
| `/app/planos` | Catálogo assinatura |
| `/app/planos/sucesso`, `/pendente` | Checkout result |
| `/app/assinatura` | Status + cancelar/reativar |
| `/app/cobranca` | Cadastro cartão MP |

### Portal Pro (`/pro/*`)

| Rota | Feature |
|------|---------|
| `/pro/dashboard` | Overview |
| `/pro/pacientes` | Caseload |
| `/pro/pacientes/:id` | Dossiê paciente |
| `/pro/conversas` | Lista chats |
| `/pro/conversas/:id` | Chat |
| `/pro/convites` | Convites |
| `/pro/perfil` | Perfil + pricing |

Doc: [`NUTRI_PLUS_PRO.md`](../../nutriplus-api/docs/NUTRI_PLUS_PRO.md).

### Admin (`/admin/*`)

| Rota | Feature |
|------|---------|
| `/admin` | Overview |
| `/admin/acesso` | Aprovação de acessos |
| `/admin/administradores` | Gestão admins |
| `/admin/nutricionistas` | Nutricionistas |
| `/admin/flags` | Feature flags |
| `/admin/planos` | Catálogo assinatura |

---

## Paridade com Flutter

| Feature | Web | Flutter |
|---------|-----|---------|
| Shell 5 abas | portal nav | `NutriMainShell` |
| Onboarding | 8 rotas web | 13 passos wizard |
| Reativar assinatura | Sim | Gap |
| Trial + cartão | Sim | Gap |
| Chat care | Parcial (Pro) | Sim (paciente) |
| Lembretes locais | Não | Sim |

Matriz completa: [`FEATURES.md`](../../nutriplus-api/docs/FEATURES.md).

---

## Desenvolvimento

```bash
npm install
npm start
```

Abre em `http://localhost:4200`. API padrão: `http://localhost:8080`.

## Build e deploy

```bash
npm run build
```

Output: `dist/nutriplus-web/browser`

Vercel env (Production): `API_BASE_URL`, `MERCADOPAGO_PUBLIC_KEY`. Ver root [README.md](../README.md).

CORS: adicionar origens Vercel em `CORS_ALLOWED_ORIGINS` na API.

---

## Integrações web

| Integração | Uso |
|------------|-----|
| Mercado Pago SDK | Checkout, cartão, assinatura |
| Trace headers | Propagação via HTTP interceptors |
| Analytics | `analytics-cta.directive` |

Detalhes: [`INTEGRATIONS.md`](../../nutriplus-api/docs/INTEGRATIONS.md).

---

## Manutenção

Ao adicionar rota ou feature no portal:

1. Atualizar tabela de rotas neste arquivo.
2. Atualizar [`nutriplus-api/docs/FEATURES.md`](../../nutriplus-api/docs/FEATURES.md).
