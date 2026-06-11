# CatLovers

CatLovers é um aplicativo pessoal para casais organizarem planos, registrarem
lembranças e reunirem atividades que desejam compartilhar.

O projeto foi criado inicialmente para Letícia e Luis e está sendo desenvolvido
como uma aplicação multiplataforma para Android, iOS e web.

## Objetivo

O CatLovers busca ser um espaço privado e afetivo para:

- guardar lembranças do casal;
- planejar atividades e datas futuras;
- organizar filmes, séries, jogos, rolês e animes;
- acompanhar ideias e planos concluídos;
- personalizar a experiência de cada pessoa;
- centralizar momentos importantes em um único lugar.

## Estado atual

O projeto está na versão `1.1.0` e funciona como um protótipo local. A
navegação principal, o calendário de planos, a coleção de lembranças, os perfis
e a persistência no dispositivo já estão implementados.

### Perfis e aparência

- seleção entre os perfis de Letícia e Luis;
- edição de nome, data de nascimento, biografia e foto;
- preferências individuais salvas por perfil;
- temas Light mode, Dark mode, Cinnamoroll e Chococat;
- cores, superfícies, ilustrações e destaques adaptados ao tema ativo;
- transições animadas entre as áreas do aplicativo.

### Tela inicial

- saudação personalizada para o perfil ativo;
- destaque para o próximo plano;
- resumo de momentos salvos e ideias pendentes;
- exibição das três lembranças mais recentes;
- acesso direto à coleção completa.

### Coleção de lembranças

- categorias Filme, Série, Jogo, Rolê e Anime;
- criação e edição de lembranças;
- data do acontecimento selecionada por calendário;
- avaliação opcional de uma a cinco estrelas;
- foto opcional escolhida da galeria;
- agrupamento cronológico por mês;
- filtros combináveis por categoria, mês e avaliação.

### Planos do casal

- criação de planos com os tipos Filme, Série, Jogo, Rolê, Anime e Outros;
- data prevista opcional selecionada por calendário;
- calendário mensal navegável;
- agenda com os planos previstos ou concluídos em cada dia;
- lista geral de planos;
- marcação e desmarcação de planos como concluídos;
- registro da data de conclusão;
- progresso geral dos planos;
- criação e edição de uma meta compartilhada para o mês.

## Fluxo do aplicativo

1. O usuário escolhe o perfil de Letícia ou Luis.
2. A tela inicial apresenta o próximo plano e um resumo dos registros.
3. A coleção reúne as lembranças e permite criar, editar e filtrar registros.
4. A área de planos organiza ideias em uma lista e em um calendário.
5. A meta mensal registra um objetivo compartilhado pelo casal.
6. A área de perfil permite editar dados pessoais, foto, tema e preferências.
7. A opção de troca de perfil retorna à seleção inicial.

## Limitações atuais

- os dados existem somente no aparelho ou navegador em uso;
- não há autenticação, contas online ou sincronização entre dispositivos;
- as preferências de notificações e pergunta semanal ainda não executam ações;
- lembranças e planos ainda não podem ser excluídos;
- planos existentes ainda não possuem fluxo de edição;
- alguns textos da tela inicial e a referência da meta mensal estão fixos em
  junho de 2026;
- as fotos são salvas por URI local e podem deixar de funcionar caso o arquivo
  original seja removido ou alterado pelo sistema;
- ainda não existe configuração de build e distribuição com EAS;
- não há testes automatizados.

## Tecnologias

