# iTracker — Design Guideline

> Referência de design para toda nova tela e refatoração. Siga este documento; não invente padrões paralelos.

---

## 1. Tokens de cor

Definidos em `src/index.css` (`:root`). **Nunca use hex hardcoded ou classes `cyan-800` fora deste sistema.**

| Token Tailwind | Valor light | Uso |
|---|---|---|
| `bg-background` | `#f4f9fa` | Fundo de página |
| `text-foreground` | `#112e33` | Texto principal |
| `bg-card` | `#ffffff` | Superfícies elevadas (cards, sheets) |
| `bg-primary` | `#0e7c8b` | CTAs, links ativos |
| `text-primary` | `#0e7c8b` | Texto de ênfase, ícones ativos |
| `bg-muted` | `#eef4f5` | Superfícies neutras, skeletons |
| `text-muted-foreground` | `#5b767b` | Texto secundário, placeholders |
| `bg-destructive` | `#dc2626` | Botões e ícones de delete/erro |
| `border` | `#d8e6e8` | Bordas de cards e inputs |
| `ring` | `#31daee` | Focus ring em inputs e botões |

**Gradiente de marca:** `bg-linear-to-r from-primary to-[#31daee]`
— usado em botões CTA primários, progress rings e indicadores de rota ativa.

### Status de membros/projetos (badges)

| Status | Classes |
|---|---|
| Ativo | `bg-primary/10 text-primary` |
| Inativo | `bg-muted text-muted-foreground` |
| Suspenso | `bg-destructive/10 text-destructive` |
| Em férias | `bg-blue-500/10 text-blue-600` |
| Trainee | `bg-amber-500/10 text-amber-600` |

---

## 2. Tipografia

| Uso | Fonte | Classes Tailwind |
|---|---|---|
| Títulos de página, hero, logo | Sora (`font-display`) | `font-display font-extrabold text-3xl` |
| Subtítulo de seção | Sora (`font-display`) | `font-display font-bold text-lg` |
| Body, labels, inputs, parágrafos | Inter (`font-sans`) | padrão — não precisa declarar |
| Texto auxiliar / metadata | Inter | `text-sm text-muted-foreground` |

---

## 3. Shell de layout

```
┌──────────────────────────────────────────────┐
│  Header  (glass · sticky · z-30)             │
├────────┬─────────────────────────────────────┤
│Sidebar │  <main> overflow-y-auto             │
│w-16    │  px-6 py-8  ·  max-w-6xl mx-auto   │
│→ w-60  │                                     │
│(hover) │                                     │
└────────┴─────────────────────────────────────┘
```

- O padding e max-width do conteúdo ficam no `MainLayout.tsx` — **não repita em page components**.
- Nunca use `p-8` direto em páginas; herde o padding do layout.

---

## 4. Sidebar

### Desktop (≥ lg)

- Colapsada: `w-16` (só ícone) → expandida: `w-60` no `group-hover`
- Item ativo: barra esquerda com `bg-linear-to-b from-primary to-[#31daee]`
- Fundo: `.glass` + `border-r border-sidebar-border`
- Arquivo: `src/components/Sidebar.tsx`
- Adicionar `hidden lg:flex` para que suma no mobile

### Mobile (< lg) — Bottom Navigation

- Arquivo: `src/components/BottomNav.tsx` (`lg:hidden`)
- **Máximo de 4 links primários** visíveis na barra inferior
- Links excedentes ou sub-rotas vão no botão **"Mais" (⋯)** que abre um `Sheet` de baixo para cima

```
Nível 1 — barra inferior (max 4 visíveis):
  🏠 Dashboard  👥 Membros  💼 Projetos  ⋯ Mais

Nível 2 — Sheet "Mais":
  🏢 Diretorias  · [futuras rotas de admin]
```

**Critério de promoção ao nível 1:** rotas acessadas diariamente pelo usuário comum.
**Critério para "Mais":** rotas de gestão, admin ou sub-rotas pouco frequentes.

---

## 5. Dark mode

O sistema usa CSS variables — dark mode é implementado via classe `.dark` no `<html>`.

- **Não use classes `dark:` diretamente em componentes.** Use os tokens (`bg-background`, `text-foreground`…); eles mudam automaticamente.
- O bloco `.dark { ... }` fica em `src/index.css`, sobrescrevendo cada token.
- Toggle: botão Sun/Moon no `Header.tsx`, persiste em `localStorage`.

---

## 6. Componentes shadcn — instalar e quando usar

```bash
npx shadcn@latest add dialog sheet table select badge toast dropdown-menu skeleton
```

