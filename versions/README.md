# Entradas por plataforma

O CatLovers possui pontos de entrada separados para:

- `IOS/App.tsx`;
- `ANDROID/App.tsx`;
- `WEB/App.tsx`.

Os três arquivos carregam `src/CatLoversApp.tsx`, que contém a implementação
compartilhada. Essa organização mantém funcionalidades, dados, componentes,
animações e design idênticos nas três plataformas.

Os arquivos `index.ios.tsx`, `index.android.tsx` e `index.web.tsx` usam a
resolução de plataforma do React Native para selecionar a entrada correta
durante o build.