- [Expo](https://expo.dev/) SDK 54
- [React](https://react.dev/) 19
- [React Native](https://reactnative.dev/) 0.81
- [React Native Web](https://necolas.github.io/react-native-web/)
- [TypeScript](https://www.typescriptlang.org/) com modo estrito
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)
- [Expo Vector Icons](https://docs.expo.dev/guides/icons/)
- API `Animated` do React Native

## Estrutura atual

```text
CatLovers/
|-- assets/
|   `-- themes/
|       |-- README.md
|       |-- chococat.png
|       `-- cinnamoroll.png
|-- App.tsx            # Telas, componentes, estado, persistência e estilos
|-- PRIVACIDADE_E_DADOS.md # Política técnica atual e planejada
|-- app.json           # Configuração do Expo, Android, iOS e web
|-- package.json       # Dependências e scripts
|-- package-lock.json  # Versões fixadas das dependências
|-- tsconfig.json      # Configuração estrita do TypeScript
|-- .gitignore
`-- README.md
```

Neste estágio, a implementação está centralizada em `App.tsx`. O crescimento do
produto exigirá a separação de telas, componentes, modelos, serviços,
navegação, temas e regras de negócio em módulos próprios.

## Persistência de dados

Os dados são armazenados localmente com `AsyncStorage`.

Chaves utilizadas:

- `@catlovers/items`: lembranças e planos;
- `@catlovers/profiles`: dados, temas e preferências dos perfis;
- `@catlovers/monthly-goals`: metas mensais do casal.

Ao iniciar, o aplicativo também normaliza alguns registros antigos, incluindo
acentuação, datas previstas e datas de conclusão.

Essa estratégia atende ao protótipo atual, mas não sincroniza informações entre
o site e os aplicativos instalados em outros dispositivos.

## Configuração do aplicativo

- nome: `CatLovers`;
- slug Expo: `catlovers`;
- versão: `1.1.0`;
- orientação: retrato;
- estilo de interface: claro;
- identificador iOS: `com.catlovers.app`;
- pacote Android: `com.catlovers.app`;
- tablets iOS: não suportados;
- bundler web: Metro.

O seletor de imagens solicita acesso à galeria somente para fotos de perfil e
lembranças. O aplicativo não solicita acesso ao microfone.

## Como executar

### Pré-requisitos

- Node.js compatível com Expo SDK 54;
- npm;
- Expo Go em um dispositivo móvel ou um emulador configurado.

### Instalação

```bash
git clone https://github.com/1Luisin/CatLovers.git
cd CatLovers
npm ci
```

O `npm ci` instala exatamente as versões registradas no `package-lock.json`.
Sem essa etapa, comandos como `npm start` não encontram o executável local do
Expo.

### Iniciar o projeto

```bash
npm start
```

O Expo exibirá as opções para abrir a aplicação em um dispositivo, emulador ou
navegador.

Também estão disponíveis:

```bash
npm run android
npm run ios
npm run web
```

Para testar em um iPhone durante o desenvolvimento:

1. instale o Expo Go pela App Store;
2. mantenha o computador e o iPhone na mesma rede;
3. execute `npm start`;
4. escaneie o QR Code exibido pelo Expo.

O simulador de iOS exige macOS com o ambiente da Apple configurado. O projeto
ainda não possui `eas.json` nem um fluxo configurado para gerar builds
independentes para TestFlight ou App Store.

### Verificação de tipos

```bash
npm run typecheck
```

## Próximos passos

- substituir datas e mês fixos por referências dinâmicas;
- permitir editar e excluir planos;
- permitir excluir lembranças;
- implementar notificações e lembretes reais;
- implementar a pergunta semanal;
- adicionar autenticação, banco de dados e sincronização segura;
- tornar as imagens persistentes entre dispositivos;
- separar a arquitetura em módulos;
- adicionar testes automatizados;
- configurar EAS Build, TestFlight e distribuição Android;
- evoluir a experiência web.

## Privacidade

Na versão atual, perfis, preferências, lembranças, fotos referenciadas, planos e
metas ficam no armazenamento local do dispositivo ou navegador. A arquitetura
planejada prevê autenticação, API, banco de dados e sincronização segura.

O tratamento atual e os requisitos para essa integração estão documentados em
[`PRIVACIDADE_E_DADOS.md`](./PRIVACIDADE_E_DADOS.md).

## Imagens dos temas

As imagens de Cinnamoroll e Chococat foram obtidas de páginas oficiais da
Sanrio. As fontes e observações de direitos autorais estão documentadas em
`assets/themes/README.md`.

Essas imagens são usadas apenas neste protótipo pessoal e não são
relicenciadas pelo repositório.

## Projeto pessoal

CatLovers é um projeto pessoal, criado para organizar e preservar experiências
compartilhadas de Letícia e Luis. O repositório não possui, neste momento, uma
licença de uso público.