| Componente | Quando usar |
|---|---|
| `Dialog` | Confirmações destrutivas (delete, archive); formulários no mobile |
| `Sheet` | Formulários create/edit no desktop; menu "Mais" no bottom nav |
| `Table` | Listagens de Membros e Projetos |
| `Select` | Dropdowns em formulários — substituir `<select>` raw |
| `Badge` | Status de membros, projetos, pedidos |
| `Toast` | Feedback de sucesso/erro — substituir `alert()` |
| `DropdownMenu` | Ações por linha em tabelas (editar · arquivar · deletar) |
| `Skeleton` | Estado de carregamento de dados |

---

## 7. Formulários CRUD — padrão de overlay

| Breakpoint | Padrão | Motivo |
|---|---|---|
| Desktop (≥ lg) | **Sheet** deslizando da direita | Mantém contexto da listagem visível |
| Mobile (< lg) | **Dialog** centralizado | Sheet lateral fica apertado em tela pequena |
| Confirmação destrutiva | **Dialog** (ambos) | Foco total na decisão, tamanho `max-w-sm` |

```tsx
// Padrão de uso em qualquer page de listagem:
const isMobile = useIsMobile(); // hook com breakpoint < 1024px

// Desktop
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="right" className="w-full max-w-md">
    <MeuFormulario onSuccess={() => setOpen(false)} />
  </SheetContent>
</Sheet>

// Mobile
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <MeuFormulario onSuccess={() => setOpen(false)} />
  </DialogContent>
</Dialog>
```

---

## 8. Listagens — tabela vs cards

| Tela | Padrão | Motivo |
|---|---|---|
| Membros | **Table** | Muitos campos (nome, email, status, diretoria, data) |
| Projetos | **Table** | Status, deadline, responsável — dado tabular |
| Diretorias | **Cards em grid** | Poucos itens, destaque visual, sem muitas colunas |
| Dashboard | **Cards (KPI)** | Widgets de métricas, não listagem |

Anatomia de uma tela com tabela:

```
[Input busca 🔍]          [+ Novo botão]
─────────────────────────────────────────
Tabela com Badge de status + DropdownMenu de ações
─────────────────────────────────────────
[Paginação]
```

---

## 9. Utilitários CSS — regras de uso

| Classe | Usar em | Não usar em |
|---|---|---|
| `.glass` | Header, Sidebar, dropdowns flutuantes | Cards de conteúdo interno |
| `.text-gradient` | Hero headings, nome do sistema, saudação no Dashboard | Labels, body text |
| `.card-hover` | Cards interativos/clicáveis | Linhas de tabela, botões |
| `.animate-fade-up` | Dashboard hero + KPI cards; Login | Qualquer outra página |
| `.animate-float` | Elementos puramente decorativos (Login aside) | UI funcional |

---

## 10. Botões

| Situação | Variante + classe extra |
|---|---|
| CTA principal (salvar, criar, entrar) | `default` + `bg-linear-to-r from-primary to-[#22b6c8]` |
| Ação secundária, cancelar | `outline` |
| Ação destrutiva (deletar, rejeitar) | `destructive` |
| Ação discreta (fechar, voltar) | `ghost` |
| Botão só com ícone | `size="icon"` |

**Proibido:** `hover:scale-105 active:scale-95` em botões — o componente `Button` já tem `transition-all`. Remover dessas classes nas páginas legadas ao refatorar.

---

## 11. Animações

**Regra geral: menos é mais.** Animações de entrada em cada navigate criam sensação de delay e ficam enjoativas.

### Onde usar `animate-fade-up`

| Contexto | Permitido? |
|---|---|
| Dashboard — hero + cards de KPI | ✅ Com stagger (máx 3 elementos, delay de 80ms cada) |
| Login — painel do formulário | ✅ Sem stagger |
| Listagens, formulários, modais | ❌ Nunca |

### Transições de estado (preferidas)

- **Hover em cards:** `.card-hover` (translateY -4px, 250ms ease)
- **Focus em inputs:** ring transition embutido no componente `Input`
- **Loading → conteúdo:** `Skeleton` some com `opacity` em 100ms, sem translate
- **Elementos decorativos:** `.animate-float` e `.animate-spin-slow` — apenas em áreas ornamentais (Login aside, telas de boas-vindas)

---

## 12. Feedback e estados de UI

| Situação | O que usar |
|---|---|
| Ação bem-sucedida (salvar, aprovar) | `Toast` — 3 s, fechar automático |
| Erro de API (500, rede) | `Toast` variant destructive |
| Erro de validação por campo | `<span className="text-sm text-destructive">` abaixo do input |
| Carregando dados | `Skeleton` com a forma aproximada do conteúdo |
| Lista vazia | Card centralizado: ícone + mensagem + botão CTA de criação |

Nenhum `alert()` ou `confirm()` nativo — substituir por `Dialog` de confirmação + `Toast` de resultado.
