# Manual de Agentes e Operação do Workspace

Este documento serve como manual técnico e operacional do sistema de agentes do ManagerAI, especificando a arquitetura dos agentes padrão do sistema, a mecânica de criação de novos agentes personalizados e a documentação histórica da evolução do Workspace.

---

## 1. Agentes padrão
O sistema não tem agentes padrão. O usuário deve criar seus próprios agentes para cada tipo de necessidade. 

---

## 2. Agentes

O sistema permite a adição dinâmica de novos agentes na barra lateral do Workspace para visualização, simulação e futuras integrações com fluxos customizados.

### Campos dos agentes
- **Nome**: Nome do agente.
- **Função**: Função / especialidade do agente (ex: *Desenvolvedor Frontend*).
- **Ícone**: Ícone visual/emoji do agente.
- **Cor**: Cor tema para destaque visual.
- **Descrição / Instruções**: É o **prompt do Agente**. Onde o usuário insere as diretrizes, comportamento, tom e regras de negócio (o prompt do sistema) que guiarão o Agente em sua execução e conversa.
- **Provedor**: O provedor do modelo de IA (Google Gemini, OpenAI ou Anthropic). Vincula o agente à respectiva chave de API inserida nas "Configurações".
- **Modelo**: O modelo de IA correspondente ao provedor selecionado.


### Arquitetura de Persistência
1. **React State (`agents`)**: Utiliza o estado do componente React na página de Workspace para renderizar de forma reativa a barra lateral, contagem de agentes ativos e os painéis de fluxo de trabalho.
2. **LocalStorage (`manager_ai_agents`)**: Os agentes adicionados via formulário são salvos no navegador na chave `"manager_ai_agents"` e carregados automaticamente no carregamento inicial da página (`useEffect`), garantindo que os agentes não se percam após recarregar.

---

## 3. Walkthrough Técnica de Implementação (Evolução do Workspace)

Foi realizado o ajuste e ativação do botão **"+ Adicionar Agente"** no rodapé da barra lateral do Workspace.

### Modificações de Código Realizadas

#### A. Estado Dinâmico de Agentes
Em [`src/app/workspace/page.tsx`](file:///c:/Users/emanuel.moraes/Documents/Pessoal/manager-ai-agent/src/app/workspace/page.tsx), a constante estática `AGENTS` foi substituída por um estado React reativo `agents`:
```tsx
const [agents, setAgents] = useState<Agent[]>(AGENTS);
```
O estado é preenchido com agentes salvos no LocalStorage por meio de um hook `useEffect`:
```tsx
useEffect(() => {
  const saved = localStorage.getItem("manager_ai_agents");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) setAgents(parsed);
    } catch (e) {
      console.error(e);
    }
  }
}, []);
```

#### B. Modal de Criação Premium
Criamos um modal dialog moderno com blur backdrop e animações de fade-in e scale-up:
- **Campos do formulário:** Nome (obrigatório), Função (obrigatório), Ícone (seletor visual de emojis), Cor (seletor tema de cores harmônicas) e Descrição.
- **Validação:** Tratamento de formulário vazio com alerta visual em vermelho dentro do modal.

#### C. Lógica de Adição e Exclusão
- **Criação (`handleCreateAgent`):** Cria um ID aleatório único iniciado por `agent_`, une o novo agente ao vetor e salva no estado e `localStorage`.
- **Edição (`handleEditAgent`):** Permite editar as propriedades do agente (Nome, Função, Ícone, Cor, Descrição, Provedor e Modelo) e salva no estado e `localStorage`.
- **Exclusão (`handleDeleteAgent`):** Remove o agente do estado, do local storage, limpa seu histórico de chat e remove-o de qualquer pipeline em que esteja configurado.

---

## 4. Evolução: Pipelines Dinâmicos, Provedores e Chat 1-on-1

Em uma fase posterior, o Workspace foi evoluído de uma estrutura rígida de 5 fases para uma arquitetura flexível baseada em pipelines dinâmicos, integração com múltiplos provedores de IA e conversas diretas de chat com cada agente.

### A. Integração com Provedores de IA
* Ao criar ou editar um agente, seleciona-se o **Provedor** e o **Modelo**.
* A rota de chat e execução do pipeline carrega as chaves de API do arquivo local `keys.json` (inseridas nas "Configurações"). Se a chave correspondente não estiver configurada, o chat responde em modo de simulação.

### B. Pipelines Dinâmicos e Reordenáveis
* O painel da aba **Pipeline** permite adicionar agentes criados e reordená-los (Mover para Cima/Mover para Baixo) ou removê-los.
* O pipeline ativo é persistido localmente e executado em cadeia (passando o resultado de um agente como contexto para o próximo).

### C. Chat 1-on-1
* O botão de "Conversar" abre um chat individual persistido localmente, ideal para testar o prompt (Descrição/Instruções) do agente antes de integrá-lo ao pipeline.

