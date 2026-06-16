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

## Notificações

O toggle **Lembretes do casal** solicita a permissão específica de Android,
iOS ou Web. Depois da autorização, o app envia a notificação de teste
`Notificação ativa :3` e registra o aparelho na API.

No Android, o Expo Go não oferece notificações push remotas desde o Expo SDK
53. Para testar o fluxo completo, use um development build:

```bash
eas build --platform android --profile development
```

O APK gerado com o perfil `preview` também possui suporte, desde que o Firebase
Cloud Messaging esteja configurado antes do build. Dentro do Expo Go, o
aplicativo mantém o toggle desligado e apresenta essa orientação sem tentar
registrar o aparelho.

Para Android, é obrigatório:

1. criar ou abrir um projeto no Firebase;
2. adicionar um app Android com o pacote `com.catlovers.app`;
3. baixar o arquivo `google-services.json`;
4. fornecer esse arquivo ao EAS de uma das duas formas abaixo;
5. gerar uma Google Service Account Key para FCM V1 no Firebase;
6. cadastrar essa chave no EAS com `eas credentials` ou pelo painel da Expo;
7. gerar um novo APK depois disso.

Opção simples: colocar o `google-services.json` na raiz do projeto e commitar o
arquivo. O EAS só envia arquivos rastreados pelo Git para o build remoto:

```bash
git add google-services.json
git commit -m "Adiciona configuração Firebase Android"
git push
```

Opção sem commitar o arquivo: criar uma variável de ambiente de arquivo no EAS
chamada `GOOGLE_SERVICES_JSON`, usando o arquivo `google-services.json`. O
`app.config.js` usa `process.env.GOOGLE_SERVICES_JSON` quando a variável existe
e volta para `./google-services.json` em desenvolvimento local. Crie a variável
nos ambientes que você usa para build, por exemplo `development` e `preview`.

```bash
eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret --environment development --environment preview
```

O arquivo `google-services.json` identifica o app Android no Firebase e precisa
entrar no APK. A service account FCM V1 contém chave privada, não deve ser
commitada e deve ser enviada apenas para as credenciais do EAS.

As notificações incluem:

- criação de uma meta mensal;
- criação de um plano;
- criação de uma lembrança;
- aviso às 09:00 do dia anterior a um plano com data definida.

Como os planos ainda não possuem horário, o lembrete considera o evento às
09:00 no fuso `America/Sao_Paulo`. A pergunta semanal permanece vinculada à
preferência existente e poderá usar o mesmo canal quando sua configuração de
dia, horário e conteúdo for implementada.

Android e iOS usam Expo Push Notifications. Builds EAS devem possuir as
credenciais de push configuradas para cada plataforma. A Web usa Push API,
Service Worker e chaves VAPID geradas automaticamente e armazenadas no banco.
As tabelas necessárias são criadas de forma idempotente na inicialização da
API; o SQL equivalente está em `backend/sql/notifications.sql`.

## Limitações

- a API não possui autenticação ou autorização e deve ficar em ambiente privado;
- uploads usam o disco local do servidor;
- não há fila offline nem resolução automática de conflitos;
- a pergunta semanal ainda não possui configuração de conteúdo ou agenda.
