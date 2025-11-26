# Frontend checklist: `/broadcasting/auth` com Sanctum (SPA)

- **Pré-cookies**: antes de instanciar Echo/Pusher faça `GET https://localhost:8686/sanctum/csrf-cookie` com `credentials: 'include'`/`withCredentials: true` para receber `XSRF-TOKEN` + cookie de sessão (`handscores-api-session` vem com `SameSite=None; Secure` e precisa de HTTPS).
- **Origem**: as XHR devem sair de `http://localhost:5174` e incluir `credentials: 'include'` para que os cookies viagem para `https://localhost:8686`.
- **Echo auth**: configure `authEndpoint: 'https://localhost:8686/broadcasting/auth'` e `auth: { withCredentials: true, headers: token ? { Authorization: \`Bearer ${token}\` } : {} }`. Se o front só tiver token (sem sessão), mantenha o `Authorization` — o backend aceita cookie stateful ou bearer.
- **Sequência recomendada**:
  1. `await fetch('https://localhost:8686/sanctum/csrf-cookie', { method: 'GET', credentials: 'include' })`.
  2. Criar Echo com as opções acima (TLS ligado para HTTPS).
  3. Assinar canais privados/presença normalmente.
- **Debug 403**: se falhar a autenticação, verifique no backend o log `BROADCAST CHANNEL AUTH DEBUG` (mostra `user_id`, `guard`, `guards`, `session_id`) para saber se o request chegou com bearer ou sessão.
