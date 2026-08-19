# Design System — ERP iJúnior

> Extensão multi-módulo da base visual compartilhada definida pelo iTracker
> Design Guideline. Este documento é autoritativo para o frontend do ERP.

============================================================
IDENTIDADE VISUAL OBRIGATÓRIA DO ERP iJÚNIOR
============================================================

O ERP iJúnior NÃO deve criar uma identidade visual nova.

A aplicação deve se basear diretamente na identidade visual e nos padrões
já definidos em:

- DESIGN_GUIDELINE.md do iTracker;
- 09-design-system.md do ERP iJúnior.

Esses documentos são AUTORITATIVOS para o frontend.

Regra principal:

O ERP herda o Design Guideline do iTracker e o amplia para um produto
multi-módulo.

NÃO criar um segundo sistema visual.

NÃO inventar:
- nova paleta;
- nova tipografia;
- novo padrão de sidebar;
- novo padrão de formulário;
- novos badges ad hoc;
- novo padrão de cards;
- novo comportamento de dark mode;
- novo sistema de feedback;
- novos estilos locais conflitantes.


============================================================
DIREÇÃO VISUAL
============================================================

O ERP deve possuir aparência:

- dark-first;
- preta/grafite;
- tecnológica;
- limpa;
- profissional;
- teal/cyan como acento de marca;
- densa o suficiente para um ERP;
- sem parecer uma planilha crua;
- sem excesso de elementos decorativos.

O sistema deve transmitir continuidade visual com o iTracker.

Quem já conhece o iTracker deve perceber que o ERP pertence ao mesmo
ecossistema visual.


============================================================
DARK MODE
============================================================

O ERP é DARK-FIRST.

Primeiro acesso:
→ dark mode.

O usuário pode alternar para light mode.

A preferência deve persistir em:

localStorage


Implementação:

- CSS variables;
- classe `.dark` no `<html>`;
- componentes usam tokens;
- evitar `dark:` diretamente nos componentes;
- os valores do tema vivem centralmente no CSS.

NÃO hardcodar cores nas páginas.


============================================================
TOKENS DE COR
============================================================

Preservar os tokens do guideline.

LIGHT:

background:
#f4f9fa

foreground:
#112e33

card:
#ffffff

primary:
#0e7c8b

muted:
#eef4f5

muted-foreground:
#5b767b

destructive:
#dc2626

border:
#d8e6e8

ring:
#31daee


DARK:

usar a estratégia já definida pelo Design System do ERP.

Visual esperado:

- fundo quase preto;
- cards grafite;
- bordas discretas;
- texto claro;
- teal como ação principal;
- cyan para focus e gradientes.

Esses valores devem existir em tokens globais.

Não usar hex diretamente em page components.


============================================================
GRADIENTE DE MARCA
============================================================

Usar o gradiente institucional já adotado:

primary
→ cyan

Aplicações adequadas:

- CTA principal;
- indicador de rota ativa;
- progress indicators;
- pequenos elementos de identidade.

Evitar espalhar gradiente em todos os elementos.


============================================================
TIPOGRAFIA
============================================================

Usar:

Sora:
- logo;
- headings;
- títulos de página;
- KPIs;
- títulos de seção importantes.

Inter:
- body;
- inputs;
- labels;
- tabelas;
- metadata;
- textos auxiliares.

Não introduzir outra fonte sem decisão arquitetural explícita.


============================================================
APP SHELL
============================================================

O shell criado neste BLOCO 3 deve seguir o padrão oficial do sistema.

Desktop:

Header sticky com glass
+
Sidebar lateral
+
Main content


Estrutura conceitual:

┌─────────────────────────────────────────────────────────────┐
│ Header — glass / sticky                            User ▾   │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│ Sidebar       │              Main content                   │
│               │                                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘


O conteúdo de página não deve repetir padding e max-width.

Essas responsabilidades pertencem ao AppShell/MainLayout.


============================================================
SIDEBAR DESKTOP
============================================================

No desktop:

estado fechado:
w-16

estado expandido:
w-60

A expansão pode ocorrer conforme o padrão do guideline.

Item ativo deve possuir indicador visual com gradiente da marca.

Fundo:

glass
+
border discreta.


O componente deve ser reutilizável.

Preferir conceito equivalente a:

RoleAwareSidebar


A sidebar não mostra necessariamente todos os módulos para todo usuário.

