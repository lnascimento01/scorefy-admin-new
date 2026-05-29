# Fluxo técnico de súmula e assinatura digital

## Fluxo atual da súmula

No backend `handscores-api`, a rota atual é:

```text
GET /api/v1/auth/matches/{match}/scoresheet
```

No arquivo `routes/api.php`, ela está registrada dentro do grupo protegido por `auth:sanctum`:

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('matches/{match}/scoresheet', [ScoresheetController::class, 'show']);
});
```

O controller é `App\Http\Controllers\Api\V1\ScoresheetController`. Ele:

- resolve a policy de `MatchModel` e chama `authorize('view', $match)` quando a policy existir;
- bloqueia a geração quando `MatchLifecycleState::fromMatch($match) !== MatchLifecycleState::FINISHED`;
- chama `App\Services\Pdf\ScoresheetPdf::render($match)`;
- retorna JSON com `filename`, `mime` e `base64`.

A resposta atual não é stream nem download binário direto. O PDF é retornado como JSON base64:

```json
{
  "filename": "sumula-135.pdf",
  "mime": "application/pdf",
  "base64": "..."
}
```

O serviço `ScoresheetPdf` monta um `ScoresheetViewModel`, renderiza HTML via Blade (`pdf.relatorio-jogo`) e gera o PDF com DomPDF (`Barryvdh\DomPDF\Facade\Pdf`). A geração é on-demand: não há persistência de arquivo ou registro de súmula no fluxo atual observado.

Dados usados pelo `ScoresheetViewModel`:

- partida, status, placar final e horário (`MatchModel`);
- competição, temporada, fase/grupo e categoria;
- ginásio/cidade;
- equipes mandante/visitante;
- lineups e jogadores;
- estatísticas por jogador (`PlayerMatchStat`);
- eventos da partida (`MatchEvent`) para gols por período, 7 metros e timeouts;
- staff das equipes;
- oficiais em `match.meta.officials`.

## Fluxo atual no admin

No admin `scorefy-admin`, a ação fica em:

- `src/modules/matches/components/MatchActionsMenu.tsx`
- `src/modules/matches/pages/MatchesPage.tsx`
- `src/modules/match-control/services/scoresheet.service.ts`

Antes desta etapa, a opção `Súmula` chamava `ScoresheetGateway.fetch(matchId)` diretamente e baixava o arquivo com `downloadBase64File`.

A exibição da opção já dependia de `getMatchActionCapabilities(match.status).canGenerateScoresheet`, que só retorna `true` para status canônico `finished`.

## Novo fluxo de preview

A opção `Súmula` agora navega para:

```text
GET /matches/{match}/scoresheet/preview
```

A tela carrega os dados da partida pelo endpoint de detalhe já usado no admin e reutiliza a mesma regra visual de status finalizado. Quando a partida está finalizada, a tela busca o PDF pelo endpoint atual de súmula e cria uma URL temporária em memória para exibir o arquivo em `iframe`.

O botão `Baixar súmula` preserva o contrato existente: ele chama novamente `GET /v1/auth/matches/{match}/scoresheet` via `ScoresheetGateway.fetch()` e dispara o download local do base64 retornado.

O botão `Enviar para assinatura` é apenas informativo nesta etapa. Ele não chama Autentique, ZapSign ou qualquer endpoint externo.

## Estrutura futura para assinatura digital

Tabela conceitual `scoresheet_signature_processes`:

- `id`
- `match_id`
- `provider`
- `provider_document_id`
- `status`
- `scoresheet_hash` ou `scoresheet_version`
- `requested_by`
- `sent_at`
- `canceled_at`
- `invalidated_at`
- `completed_at`
- `metadata`
- `created_at`
- `updated_at`

Tabela conceitual `scoresheet_signature_signers`:

- `id`
- `signature_process_id`
- `name`
- `email`
- `phone`
- `role`
- `provider_signer_id`
- `status`
- `signed_at`
- `metadata`
- `created_at`
- `updated_at`

Regra anti-duplicidade:

- não pode existir mais de um processo ativo por `match_id` e versão/hash de súmula;
- status ativos prováveis: `draft`, `pending`, `sent`, `waiting_signatures`, `processing`;
- status que liberam novo processo: `canceled`, `invalidated`, `expired`, `rejected`, `completed`.

Essa regra deve ser validada no backend antes de iniciar envio ao provedor. A UI pode consultar e refletir o estado, mas não deve ser a barreira crítica.

## Pontos pendentes

- Definir provedor inicial: Autentique ou ZapSign.
- Definir como calcular `scoresheet_hash` ou `scoresheet_version`.
- Criar migration/model/policy para processos e signatários.
- Criar endpoint backend para consultar processo ativo da súmula.
- Criar endpoint backend para iniciar processo, com validação transacional anti-duplicidade.
- Definir webhooks do provedor e mapeamento de status.
- Definir signatários obrigatórios e signatários extras por competição/federação.
