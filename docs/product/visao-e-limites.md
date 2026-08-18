# Visão e limites do produto

**Status:** Contexto confirmado, com decisões operacionais pontuais ainda abertas.

## Visão

O ERP iJúnior é uma plataforma interna integrada. Ele mantém a continuidade de uma relação de negócio desde a oportunidade, passando por contrato, projeto e financeiro, até seus encerramentos e histórico. Comercial, Projetos e Financeiro não são sistemas isolados nem cópias manuais do mesmo dado.

## Estrutura macro confirmada

| Domínio ou serviço | Responsabilidade confirmada |
| --- | --- |
| CRM / Comercial | Plataforma de processos configuráveis. Organiza CRM e é owner de oportunidade, dimensionamento, escopo comercial, precificação, proposta, offering e contrato. |
| Projetos | Organiza Project Workspace, baseline e versões de escopo, execução operacional, entregas, riscos, Sucesso do Cliente e histórico. |
| Financeiro | Organiza planos de pagamento, parcelas, recebimentos, notas fiscais, reembolsos, investimentos, orçamento, obrigações, patrimônio, caixa e fechamento. Consome contrato por referência. |
| Plataforma Compartilhada | É owner de identidade, membros, clientes, contatos e parceiros; oferece capacidades compartilhadas sem assumir regras dos domínios. |
| RH, futuro domínio | Poderá assumir ownership de membros, cargos, skills, disponibilidade, capacidade e alocação. Não é parte do escopo atual. |

## Serviços transversais confirmados

Reuniões, documentos, notificações, auditoria e analytics atravessam os domínios. Eles se vinculam a registros de negócio sem substituir a fonte de verdade de cada domínio.

- **Reuniões:** capacidade transversal para associar encontros, atas e decisões a contextos de domínio.
- **Documentos:** capacidade transversal para associar documentos ou anexos a contextos de domínio.
- **Notificações:** capacidade transversal para comunicar eventos e pendências.
- **Auditoria:** capacidade transversal para registrar alterações críticas, autor, momento e contexto.
- **Analytics:** camada de leitura para indicadores. Não edita nem se torna fonte primária de dados.

Versionamento universal de documentos, retenção, acesso e eventos de notificação não estão definidos nesta documentação.

## Limites de modelagem confirmados

- Não criar uma entidade universal, como `GenericCard`, para representar todo o ERP.
- `CrmCard` é unidade visual e processual de CRM. `ProjectTask` é trabalho de execução de projeto. São conceitos distintos.
- `CrmWorkspace` organiza processos de CRM. `Project Workspace` organiza a execução de projeto. São conceitos distintos.
- Campos dinâmicos de CRM não substituem entidades de negócio auditáveis, versionadas ou integradas.
- Sucesso do Cliente é capacidade vinculada ao Project Workspace. Não é banco de dados paralelo.
- Existe somente `Project` como unidade operacional. “Projeto financeiro” não é entidade ou agregado do domínio.
- A planilha financeira atual é fonte de migração e contexto de negócio. Ela não é modelo final do Financeiro.

## O que esta documentação não define

- Arquitetura de software, modelo físico, APIs, telas ou automações técnicas.
- Qual será a primeira feature ou sua sequência de implementação.
- Estados, alçadas, critérios de ativação do projeto e políticas operacionais listados em [Pendências de definição](pendencias-de-definicao.md).
