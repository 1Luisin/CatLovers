# Privacidade e dados do CatLovers

Última atualização: 15 de junho de 2026.

## 1. Escopo

Este documento descreve como o CatLovers trata dados no aplicativo pessoal
atual e quais proteções adicionais serão necessárias se ele for publicado
fora do ambiente privado de Luis e Letícia.

O documento deve ser revisado antes de uma publicação comercial. O canal de
contato do responsável pelo tratamento também deve ser definido antes da
entrada em produção.

## 2. Dados tratados

O CatLovers pode tratar:

- nome, data de nascimento, biografia e foto de perfil;
- preferências do perfil e uma das aparências Light, Dark, Cinnamoroll ou
  Chococat;
- lembranças, descrições, categorias, datas, avaliações e imagens;
- planos, datas previstas, datas de conclusão e metas mensais;
- identificadores técnicos necessários para sincronização;
- identificador da instalação e token ou assinatura de notificação;
- registros técnicos de segurança, erros e acesso, quando implementados.

O aplicativo não deve solicitar dados que não sejam necessários para suas
funcionalidades.

## 3. Situação atual

O aplicativo usa o `AsyncStorage` como cache local e sincroniza perfis,
lembranças, planos e metas com uma API PostgreSQL quando ela está disponível.
Fotos selecionadas podem ser enviadas ao servidor e servidas por URL.

A entrada ainda ocorre apenas pela escolha de perfil. Não há autenticação,
senha, JWT ou controle de autorização nesta etapa, portanto a API deve ser
mantida em rede e ambiente privados.

Memórias, planos, metas e fotos são dados compartilhados entre os perfis de
Luis e Letícia. A antiga opção de perfil privado foi removida e não representa
uma separação de acesso ou de dados.

Valores antigos de aparência são migrados automaticamente: Romance, Lavanda e
Floresta passam a Light, enquanto Noite passa a Dark.

Quando os lembretes são ativados, o CatLovers registra um identificador
aleatório da instalação, o perfil associado, a plataforma e o Expo Push Token
ou a assinatura Web Push. Também mantém o controle técnico dos lembretes já
enviados para evitar duplicidade. Esses dados são usados somente para avisar
sobre metas, planos, lembranças e eventos próximos.

O usuário pode desativar os lembretes no perfil e também revogar a permissão
nas configurações do Android, iPhone ou navegador.

## 4. Segurança futura

Se o aplicativo for publicado fora do ambiente pessoal, a API deverá:

- usar conexão segura;
- exigir autenticação e autorização;
- limitar cada usuário aos dados do casal vinculado à sua conta;
- registrar somente informações técnicas necessárias para segurança;
- informar mudanças relevantes neste documento.

## 5. Finalidades

Os dados serão usados para:

- criar e manter os perfis;
- sincronizar lembranças, planos e preferências entre dispositivos;
- compartilhar os registros entre Luis e Letícia;
- exibir calendários, metas, avaliações e histórico;
- proteger a conta, investigar falhas e prevenir acesso indevido;
- atender solicitações relacionadas aos dados.

## 6. Compartilhamento

O CatLovers não deve vender dados pessoais.

O acesso poderá ser concedido somente a fornecedores necessários para operar
infraestrutura, banco, armazenamento, autenticação, monitoramento e suporte.
Esses fornecedores deverão receber apenas os dados necessários à atividade
contratada e estar sujeitos a obrigações de segurança e confidencialidade.

Luis e Letícia podem acessar os registros compartilhados do casal. A escolha
de perfil personaliza a experiência, mas não funciona como controle de acesso.

## 7. Retenção e exclusão

Os dados devem ser mantidos enquanto a conta estiver ativa ou enquanto forem
necessários para prestar o serviço e cumprir obrigações aplicáveis.

Quando a exclusão de conta for implementada, o fluxo deverá informar:

- quais dados serão excluídos imediatamente;
- quais cópias permanecerão temporariamente em backups;
- o prazo previsto para eliminação;
- eventuais hipóteses de conservação exigidas por lei.

## 8. Segurança

Antes de uma publicação externa, a arquitetura deverá adotar, no mínimo:

- comunicação HTTPS;
- senhas armazenadas somente por mecanismo seguro de hash;
- controle de acesso por usuário e casal;
- proteção de chaves e segredos fora do código-fonte;
- backups protegidos;
- registro e tratamento de incidentes;
- atualização periódica das dependências.

Nenhum sistema é totalmente imune a incidentes. Caso um incidente relevante
ocorra, os responsáveis deverão avaliar as medidas de contenção e as
comunicações aplicáveis.

## 9. Direitos do titular

Conforme aplicável e quando os recursos de conta estiverem disponíveis, o
titular poderá solicitar:

- confirmação da existência de tratamento;
- acesso aos dados;
- correção de informações incompletas ou desatualizadas;
- portabilidade, quando aplicável;
- informação sobre compartilhamento;
- eliminação ou anonimização, quando cabível;
- revogação de consentimento, quando essa for a base utilizada.

O canal para essas solicitações deve ser definido antes da publicação do
serviço.

## 10. Fotos e conteúdo de terceiros

O usuário deve adicionar apenas imagens e conteúdos que tenha autorização para
usar e compartilhar. Ao conectar o aplicativo ao servidor, as fotos deixarão
de permanecer somente no dispositivo e poderão ser enviadas ao armazenamento
remoto.

## 11. Crianças e adolescentes

Antes de disponibilizar o serviço para crianças ou adolescentes, o projeto
deve definir controles, linguagem e bases de tratamento apropriados, além de
revisar as exigências legais aplicáveis.

## 12. Referências

- [Lei Geral de Proteção de Dados Pessoais - Lei nº 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709compilado.htm)
- [Orientações da ANPD para titulares de dados](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1)
