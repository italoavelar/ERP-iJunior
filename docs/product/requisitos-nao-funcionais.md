# Requisitos não funcionais

**Status:** Princípios confirmados; metas mensuráveis e políticas detalhadas abertas.

## Segurança, acesso e segregação

| Requisito | Estado |
| --- | --- |
| O ERP distingue `User`, `Member`, cargo organizacional, papel de projeto e `PlatformPrivilege`. | Confirmado. |
| Cargo não concede privilégio administrativo automaticamente; a atribuição de `PlatformPrivilege` é explícita e auditável. | Confirmado. |
| Autorização respeita contexto, capacidade e alçada. `PLATFORM_ADMIN` não ignora regras de negócio. | Confirmado. |
| Dados de cliente, contrato e financeiro são expostos somente a atores autorizados. | Confirmado como princípio; matriz e classificação exatas estão abertas. |

## Integridade, histórico e auditoria

| Requisito | Estado |
| --- | --- |
| Alterações críticas preservam auditoria com ator, momento e contexto. | Confirmado. |
| Contrato assinado, escopo contratado, parcela liquidada, liquidação, ajuste e estorno preservam histórico. | Confirmado. |
| Valores financeiros derivados são calculados a partir de registros primários, não editados diretamente. | Confirmado. |
| Integrações preservam referências de origem e não exigem redigitação. | Confirmado. |
| Campos dinâmicos de CRM não são fonte primária de entidades auditáveis ou versionadas. | Confirmado. |

## Serviços transversais e operação

| Requisito | Estado |
| --- | --- |
| Reuniões, documentos, notificações e auditoria podem vincular-se a contextos de domínio sem substituir suas fontes de verdade. | Confirmado. |
| Versionamento universal de documentos, retenção, acesso e eventos de notificação ainda precisam de definição. | Aberto. |
| Analytics opera como camada de leitura e não substitui registros operacionais. | Confirmado. |
| O produto atende metas de disponibilidade, desempenho, recuperação e acessibilidade ainda a definir. | Aberto. |

## Critérios mensuráveis ainda necessários

Antes da feature que dependa de um requisito abaixo, definir valor-alvo, evidência e exceção aplicável:

- tempo de resposta para operações e consultas prioritárias;
- disponibilidade e janelas de manutenção;
- backup, retenção, ponto e tempo de recuperação;
- eventos mínimos de auditoria, retenção e proteção;
- política de dados pessoais, exportação, correção e descarte;
- padrão de acessibilidade e critério de aceite;
- volume esperado de usuários, cards, projetos, parcelas, documentos e histórico;
- reconciliação de integrações e migração da planilha atual.
