# CatLovers

CatLovers é um aplicativo pessoal para Luis e Letícia registrarem memórias,
organizarem planos e personalizarem a experiência de cada perfil.

O app usa Expo/React Native em Android, iOS e web. A entrada continua sendo pela
escolha entre os perfis de Luis e Letícia. Não existe login, senha, JWT,
cadastro por e-mail ou refresh token nesta versão.

## Arquitetura

```text
CatLovers/
|-- assets/themes/              # Imagens dos temas
|-- src/
|   |-- components/             # Componentes visuais compartilhados
|   |-- data/                   # Perfis e dados iniciais
|   |-- screens/                # Contêineres de telas compartilhados
|   |-- services/
|   |   |-- apiClient.ts        # HTTP, mapeamento e upload
|   |   `-- storageService.ts   # Cache AsyncStorage
|   |-- theme/themes.ts         # Paletas e assets
|   `-- types/index.ts          # Tipos de domínio
|-- versions/                   # Interfaces específicas de iOS, Android e web
|-- backend/
|   |-- src/routes/             # Endpoints Express
|   |-- src/repositories/       # Consultas PostgreSQL
|   |-- src/scripts/            # Seed idempotente
|   |-- sql/                    # Melhorias opcionais, não aplicadas
|   `-- uploads/                # Arquivos locais enviados
`-- App.tsx                     # Entrada/orquestração do Expo
```

O AsyncStorage agora funciona como cache: o app carrega o conteúdo local
primeiro, tenta sincronizar com a API e mantém o cache quando a API está
indisponível. Escritas atualizam a interface localmente e usam o retorno da API
como fonte oficial quando a chamada funciona.

## Requisitos

- Node.js 20 ou superior
- npm
- PostgreSQL com as tabelas já criadas
- Expo Go, emulador ou navegador

## Frontend

```bash
npm ci
copy .env.example .env
npm start
```

O `.env` do frontend usa:

```env
EXPO_PUBLIC_API_URL=http://localhost:3333
```

No Android Emulator, use normalmente `http://10.0.2.2:3333`. Em celular físico,
use o IP da máquina na mesma rede, por exemplo
`http://192.168.1.20:3333`. Reinicie o Metro depois de alterar a variável.

Comandos disponíveis:

```bash
npm run android
npm run ios
npm run web
npm run typecheck
```

## Backend

```bash
cd backend
npm install
copy .env.example .env
```

Configure `backend/.env`:

```env
PORT=3333
DATABASE_URL=postgres://app_user:SUA_SENHA@localhost:5432/app_casal
UPLOAD_DIR=uploads
PUBLIC_BASE_URL=http://localhost:3333
```

Depois execute:

```bash
npm run seed
npm run dev
```

O seed usa `ON CONFLICT (code) DO NOTHING`, cria somente os perfis ausentes e
não altera nem remove tabelas. A API gera UUIDs com `crypto.randomUUID()`.

Verificações:

```bash
npm run typecheck
npm run build
curl http://localhost:3333/health
```

## Endpoints

- `GET /health`
- `GET|POST /profiles`
- `GET|PUT /profiles/:id`
- `PATCH /profiles/:id/settings`
- `POST /profiles/:id/photo`
- `GET|POST /items`
- `GET|PUT|DELETE /items/:id`
- `PATCH /items/:id/toggle-done`
- `POST /items/:id/photo`
- `GET /monthly-goals`
- `GET|PUT /monthly-goals/:monthKey`
- `GET /uploads/:fileName`

Uploads aceitam JPEG, PNG e WebP de até 10 MB. Uma nova foto de item substitui
a anterior e o arquivo antigo é removido.

## Testar no DBeaver

1. Abra a conexão usada em `DATABASE_URL`.
2. Execute `npm run seed` no backend.
3. Confirme os perfis:

```sql
SELECT id, code, name, theme FROM profiles ORDER BY code;
```

4. Com a API em execução, crie ou edite dados no app e consulte:

```sql
SELECT * FROM couple_items ORDER BY created_at DESC;
SELECT * FROM monthly_goals ORDER BY month_key DESC;
SELECT * FROM item_photos ORDER BY created_at DESC;
```

O arquivo `backend/sql/optional_improvements.sql` contém apenas índices
opcionais e nunca é executado automaticamente.

## Testar upload

Com um UUID de perfil existente:

```bash
curl -X POST http://localhost:3333/profiles/UUID/photo \
  -F "photo=@C:/caminho/foto.jpg"
```

Para um item:

```bash
curl -X POST http://localhost:3333/items/UUID/photo \
  -F "photo=@C:/caminho/memoria.png"
```

A resposta deve trazer uma URL em `/uploads/...`. Abra essa URL no navegador e
confirme o registro em `profiles.photo_url` ou `item_photos`.

## Temas e regras preservadas

As únicas aparências disponíveis são:

- Light;
- Dark;
- Cinnamoroll;
- Chococat.

Valores gravados por versões antigas são migrados automaticamente ao carregar
o cache ou mapear respostas da API:

- `Romance`, `Lavanda` e `Floresta` viram `Light`;
- `Noite` vira `Dark`.

- categoria `Plano` representa plano; as demais representam memória;
- memórias nascem concluídas e podem ter avaliação e foto;
- planos nascem pendentes e podem ter data prevista;
- concluir um plano preenche `completed_on`;
- desmarcar um plano limpa `completed_on`;
- metas mensais usam `YYYY-MM`;
- cada perfil mantém tema, foto e preferências próprias.

A antiga opção de perfil privado foi removida. Memórias, planos e metas são
dados compartilhados entre Luis e Letícia pela API e pelo banco. A escolha de
perfil serve para selecionar identidade visual e preferências, não para criar
uma área isolada ou autenticada.

## Limitações atuais

- não há autenticação ou autorização; a API deve ficar em ambiente privado;
- não há login, senha, JWT, cadastro de conta ou refresh token;
- uploads usam o disco local do servidor, não armazenamento em nuvem;
- não existe fila offline ou resolução de conflitos;
- notificações e pergunta semanal continuam apenas como preferências;
- as interfaces específicas de plataforma ainda mantêm parte da composição
  visual duplicada enquanto os tipos, dados e serviços já são compartilhados.
