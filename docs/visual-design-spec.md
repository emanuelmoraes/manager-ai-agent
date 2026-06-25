# Visual Design Specification — ManagerAI

> **Versão:** 1.0  
> **Criado em:** 2026-06-23  
> **Escopo:** Tela Inicial (`/`) — padrão de referência para todo o sistema  

---

## 1. Filosofia de Design

O visual do **ManagerAI** é orientado por quatro princípios:

| Princípio | Descrição |
|-----------|-----------|
| **Dark-first** | Todas as telas usam fundo escuro como padrão. Não há modo claro. |
| **Depth & Glow** | Profundidade criada com orbs de glow, gradientes e sombras suaves — nunca plano. |
| **Micro-animações** | Elementos interativos e decorativos possuem animações sutis para transmitir vida ao sistema. |
| **Hierarquia clara** | Tipografia, cor e espaçamento guiam o olhar do usuário de forma intencional. |

---

## 2. Paleta de Cores

### Tokens base

```css
:root {
  --background:       #03020a;          /* fundo principal — quase preto arroxeado */
  --foreground:       #f0eeff;          /* texto primário */
  --accent-primary:   #7c3aed;          /* roxo vibrante — ação principal */
  --accent-secondary: #4f46e5;          /* índigo — gradiente secundário */
  --accent-glow:      #a78bfa;          /* roxo claro — brilhos e destaques */
  --surface:          rgba(255,255,255,0.04);   /* superfície de cards */
  --surface-hover:    rgba(255,255,255,0.07);   /* superfície em hover */
  --border:           rgba(255,255,255,0.08);   /* bordas sutis */
  --border-accent:    rgba(124,58,237,0.40);    /* bordas de destaque */
  --text-muted:       #94a3b8;          /* texto secundário / descrições */
}
```

### Escala de tons

| Uso | Valor |
|-----|-------|
| Texto principal | `#f0eeff` |
| Texto secundário | `#94a3b8` |
| Texto silenciado | `#64748b` / `#475569` |
| Título de card | `#e2e8f0` |
| Accent primário | `#7c3aed` |
| Accent glow | `#a78bfa` |
| Accent gradiente fim | `#4f46e5` |
| Sucesso / Online | `#22c55e` |

### Gradiente de texto hero

```css
background: linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #818cf8 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### Gradiente de texto accent (palavras em destaque)

```css
background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #4f46e5 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

---

## 3. Tipografia

| Elemento | Font | Peso | Tamanho | Letter-spacing |
|----------|------|------|---------|----------------|
| Título hero (H1) | Geist Sans | 800 | `clamp(3rem, 7vw, 5.5rem)` | `-0.03em` |
| Título seção (H2) | Geist Sans | 800 | `clamp(1.8rem, 4vw, 2.8rem)` | `-0.02em` |
| Título de card (H3) | Geist Sans | 700 | `1rem` | padrão |
| Corpo / descrição | Geist Sans | 400 | `1.2rem` | padrão |
| Texto de card | Geist Sans | 400 | `0.875rem` | padrão |
| Badge / label | Geist Sans | 600 | `12px` | `0.08em` |
| Caption / status | Geist Sans | 400 | `0.8rem` | `0.05em` |

- **Line-height padrão:** `1.7` para corpo, `1.05` para títulos hero, `1.65` para cards.
- **Font fallback:** `Arial, Helvetica, sans-serif`.
- **Fonte carregada via:** `next/font/google` — variáveis CSS `--font-geist-sans` e `--font-geist-mono`.

---

## 4. Camadas de Fundo

O fundo de tela é composto por três camadas empilhadas (baixo → cima):

### 4.1 Cor base
```css
background: #03020a;
```

### 4.2 Grid perspectivo
```css
background-image:
  linear-gradient(rgba(124,58,237,0.07) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124,58,237,0.07) 1px, transparent 1px);
background-size: 60px 60px;
mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%);
```
> O `mask-image` faz o grid desvanecer para baixo, concentrando o foco no topo.

### 4.3 Orbs de glow (efeito de luz ambiente)

Três orbs posicionados absolutamente:

| ID | Dimensão | Posição | Cor | Animação |
|----|----------|---------|-----|----------|
| Orb 1 | 700×700px | Topo, centrado | `rgba(124,58,237,0.25)` | Estático |
| Orb 2 | 400×400px | Centro-esquerda | `rgba(79,70,229,0.15)` | `float-slow 8s` |
| Orb 3 | 350×350px | Centro-direita | `rgba(167,139,250,0.12)` | `float-slow 10s reverse` |

```css
/* Todos os orbs usam filter: blur(80px) */
@keyframes float-slow {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-30px); }
}
```

