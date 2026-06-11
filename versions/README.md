# Aplicações por plataforma

O CatLovers possui três implementações completas e independentes:

- `IOS/App.tsx`: preserva o design móvel original para iPhone;
- `ANDROID/App.tsx`: mantém as funcionalidades com navegação, áreas de toque,
  elevação e modais adaptados ao Android;
- `WEB/App.tsx`: mantém as funcionalidades com layout responsivo, navegação
  lateral em desktop, conteúdo amplo e modais centralizados.

Nenhuma dessas aplicações importa a implementação de outra plataforma. Cada
arquivo contém telas, estado, persistência, formulários, filtros, calendário,
temas e animações completos.

Os arquivos `index.ios.tsx`, `index.android.tsx` e `index.web.tsx` usam a
resolução de plataforma do React Native para selecionar a aplicação correta
durante a execução e o build.

## Regra de manutenção

Mudanças de regra de negócio ou novas funcionalidades devem ser avaliadas e
aplicadas nas três implementações para manter paridade. Ajustes estritamente
visuais podem permanecer específicos da plataforma.
