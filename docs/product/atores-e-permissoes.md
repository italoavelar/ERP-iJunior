# Atores e permissões

**Status:** Estrutura de cargos, papéis e privilégios confirmada. Matriz de capacidades e alçadas continua aberta.

## Três conceitos distintos

| Conceito | Significado |
| --- | --- |
| Cargo organizacional | Posição da pessoa na estrutura da iJúnior. |
| Papel de projeto | Responsabilidade operacional exercida dentro de um projeto. |
| `PlatformPrivilege` | Privilégio administrativo explicitamente atribuído para administrar capacidades da plataforma. |

Uma atribuição não concede automaticamente as outras. Cargo organizacional não concede automaticamente `PlatformPrivilege`. Diretoria de Projetos, Comercial, RH e Vice-Presidência podem ser elegíveis a determinados privilégios, mas a concessão é explícita e auditável. `PLATFORM_ADMIN` não bypassa regras de negócio, alçadas ou auditoria.

## Cargos e áreas organizacionais

| Área | Cargos base |
| --- | --- |
| Projetos e Sucesso do Cliente | Diretor de Projetos, Gerente de Sucesso do Cliente e Assessor de Sucesso do Cliente. |
| Comercial | Diretor Comercial, Gerente de Vendas e Assessor de Vendas. |
| Financeiro | Vice-Presidente e Gerente Financeiro. |
| RH | Diretor de RH e Assessor de RH. |
| Elegíveis a privilégio de plataforma | Diretor de Projetos, Diretor Comercial, Diretor de RH e Vice-Presidente, mediante atribuição explícita. |

## PlatformPrivilege

`PlatformPrivilege` é conceito próprio e auditável. Sua futura definição deve registrar titular, capacidade, escopo, concedente, data de concessão, vigência, revogação e justificativa. Ele administra somente capacidades permitidas e não autoriza mudança de fatos de negócio fora das regras do domínio proprietário.

## Papéis operacionais de projeto

| Papel | Responsabilidades confirmadas |
| --- | --- |
| PO | Organiza backlog, distribui trabalho, conduz Scrum, define prioridades, cria e gerencia tasks, abre e fecha sprints, acompanha critérios de aceite e pode solicitar Change Request. |
| LT | Define ou valida stack, organiza versionamento, revisa PRs, orienta arquitetura, acompanha Docker e deploy, atua em qualidade técnica, pode vincular PRs às tasks e registra decisões técnicas. |
| Desenvolvedor | Implementa, testa, documenta, abre PR e atualiza task. |
| Designer | Atua em UX, prototipação, UI, handoff visual e validação de interface. |

## Limites confirmados

- Financeiro consulta contrato, cliente e progresso relacionado, mas não edita pipeline de CRM ou backlog de projeto.
- Administração da plataforma não dispensa regras de negócio.
- Alterações críticas indicam ator, momento e contexto auditável.

## Decisões realmente abertas

- Matriz de permissões por capacidade, domínio, cargo, papel de projeto, `PlatformPrivilege` e alçada.
- Alçadas de preço, contrato, Change Request, liquidação, estorno e fechamento.
- Visibilidade de valores financeiros por capacidade e contexto.
- Capacidades administrativas específicas e processo de concessão, revogação e revisão de `PlatformPrivilege`.