A navegação deve considerar capabilities e contexto do usuário.


============================================================
NAVEGAÇÃO POR PERFIL / CAPABILITY
============================================================

A arquitetura visual deve estar pronta para menus diferentes por contexto.

Exemplos futuros:

Financeiro:
- Dashboard
- Financeiro
- Projetos
- Reuniões

Comercial:
- Dashboard
- Comercial
- Analytics
- Reuniões

Projetos:
- Dashboard
- Projetos
- Reuniões

RH:
- Dashboard
- Pessoas
- Alocação

Neste bloco, implementar apenas as rotas existentes ou placeholders já
autorizados.

Não implementar os módulos futuros.


============================================================
MOBILE
============================================================

No mobile NÃO usar simplesmente a sidebar desktop comprimida.

Seguir o padrão do iTracker:

Bottom Navigation.

Máximo:

4 ações primárias visíveis.


Rotas adicionais:

Mais
→ Sheet


Neste momento, estruturar algo equivalente a:

Dashboard
Financeiro
Projetos
Mais

ou configuração coerente com as capabilities disponíveis.


============================================================
LOGIN
============================================================

A tela de Login deve seguir a identidade do iTracker/ERP.

Dark-first.

Pode utilizar:

- fundo quase preto;
- painel/card grafite;
- logo/nome ERP iJúnior;
- Sora nos headings;
- Inter nos inputs;
- CTA com gradiente teal/cyan;
- elementos decorativos discretos;
- identidade tecnológica.

Login é um dos poucos locais onde `animate-fade-up` é permitido.

Elementos puramente decorativos podem utilizar animação leve.

Não transformar a tela de login em landing page de marketing.


============================================================
ANIMAÇÕES
============================================================

Regra:

menos é mais.

Permitido:

Login:
- animate-fade-up do formulário.

Dashboard:
- hero;
- KPI cards;
- stagger pequeno.

Elementos decorativos:
- float leve.

NÃO usar animação de entrada em:

- listagens;
- formulários;
- tabelas;
- páginas financeiras;
- modais;
- cada navegação de rota.


Não usar:

hover:scale-105
active:scale-95

em botões.


============================================================
COMPONENTES BASE
============================================================

Use shadcn como base dos componentes de interface quando aplicável.

Componentes previstos:

Button
Input
Select
Badge
Table
Dialog
Sheet
Toast
DropdownMenu
Skeleton
Tabs
Tooltip
Command
Popover
Calendar
Separator


Não recriar componentes básicos manualmente sem necessidade.


============================================================
COMPONENTES PRÓPRIOS DO ERP
============================================================

A arquitetura deve favorecer componentes compartilhados equivalentes a:

AppShell
RoleAwareSidebar
BottomNav
PageHeader
KpiCard
StatusBadge
EmptyState
EntityTimeline
AuditTimeline


Durante este bloco implemente apenas os que forem realmente usados.

Não criar componentes vazios só porque estão listados.


============================================================
BOTÕES
============================================================

CTA principal:

Button default
+
gradiente teal/cyan.


Secundário:
outline.

Destrutivo:
destructive.

Discreto:
ghost.

Somente ícone:
size="icon".


Evitar estilos customizados repetidos por página.


============================================================
FORMULÁRIOS
============================================================

Seguir padrão oficial de overlay.

Desktop:

Create/Edit
→ Sheet lateral direita.


Mobile:

Create/Edit
→ Dialog.


Confirmações destrutivas:

Dialog em qualquer breakpoint.


Exemplos no Financeiro:

Criar/editar parcela:
desktop → Sheet
mobile → Dialog

Descartar plano:
→ Dialog

Estornar pagamento:
→ Dialog

Ativar plano:
→ Dialog/review confirmation apropriado.


============================================================
TABELAS FINANCEIRAS
============================================================

Financeiro é explicitamente uma das exceções permitidas ao limite padrão
de largura.

Para tabelas financeiras densas:

usar layout equivalente a:

layout="wide"


Não forçar toda informação financeira dentro de max-w-6xl se isso prejudicar
leitura.

Manter:

- alinhamento;
- hierarquia;
- densidade controlada;
- responsividade;
- scroll horizontal apenas quando necessário.


============================================================
PADRÕES DE TELA
============================================================

Dashboard:

KPI cards
+
Meu trabalho
+
alertas.


Listagem:

Busca
+
filtros
+
CTA
+
Table.


