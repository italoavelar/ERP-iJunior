# Contexto de Produto: ERP iJúnior

**Status:** Contexto global consolidado parcialmente. Pendências operacionais seguem abertas.
**Atualizado em:** 2026-08-18
**Fonte:** decisões de produto registradas nesta revisão.

## Sistema visual autoritativo

A identidade do ERP iJúnior pertence ao mesmo ecossistema visual do iTracker.
Os documentos abaixo são as fontes autoritativas para qualquer decisão de
interface e devem ser lidos em conjunto:

- [iTracker — Design Guideline](design-guideline.md), base visual compartilhada;
- [Design System — ERP iJúnior](09-design-system.md), extensão dessa base para
  um produto multi-módulo.

A herança é explícita:

```text
iTracker Design Guideline
        ↓
base visual compartilhada
        ↓
ERP iJúnior Design System
        ↓
Login / AppShell / Financeiro
        ↓
futuramente Comercial / Projetos / RH
```

O Design System do ERP amplia o iTracker; não o substitui nem autoriza um
segundo sistema visual paralelo.

Esta área é a referência permanente do domínio do ERP interno da iJúnior. Ela antecede qualquer feature e não define arquitetura, banco de dados, APIs ou telas.

## Leitura dos estados

- **Confirmado:** decisão de produto já tomada. Features futuras devem respeitá-la.
- **Candidato forte:** conceito aceito para orientar o domínio, mas ainda sem compromisso de modelo físico ou desenho técnico.
- **Aberto:** decisão operacional ainda necessária. Não deve receber resposta implícita em uma feature.

## Estrutura macro confirmada

O ERP possui quatro domínios: **CRM / Comercial**, **Projetos**, **Financeiro** e **Plataforma Compartilhada**. RH poderá se tornar um domínio próprio no futuro para membros, cargos, skills, disponibilidade, capacidade e alocação.

Reuniões, documentos, notificações, auditoria e analytics são serviços transversais. Analytics é uma camada de leitura, nunca uma fonte de verdade.

## Acordo de trabalho

- Não há implementação de funcionalidade enquanto a definição global do produto estiver em revisão.
- Nenhuma feature deve transformar todo o ERP em uma única especificação.
- Uma feature deve consultar os documentos relevantes deste diretório e registrar apenas seus requisitos locais em `.specs/features/`.
- Decisões confirmadas que restrinjam mais de uma feature ficam também em `.specs/STATE.md`.
- Nomes de entidade neste diretório são conceituais. Eles não definem tabelas, classes, chaves ou contratos de API.

## Mapa da documentação

| Documento | Papel |
| --- | --- |
| [Visão e limites](visao-e-limites.md) | Propósito, domínios, fronteiras e serviços transversais. |
| [Modelo de domínio](modelo-de-dominio.md) | Modelos de negócio distintos e rastreabilidade ponta a ponta. |
| [Atores e permissões](atores-e-permissoes.md) | Cargos organizacionais, papéis de projeto e privilégios administrativos. |
| [Fluxo comercial](fluxo-comercial.md) | CRM configurável e fluxo de venda até o handoff. |
| [Fluxo de projetos](fluxo-projetos.md) | Project Workspace, execução, escopo contratado e operação diária. |
| [Fluxo financeiro](fluxo-financeiro.md) | Visão financeira completa e integridade de registros financeiros. |
| [Integrações entre módulos](integracoes-entre-modulos.md) | Handoff e referências entre os domínios. |
| [Regras de negócio compartilhadas](regras-de-negocio-compartilhadas.md) | Restrições transversais confirmadas. |
| [Entidades compartilhadas](entidades-compartilhadas.md) | Entidades compartilhadas e entidades por domínio. |
| [Glossário](glossario.md) | Vocabulário controlado do produto. |
| [Requisitos não funcionais](requisitos-nao-funcionais.md) | Qualidades transversais e critérios ainda a medir. |
| [Pendências de definição](pendencias-de-definicao.md) | Somente decisões realmente abertas, agrupadas por domínio. |

## Critério para iniciar a primeira feature

Podemos especificar uma feature quando os documentos do seu domínio definirem a fronteira, os atores, o fluxo, os dados compartilhados, as regras transversais e os requisitos não funcionais aplicáveis. Pendências sem impacto na feature podem continuar abertas se forem identificadas como tal.
