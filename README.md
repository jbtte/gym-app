# 🏋️ GymApp

Uma aplicação web leve, minimalista e dinâmica para acompanhamento de treinos diários. O projeto foi desenvolvido para ser executado diretamente no **GitHub Pages**, utilizando uma arquitetura baseada em dados (JSON) para facilitar a manutenção e atualização das fichas de exercício.

## 🚀 Funcionalidades

- **Carregamento Dinâmico:** Os treinos são gerados automaticamente a partir de um arquivo `treino.json`.
- **Interface Intuitiva:** Separação visual por cores para cada grupo muscular (Peito, Costas, Pernas, Ombros, Biceps, Triceps, Core e Cardio).
- **Gestão de Progresso via Gestos (Swipe):**
  - **Arraste para a Direita:** Marca o exercício como concluído (efeito visual acinzentado).
  - **Arraste para a Esquerda:** Dispara um alerta de progressão de carga.
- **Integração com Log Pessoal:** O alerta de aumento de carga gera automaticamente uma mensagem formatada para ser enviada ao WhatsApp, permitindo o registro histórico em um grupo de log pessoal.

## 📂 Estrutura do Projeto

```text
gym-app/
├── index.html    # Estrutura principal da aplicação
├── styles.css    # Estilização e variáveis de cores dos grupos musculares
├── script.js     # Lógica de interação, fetch de dados e eventos de touch
└── treino.json   # Base de dados dos exercícios e focos do dia
```
