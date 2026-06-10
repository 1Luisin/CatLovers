# CatLovers

CatLovers é um aplicativo pessoal para casais organizarem planos, registrarem
memórias e reunirem atividades que desejam compartilhar.

O projeto foi criado inicialmente para Letícia e Luis e está sendo desenvolvido
como uma aplicação multiplataforma para Android, iOS e web.

## Objetivo

O CatLovers busca ser um espaço privado e afetivo para:

- guardar memórias do casal;
- planejar atividades e datas futuras;
- organizar filmes, séries, jogos e outros conteúdos;
- acompanhar ideias e planos concluídos;
- personalizar a experiência de cada pessoa;
- centralizar momentos importantes em um único lugar.

## Estado atual

O projeto está na fase de protótipo funcional. A navegação principal, a
identidade visual e a persistência local já estão implementadas.

### Funcionalidades disponíveis

- seleção entre dois perfis locais;
- tela inicial com próximo momento, resumo e memórias recentes;
- coleção de filmes, séries e jogos;
- filtros por categoria na coleção;
- lista de planos do casal;
- acompanhamento do progresso dos planos;
- cadastro de filmes, séries, jogos e planos;
- marcação de registros como concluídos;
- perfil individual com nome, nascimento, biografia e foto;
- seleção de tema por perfil;
- preferências individuais;
- armazenamento local dos perfis e registros.

### Limitações atuais

- os dados existem somente no aparelho ou navegador em uso;
- não há autenticação ou contas online;
- não há sincronização entre dispositivos;
- datas e alguns indicadores ainda são demonstrativos;
- as preferências de notificações ainda não disparam notificações reais;
- registros não podem ser editados ou excluídos;
- ainda não existe uma integração completa com calendário;
- algumas categorias planejadas, como animes, ainda não possuem fluxo próprio.

## Fluxo do aplicativo

1. O usuário escolhe o perfil de Letícia ou Luis.
2. A tela inicial apresenta o próximo momento e um resumo dos registros.
3. A coleção reúne filmes, séries e jogos.
4. A área de planos mostra atividades futuras e o progresso do casal.
5. O botão de adição cria um novo registro compartilhado.
6. A área de perfil permite editar dados pessoais, foto, tema e preferências.
7. A opção de troca de perfil retorna à seleção inicial.

## Tecnologias

- [Expo](https://expo.dev/) SDK 54
- [React](https://react.dev/) 19
- [React Native](https://reactnative.dev/) 0.81
- [React Native Web](https://necolas.github.io/react-native-web/)
- [TypeScript](https://www.typescriptlang.org/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)
- [Expo Vector Icons](https://docs.expo.dev/guides/icons/)

## Estrutura atual

```text
CatLovers/
|-- App.tsx            # Telas, componentes, estado e estilos
|-- app.json           # Configuração do Expo, Android, iOS e web
|-- package.json       # Dependências e scripts
|-- package-lock.json  # Versões fixadas das dependências
|-- tsconfig.json      # Configuração do TypeScript
|-- .gitignore
`-- README.md
```

Neste estágio, a aplicação está centralizada em `App.tsx`. Conforme o projeto
crescer, a tendência é separar telas, componentes, modelos, serviços,
navegação, temas e regras de negócio em módulos próprios.

## Persistência de dados

Os dados são armazenados localmente com `AsyncStorage`.

Chaves utilizadas:

- `@catlovers/items`: filmes, séries, jogos, memórias e planos;
- `@catlovers/profiles`: dados e preferências dos perfis.

Essa estratégia é adequada ao protótipo atual, mas não sincroniza informações
entre o site e os aplicativos instalados em outros dispositivos.

## Como executar

### Pré-requisitos

- Node.js em uma versão compatível com Expo SDK 54;
- npm;
- Expo Go em um dispositivo móvel, ou um emulador configurado.

### Instalação

```bash
git clone https://github.com/1Luisin/CatLovers.git
cd CatLovers
npm install
```

### Iniciar o projeto

```bash
npm start
```

O Expo exibirá as opções para abrir a aplicação em um dispositivo, emulador ou
navegador.

Também estão disponíveis os comandos:

```bash
npm run android
npm run ios
npm run web
```

Para executar no simulador de iOS, é necessário usar macOS com o ambiente da
Apple configurado. Um dispositivo físico também pode acessar o projeto pelo
Expo Go.

### Verificação de tipos

```bash
npm run typecheck
```

## Direção planejada

Os próximos ciclos podem incluir:

- calendário real para planos e datas especiais;
- categorias adicionais, incluindo animes;
- edição, exclusão e pesquisa de registros;
- fotos e anexos nas memórias;
- avaliações e estados mais completos para conteúdos;
- notificações e lembretes;
- perguntas semanais para o casal;
- organização por listas e prioridades;
- autenticação e sincronização segura;
- banco de dados e backend;
- evolução da experiência web;
- testes automatizados;
- separação da arquitetura em módulos.

As prioridades devem acompanhar o uso real do casal e a evolução do escopo do
produto.

## Privacidade

Na versão atual, perfis, preferências e registros ficam somente no
armazenamento local do dispositivo ou navegador. Não há envio desses dados para
um servidor do CatLovers.

## Projeto pessoal

CatLovers é um projeto pessoal, criado para organizar e preservar experiências
compartilhadas de Letícia e Luis. O repositório não possui, neste momento, uma
licença de uso público.