### 4.4 Noise overlay
```css
/* Camada de ruído com opacidade 2.5% — sutil, dá textura premium */
opacity: 0.025;
background-image: url("data:image/svg+xml, /* feTurbulence fractalNoise */ ");
position: fixed; inset: 0; pointer-events: none; z-index: 0;
```

---

## 5. Componentes

### 5.1 Badge

Elemento de rótulo usado no topo de seções para contextualizar o conteúdo.

```
┌────────────────────────────────┐
│  ● ORQUESTRADOR DE AGENTES IA  │  ← uppercase, letter-spacing 0.08em
└────────────────────────────────┘
```

```css
.badge {
  padding: 6px 16px;
  background: rgba(124,58,237,0.12);
  border: 1px solid rgba(124,58,237,0.35);
  border-radius: 100px;
  font-size: 12px; font-weight: 600;
  color: #a78bfa;
}
.badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #a78bfa;
  animation: pulse-dot 2s ease-in-out infinite;
}
```

---

### 5.2 Botão Primário (CTA)

Botão de ação principal — usado para navegação entre telas.

```
╔══════════════════════════════╗
║   Abrir Workspace    →       ║
╚══════════════════════════════╝
```

```css
.cta-btn {
  padding: 16px 36px;
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
  border-radius: 14px;
  font-weight: 700; font-size: 1rem; letter-spacing: 0.02em;
  box-shadow: 0 0 0 1px rgba(124,58,237,0.5), 0 8px 32px rgba(124,58,237,0.35);
}
/* Hover: translateY(-2px) + box-shadow intensificado */
/* Ícone arrow: translateX(+4px) no hover */
```

---

### 5.3 Botão Secundário

Ação alternativa — menos prioridade visual.

```css
.secondary-btn {
  padding: 16px 28px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  font-weight: 600; color: #94a3b8;
}
/* Hover: color white, border rgba(124,58,237,0.3) */
```

---

### 5.4 Feature Card

Card de glassmorphism para exibição de recursos/capacidades.

```
┌─────────────────────────────────────┐
│  ┌────┐                             │
│  │ 🧠 │  Orquestração Inteligente   │
│  └────┘                             │
│  Coordena múltiplos agentes de IA   │
│  em pipelines sequenciais...        │
└─────────────────────────────────────┘
```

```css
.feature-card {
  padding: 28px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  transition: all 0.3s ease;
}
/* Hover: border rgba(124,58,237,0.35), translateY(-3px),
          box-shadow 0 20px 60px rgba(0,0,0,0.4) */

.feature-icon {
  width: 48px; height: 48px;
  background: rgba(124,58,237,0.15);
  border: 1px solid rgba(124,58,237,0.25);
  border-radius: 12px;
}
```

---

### 5.5 Status Bar

Barra indicadora de estado do sistema — exibida no header.

```
┌──────────────────────────────────────────────────┐
│  ● Sistema Online  |  🤖 Genkit v1.37  |  ⚙️ Next.js 16  │
└──────────────────────────────────────────────────┘
```

```css
.status-bar {
  padding: 14px 24px; gap: 24px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
}
.status-dot-green {
  width: 7px; height: 7px;
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34,197,94,0.6);
  animation: pulse-dot 2s ease-in-out infinite;
}
```

---

### 5.6 Nós de Agente Flutuantes (Decorativos)

Ícones flutuantes que representam agentes na hero section, visíveis apenas em `lg+`.

```css
.agent-node {
  border-radius: 50%;
  border: 1px solid rgba(124,58,237,0.3);
  background: rgba(124,58,237,0.08);
  backdrop-filter: blur(8px);
  animation: float-node 6s ease-in-out infinite;
}
@keyframes float-node {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33%       { transform: translateY(-12px) rotate(3deg); }
  66%       { transform: translateY(6px) rotate(-2deg); }
}
```

| Posição | Tamanho | Ícone | Delay |
|---------|---------|-------|-------|
| Top-left | 56×56px | 🤖 | 0s |
| Mid-left | 44×44px | ⚡ | 1.5s |
| Bottom-left | 52×52px | 🧠 | 3s |
| Top-right | 56×56px | 📊 | 0.8s |
| Mid-right | 44×44px | 🔗 | 2s |
| Bottom-right | 50×50px | 🛡️ | 4s |

---

### 5.7 Divisor com Gradiente

```css
.gradient-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent);
  width: 80%; max-width: 600px;
  margin: 0 auto;
}
```

---

## 6. Animações

### Fade-up de entrada

Todos os elementos da hero section entram com animação escalonada:

```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-up { animation: fade-up 0.7s ease forwards; }

/* Classes de delay para escalonamento */
.delay-100 { animation-delay: 0.1s; opacity: 0; }
.delay-200 { animation-delay: 0.2s; opacity: 0; }
/* ... até delay-700 */
```

### Ordem de entrada na hero

