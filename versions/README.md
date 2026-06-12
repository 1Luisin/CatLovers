# Entradas por plataforma

As entradas públicas continuam separadas:

- `IOS/App.tsx`;
- `ANDROID/App.tsx`;
- `WEB/App.tsx`.

Cada entrada exporta a composição visual correspondente em `src/platforms`.
Telas, estilos e componentes com diferenças visuais permanecem específicos de
iOS, Android e Web. Hooks, serviços, tipos, temas e regras de domínio ficam em
`src` e são compartilhados.

`index.tsx` seleciona automaticamente a aplicação usando `Platform.OS`. Os
arquivos `index.ios.tsx`, `index.android.tsx` e `index.web.tsx` continuam
disponíveis para a resolução nativa do bundler.

Mudanças de regra de negócio devem ser feitas nos hooks, serviços ou utilitários
compartilhados. Ajustes de layout devem ser feitos no arquivo da plataforma
correspondente.
