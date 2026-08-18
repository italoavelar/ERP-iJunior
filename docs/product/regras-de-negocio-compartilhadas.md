# Regras de negócio compartilhadas

**Status:** Regras transversais confirmadas.

| ID | Regra confirmada | Efeito |
| --- | --- | --- |
| RC-001 | O ERP integra CRM / Comercial, Projetos, Financeiro e Plataforma Compartilhada. | Features não tratam os domínios como ilhas. |
| RC-002 | Relações de negócio não são recriadas manualmente entre módulos. | Handoffs e integrações usam dados transferidos ou referenciados. |
| RC-003 | Entidades compartilhadas possuem fonte de verdade e owner de ciclo de vida. | Leitura autorizada não concede escrita ou transição de estado. |
| RC-004 | Alterações críticas precisam de auditoria. | Histórico contém contexto, ator e momento. |
| RC-005 | `Contract` pertence ao Comercial; assinado, torna-se fato contratual compartilhado e imutável in-place. | Projetos e Financeiro o consomem por referência. |
| RC-006 | Assinatura válida de `Contract` habilita handoff Comercial → Projetos. | Handoff cria ou prepara Project Workspace sem redigitação; não inicia execução automaticamente. |
| RC-007 | Escopo contratado não é reescrito silenciosamente. | `ScopeBaseline` e `ScopeVersion` preservam histórico; mudança contratual usa Change Request e mecanismo equivalente de aditivo. |
| RC-008 | Parcela liquidada não é sobrescrita silenciosamente. | Ajuste, estorno e nova liquidação preservam eventos anteriores. |
| RC-009 | Valores financeiros derivados não são editados como fonte primária. | Valor pago e restante derivam de parcelas e movimentações. |
| RC-010 | `ProjectTask` e `CrmCard` são conceitos distintos. | Não há entidade universal de card ou task. |
| RC-011 | `Project Workspace` e `CrmWorkspace` são conceitos distintos. | Cada domínio possui contexto e comportamento próprios. |
| RC-012 | `CrmFieldValue` não substitui entidades versionadas, auditáveis, aprováveis ou integradas. | Campos dinâmicos atendem extensibilidade, não fatos de negócio primários. |
| RC-013 | Analytics é camada de leitura, não fonte de verdade. | Indicadores não substituem registros operacionais. |
| RC-014 | Integrações entre módulos mantêm referência de origem. | Histórico ponta a ponta é auditável. |
| RC-015 | Encerramento operacional e financeiro são eventos distintos. | Um não ocorre implicitamente por efeito do outro. |
| RC-016 | Sucesso do Cliente pertence ao contexto do Project Workspace. | Não há banco de dados paralelo de CS. |
| RC-017 | Cargo, papel de projeto e `PlatformPrivilege` são conceitos distintos; `PLATFORM_ADMIN` não ignora regras de negócio. | Administração não equivale a autorização irrestrita. |

## Aplicação futura

Uma feature referencia as regras aplicáveis e detalha apenas sua aplicação local. Exceções precisam preservar a regra transversal ou receber decisão explícita que a substitua.
