# CatLovers

Aplicativo Expo/React Native para Luis e Letícia registrarem memórias, planos e
metas mensais. O projeto possui interfaces próprias para iOS, Android e Web,
com regras de domínio, API e cache compartilhadas.

Não há login, cadastro, JWT ou perfil privado. Os temas disponíveis são
`Light`, `Dark`, `Cinnamoroll` e `Chococat`.

## Arquitetura

```text
CatLovers/
|-- src/
|   |-- components/
|   |   |-- common/              # Componentes visuais por plataforma
|   |   `-- forms/               # Formulários e modais por plataforma
|   |-- data/                    # Constantes e opções da interface
|   |-- features/
|   |   |-- goals/               # Metas mensais
|   |   |-- home/                # Tela inicial
|   |   |-- memories/            # Memórias, filtros e uploads
|   |   |-- plans/               # Planos e conclusão
|   |   |-- profiles/            # Perfis e foto de perfil
|   |   `-- settings/            # Preferências por perfil
|   |-- platforms/
|   |   |-- android/             # Composição e estilos Android
|   |   |-- ios/                 # Composição e estilos iOS
|   |   `-- web/                 # Composição e estilos Web
|   |-- services/                # Cliente HTTP e cache AsyncStorage
|   |-- theme/                   # Fonte única de temas
|   |-- types/                   # Tipos de domínio
|   `-- utils/                   # Datas, imagens, plataforma e validação
|-- versions/                    # Entradas estáveis de cada plataforma
|-- backend/                     # API Node/Express e PostgreSQL
|-- app.json                     # Configuração Expo
`-- eas.json                     # Perfis de build EAS
```

`versions/index.tsx` usa `Platform.OS` para selecionar a entrada correta.
Os arquivos `versions/IOS/App.tsx`, `versions/ANDROID/App.tsx` e
`versions/WEB/App.tsx` continuam separados e encaminham para a composição
visual correspondente em `src/platforms`.

Os hooks em `src/features` centralizam carregamento, cache, operações
otimistas, persistência e uploads. Os componentes visuais consomem esses hooks
sem duplicar as regras de API entre plataformas.

## Requisitos

- Node.js 20 ou superior
- npm
- PostgreSQL com as tabelas do projeto
- Expo Go, emulador Android, simulador iOS ou navegador
- macOS com Xcode para executar o simulador iOS localmente

## Backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Configure `backend/.env`:

```env
PORT=3333
DATABASE_URL=postgres://app_user:SUA_SENHA@localhost:5432/app_casal
UPLOAD_DIR=uploads
PUBLIC_BASE_URL=http://localhost:3333
```

Inicie o banco configurado e execute:

```powershell
npm run seed
npm run dev
```

O seed é idempotente e não remove tabelas. Para validar o backend:

```powershell
npm run typecheck
npm run build
```

## Frontend

Na raiz do projeto:

```powershell
npm ci
Copy-Item .env.example .env
```

Configure a URL da API:

```env
EXPO_PUBLIC_API_URL=http://localhost:3333
```

Use `localhost` no navegador e no simulador iOS. No Android Emulator, use
`http://10.0.2.2:3333`. Em aparelho físico, use o IP da máquina na mesma rede,
por exemplo `http://192.168.1.20:3333`. Reinicie o Metro após alterar o `.env`.

### Web

```powershell
npm run web
```

Para gerar o bundle estático:

```powershell
npm run export:web
```

### Android

Com um emulador aberto ou aparelho conectado:

```powershell
npm run android
```

Também é possível executar `npm start` e abrir o projeto no Expo Go. Para gerar
um APK interno pelo EAS:

```powershell
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

O perfil `preview` em `eas.json` usa `buildType: apk`. Produção gera Android App
Bundle com o perfil `production`.

### iOS

No macOS com Xcode e um simulador disponível:

```bash
npm run ios
```

Em um iPhone, execute `npm start` e abra o QR code no Expo Go. Para um build
interno assinado pelo EAS:

```bash
npx eas-cli login
npx eas-cli build --platform ios --profile preview
```

O simulador iOS não pode ser executado localmente no Windows, mas o build EAS
pode ser solicitado a partir do Windows.

## Verificações

```powershell
npm run typecheck
npm run export:web
npm run export:android
npm run export:ios
```

## Regras preservadas

- itens cuja categoria é `Plano` são planos; os demais são memórias;
- memórias começam concluídas e podem ter nota de 1 a 5 e imagem;
- planos começam pendentes, podem ter `planned_for` e recebem `completed_on`
  quando concluídos;
- desmarcar um plano limpa `completed_on`;
- metas mensais usam `YYYY-MM`;
- tema, foto e preferências pertencem ao perfil selecionado;
- memórias, planos e metas são compartilhados entre Luis e Letícia;
- API e uploads usam `EXPO_PUBLIC_API_URL`;
- AsyncStorage funciona como cache local.

## Limitações

- a API não possui autenticação ou autorização e deve ficar em ambiente privado;
- uploads usam o disco local do servidor;
- não há fila offline nem resolução automática de conflitos;
- notificações e pergunta semanal permanecem apenas como preferências.