| Elemento | Classe de delay |
|----------|----------------|
| Badge | `delay-100` |
| Título H1 | `delay-200` |
| Descrição | `delay-300` |
| Botões CTA | `delay-400` |
| Métricas | `delay-500` |
| Scroll indicator | `delay-700` |

### Pulse dot (badge e status)

```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(167,139,250,0.6); }
  50%       { opacity: 0.7; transform: scale(1.2); box-shadow: 0 0 0 6px rgba(167,139,250,0); }
}
```

### Scroll indicator

```css
@keyframes scroll-dot {
  0%   { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(16px); opacity: 0; }
}
```

---

## 7. Layout & Espaçamento

### Estrutura da Tela Inicial

```
┌─────────────────────────────────────────────────────────┐
│                        HEADER                           │  py-6 px-8
│   Logo ManagerAI          Status Bar                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                     HERO SECTION                        │  min-height: 85vh
│           [Grid bg] [Glow orbs] [Noise]                 │  py-24 px-6
│                                                         │
│         Badge • Título • Descrição                      │  gap-8, max-w: 720px
│         Botões • Métricas • Scroll indicator            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    GRADIENT DIVIDER                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                  FEATURES SECTION                       │  py-24 px-6
│        Badge • H2 • Descrição                           │  mb-16
│                                                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │  Card 1  │  │  Card 2  │  │  Card 3  │            │  grid auto-fit
│   └──────────┘  └──────────┘  └──────────┘            │  minmax(300px,1fr)
│   ┌──────────┐  ┌──────────┐  ┌──────────┐            │  gap: 20px
│   │  Card 4  │  │  Card 5  │  │  Card 6  │            │
│   └──────────┘  └──────────┘  └──────────┘            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    FINAL CTA SECTION                    │  py-24
│           H2 • Descrição • Botão CTA                    │
├─────────────────────────────────────────────────────────┤
│                       FOOTER                            │  py-5 px-8
│  © ManagerAI               Powered by Genkit · Gemini  │
└─────────────────────────────────────────────────────────┘
```

### Largura máxima de conteúdo

| Contexto | Max-width |
|----------|-----------|
| Hero content | `720px` |
| Hero description | `580px` |
| Features grid | `1100px` |
| Final CTA content | `560px` |

---

## 8. Scrollbar Customizada

```css
::-webkit-scrollbar       { width: 6px; }
::-webkit-scrollbar-track { background: #0d0b1a; }
::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 3px; }
```

---

## 9. Responsividade

| Breakpoint | Comportamento |
|------------|---------------|
| `< sm` | Status bar oculta no header; botões em coluna |
| `sm+` | Status bar visível; botões CTA em linha |
| `< lg` | Nós flutuantes de agente ocultos |
| `lg+` | Nós flutuantes visíveis nas laterais da hero |

---

## 10. IDs Semânticos (para testes e analytics)

Todos os botões interativos possuem IDs únicos e descritivos:

| ID | Elemento | Destino |
|----|----------|---------|
| `cta-open-workspace` | Botão "Abrir Workspace" (hero) | `/workspace` |
| `cta-learn-more` | Botão "Saiba mais" (hero) | `#features` (âncora) |
| `cta-final-workspace` | Botão "Iniciar Agora" (final CTA) | `/workspace` |
| `workspace-back-home` | Botão "Voltar ao Início" (workspace) | `/` |

---

## 11. Arquivos de Referência

| Arquivo | Descrição |
|---------|-----------|
| [`src/app/globals.css`](../src/app/globals.css) | Design system completo — tokens, componentes, animações |
| [`src/app/page.tsx`](../src/app/page.tsx) | Implementação da tela inicial |
| [`src/app/layout.tsx`](../src/app/layout.tsx) | Layout raiz — fontes, metadata |
| [`src/app/workspace/page.tsx`](../src/app/workspace/page.tsx) | Segunda tela (placeholder) |

---

## 12. Checklist para Novas Telas

Ao criar uma nova tela do sistema, verifique:

- [ ] Usa `background: var(--background)` (`#03020a`) como base
- [ ] Importa e aplica o design system de `globals.css`
- [ ] Usa os tokens de cor definidos (não valores hex avulsos)
- [ ] Tipografia com `font-family: var(--font-geist-sans)`
- [ ] Botões primários usam a classe `.cta-btn` ou o mesmo padrão de gradiente
- [ ] Cards usam `.feature-card` ou padrão equivalente de glassmorphism
- [ ] Todos os botões e inputs possuem IDs únicos e semânticos
- [ ] Micro-animações presentes nos elementos interativos (hover, focus)
- [ ] Responsivo para mobile (mínimo `sm` e `lg` breakpoints)
- [ ] Metadata `title` e `description` atualizados no `page.tsx` ou `layout.tsx`
