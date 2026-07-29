# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm start          # Dev server (react-scripts / CRA), porta 3000
npm run build      # Build de produção (pasta build/)
npm run build:deploy  # Roda deploy.sh (build + firebase deploy hosting)
npm test           # react-scripts test (sem testes reais no repo)
```

Não confundir com o projeto irmão `painel` (também um SPA React de admin do Oi Tickets, mas em Vite/Redux/Tailwind — este `admin` é um projeto CRA menor e separado, com propósito diferente: veja Arquitetura).

## Arquitetura

**Super-admin interno** (não é o painel usado pelos clientes/organizadores de evento). É uma CRA (react-scripts 5, React 17) com **Material-UI v4** + `styled-components`, roteada por `react-router-dom` v5 (`BrowserRouter`, não `HashRouter`). Único propósito: CRUD de **tenants** (organizações/clientes) da plataforma e desvínculo de dispositivos IMEI. Não lida com vendas, eventos, relatórios nem operação do dia a dia — isso é o `painel`.

### Acesso restrito a 2 UIDs hardcoded

`src/pages/Login/index.js` e `src/service/auth.js` fazem login via Firebase Auth (`signInWithEmailAndPassword`) mas só liberam a sessão se `user.uid` for um de dois UIDs fixos no código (`mIx721WKurVotrfVmggEOqKYCfl1` ou `mxG5BZs7hUd1qsas4wKH6Lh0fZg1`). Qualquer outro login autentica no Firebase mas é imediatamente deslogado (`signOut`). Não há checagem de role vinda do backend para controlar acesso — é uma allowlist de UID no cliente.

### Fluxo de login → backend

Após autenticar no Firebase, `Login/index.js` chama `POST /authenticateDash` com `{ userKey: user.uid }` (mesmo endpoint documentado em `server-node-backend/CLAUDE.md`), guarda o `token` retornado em `localStorage`, e o interceptor do axios em `src/api/index.js` anexa `Authorization: Bearer <token>` em todas as chamadas subsequentes.

### Firebase = fonte de verdade dos tenants

`src/firebase.js` conecta no projeto `oi-tickets` (mesmo projeto real de produção usado pelo `server-node-backend` e pelo `painel` — Realtime Database + Storage + Auth, sem emulador configurado). O node `Clients` no Realtime DB (`src/service/clients.js`, modelo em `src/models/Clients.js`) é a lista de tenants; é o mesmo node que `server-node-backend/src/services/DomainResolver.js` lê para resolver `eCommerce.webstoreUrl` → schema `DB<hash>`.

- **Criar tenant** (`src/pages/Orgs/form.js`, `handleSave`): cria usuário no Firebase Auth (`createUser`), gera `dbName = "DB" + sha1(Math.random())` (mesmo formato de schema que o backend Node espera), grava o registro em `Clients/<uid>` e um manager `master: true` em `Managers/<uid>`, faz upload de logos pro Firebase Storage, e por fim chama `POST https://api-databases.oitickets.com.br/newdatabase { database: dbName }` — um microsserviço externo (fora deste monorepo de projetos) que efetivamente provisiona o schema MySQL do tenant.
- **Editar tenant** (`handleEdit`): mesma lógica sem criar usuário nem chamar `/newdatabase`.
- **Excluir tenant** (`src/service/clients.js` `removeClient`): `DELETE /user/deleteClient/:uid` no backend Node (`apiadmin.oitickets.com.br`), não mexe direto no Firebase.
- Existe também uma rotina comentada (`Orgs/index.js` `handleUpdate`, atualmente desligada na UI) que itera todos os `Clients` e chama `POST https://api-databases.oitickets.com.br/updatedatabase` por `dbName` — provavelmente para rodar migrations em lote.

### Dispositivos (IMEI)

`src/pages/Imei/index.js` + `src/service/devices.js`: lista (`GET /admin/device`) e desvincula (`DELETE /admin/device/:imei`) dispositivos cashless vinculados a tenants, via API do backend Node — não via Firebase.

### Pagamento / split (config, não execução)

`src/pages/Orgs/formECommerce.js` edita, por tenant, a config de e-commerce armazenada no Firebase junto do cliente (campo `eCommerce`): toggle de **cartão de crédito** e **PIX**, taxa administrativa (fixa/percentual/mínima), toggle de **split** de pagamento com **Mercado Pago** (`gatewayToken` = ID da conta MP do tenant) e um botão que chama `GET /oauth/mercadopago/authorize?clientId=<id>` (contra `https://api.oitickets.com.br/api/v1`, hardcoded — não usa `REACT_APP_ENDPOINT`) para gerar a URL de autorização OAuth do Mercado Pago do tenant, copiável para enviar manualmente ao cliente. `src/pages/Orgs/form.js` também guarda `taxes: { pix, credit, debit }` (percentuais cobrados do tenant por método). Este projeto **não processa pagamentos nem tokeniza cartão** — só configura as taxas/flags que o `server-node-backend` usa em tempo de checkout (`mpPaymentContext.js` no backend).

### Não encontrado

Nenhuma referência a **comanda**, **mesa/camarote** (layout de mesas) neste projeto — não é escopo deste admin.

## Env vars para rodar localmente

Arquivo `.env.development` (já commitado, sem segredos — são só URLs):

```
REACT_APP_ENDPOINT=https://apiadmin.oitickets.com.br/api/v1   # base URL usada pelo axios em src/api/index.js
REACT_APP_ENDPOINT_DEFAULT=https://api.oitickets.com.br/api/v1  # não referenciado no código atual (dead env var)
```

Não há `.env.local` nem variável para apontar a um backend local — para rodar contra o `server-node-backend` local seria preciso editar `REACT_APP_ENDPOINT` manualmente (ex.: `http://localhost:3010/api/v1`).

Config do Firebase está **hardcoded** em `src/firebase.js` (não via env vars) e aponta sempre para o projeto real `oi-tickets` — não há emulador configurado, então qualquer teste local de login/CRUD de tenant afeta dados reais de produção.
