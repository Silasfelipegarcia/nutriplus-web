# Nutri+ Web

Site marketing + portal do usuário em Angular 19.

## Stack

- Angular 19 (standalone components)
- Clean Architecture + DDD (domain / infrastructure / presentation)
- Design system Nutri+ alinhado ao app Flutter
- Deploy: Vercel

## Desenvolvimento

```bash
npm install
npm start
```

Abre em `http://localhost:4200`. API padrão: `http://localhost:8080` (configurável em `src/environments/environment.ts`).

## Build

```bash
npm run build
```

Output: `dist/nutriplus-web/browser`

## Deploy Vercel

1. Conecte o repositório ao Vercel
2. Configure variáveis de ambiente (opcional — edite `environment.prod.ts` ou use file replacement customizado):
   - API URL em `src/environments/environment.prod.ts`
3. Domínio: `nutriplus.com.br`

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | One-page marketing |
| `/auth/login`, `/auth/cadastro` | Autenticação (desktop only) |
| `/onboarding/*` | Wizard Luna/Bruno → prefs → métricas → termos |
| `/app/*` | Portal logado (desktop only) |
| `/baixar-app` | Redirect mobile para lojas |
| `/privacidade`, `/termos`, `/cookies`, `/seguranca` | Páginas legais |

## CORS (API)

Adicione ao `CORS_ALLOWED_ORIGINS` em produção:

```
https://nutriplus.com.br,https://www.nutriplus.com.br,https://nutriplus-web.vercel.app
```

## Estrutura

```
src/
  design-system/     # tokens, componentes base, logo
  domain/            # entities, repository ports
  infrastructure/    # HTTP adapters, auth, tracing
  presentation/      # marketing, auth, onboarding, portal
```