Detalhe:

Header compacto
+
status
+
quick actions
+
tabs quando necessário.


Create/Edit:

Sheet desktop
Dialog mobile.


Destrutivo:

Dialog.


============================================================
CARDS
============================================================

Cards de conteúdo normal NÃO usam glass.

Glass é reservado principalmente para:

- Header;
- Sidebar;
- dropdowns/painéis flutuantes quando coerente.


Cards internos usam:

bg-card
border
tokens do tema.


============================================================
BADGES
============================================================

Não criar cores arbitrárias por página.

Usar variantes semânticas centralizadas:

- sucesso;
- atenção;
- risco;
- informação;
- neutro.

Status nunca deve depender somente de cor.


============================================================
FEEDBACK
============================================================

A aplicação deve seguir integralmente:

sucesso
→ Toast.

erro de API
→ Toast destructive.

erro de campo
→ texto inline abaixo do input.

loading
→ Skeleton.

empty
→ EmptyState.

confirmação
→ Dialog.


PROIBIDO:

alert()
confirm()


============================================================
FINANCEIRO — APLICAÇÃO DO DESIGN SYSTEM
============================================================

As páginas T39–T46 devem seguir essa identidade.

ContractReceivablesPage:

- PageHeader;
- informações compactas do contrato;
- cards de resumo financeiro;
- tabela de parcelas;
- timeline;
- ações contextuais.

KPIs financeiros podem destacar:

Valor contratado
Recebido
Saldo restante
Situação


PaymentPlan DRAFT:

- status badge;
- total;
- parcelas;
- ações claramente separadas;
- CTA principal coerente.


ACTIVE:

- edição estrutural visualmente indisponível;
- foco em recebimentos e histórico.


Receipts:

- Dialog/Sheet coerente;
- allocation visualmente clara;
- valores alinhados;
- resumo antes do submit.


Reversal:

- Dialog destrutivo;
- reversibleAmount em destaque;
- motivo obrigatório;
- confirmação explícita.


Audit:

usar componente equivalente a:

AuditTimeline

e não uma tabela crua se timeline comunicar melhor a sequência dos eventos.


============================================================
EMPTY STATES
============================================================

Exemplos:

Contract sem PaymentPlan:

ícone
+
"Este contrato ainda não possui plano de pagamento."
+
CTA "Criar plano de pagamento"

se autorizado.


Sem recebimentos:

"Nenhum recebimento registrado."


Sem auditoria:

"Nenhum evento financeiro registrado."


============================================================
LOADING
============================================================

Usar Skeleton que respeite aproximadamente o layout final.

Evitar spinner central para toda página se skeleton comunicar melhor a
estrutura.


============================================================
ACESSIBILIDADE
============================================================

Obrigatório:

- contraste AA;
- focus ring visível;
- navegação por teclado;
- labels;
- tabelas com headers;
- ícones com accessible name quando necessário;
- estado não dependente somente de cor;
- dialogs acessíveis;
- feedback de erro identificável.


============================================================
RESPONSIVIDADE
============================================================

Validar:

desktop
tablet
mobile


Mobile:

- BottomNav;
- Sheet "Mais";
- dialogs adequados;
- tabelas com estratégia de overflow;
- ações principais acessíveis.

Não considerar a feature pronta se funcionar somente em desktop.


============================================================
REGRA DE CONSISTÊNCIA
============================================================

Antes de criar qualquer componente visual novo, verificar:

1. já existe padrão no Design Guideline?
2. já existe componente shadcn apropriado?
3. já existe componente compartilhado do ERP?

Se sim:
REUTILIZE.


Não introduzir padrões paralelos.


============================================================
REVISÃO VISUAL OBRIGATÓRIA
============================================================

Antes de concluir o BLOCO 3, faça revisão específica contra:

DESIGN_GUIDELINE
09-design-system


Verifique:

- tokens;
- dark-first;
- Sora/Inter;
- sidebar;
- BottomNav;
- responsive behavior;
- forms;
- dialogs;
- sheets;
- tables;
- badges;
- loading;
- empty states;
- Toast;
- accessibility;
- ausência de hex hardcoded nas páginas;
- ausência de dark: espalhado;
- ausência de alert/confirm;
- ausência de padrões visuais paralelos.


A revisão deve declarar explicitamente se o frontend do ERP está visualmente
alinhado ao iTracker.
