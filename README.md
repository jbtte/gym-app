# Gym App

PWA pessoal de acompanhamento de treino. Roda no celular como app instalado, dados persistidos no Supabase.

## Stack

- HTML / CSS / JS puro (sem frameworks)
- [Supabase](https://supabase.com) como backend (PostgreSQL)
- Service Worker para suporte offline

## Como usar

### Rodar localmente

```bash
python3 -m http.server 8080
# acesse http://localhost:8080
```

### Atualizar a ficha de treino

Edite `admin/treino.json` e rode o script de migração a partir da raiz do projeto:

```bash
python3 admin/migrate.py
```

O script limpa a tabela `exercicios` e reinsere tudo do zero.

---

## Formato do JSON (`admin/treino.json`)

```json
{
  "treino": {
    "segunda": {
      "foco": ["peito", "ombro", "triceps"],
      "exercicios": [
        {
          "nome": "Supino reto barra",
          "series": "4",
          "repeticoes": "5–6",
          "peso": "32 kg",
          "grupo_muscular_principal": "peito",
          "metodologia": "opcional"
        }
      ]
    }
  }
}
```

### Dias válidos
`segunda` `terca` `quarta` `quinta` `sexta`

### Grupos musculares válidos
| Valor | Cor |
|---|---|
| `peito` | laranja |
| `costas` | azul |
| `pernas` | verde |
| `ombro` | amarelo |
| `biceps` | vermelho |
| `triceps` | roxo |
| `core` | rosa |
| `cardio` | cinza |

### Campos especiais

**`series`**
- Número normal: `"4"`
- Cardio/sem série: `"—"` → salvo como `0`

**`repeticoes`**
- Range: `"8–10"` (usar en dash –)
- Número fixo: `"12"`
- Até a falha: qualquer string com "falha" → `is_ate_falha = true`
- Tempo/descrição: `"12 min"`, `"40s"` → salvo em `notas_extras`, exibido em itálico no card

**`peso`**
- Com unidade: `"32 kg"` → salvo como `32.0`
- Peso corporal / sem carga: `"peso corporal"`, `"moderado"`, `"—"` → salvo como `0`, exibido como "Corpo"

**`metodologia`** *(opcional)*
Exibido em destaque no card. Ex: `"Drop-set"`, `"Bi-set"`.

---

## Tabelas no Supabase

### `exercicios`
| Coluna | Tipo |
|---|---|
| `id` | uuid (PK) |
| `dia_semana` | text |
| `nome` | text |
| `series` | int |
| `repeticoes_min` | int |
| `repeticoes_max` | int |
| `peso_atual` | float |
| `grupo_muscular` | text |
| `ordem` | int |
| `is_ate_falha` | bool |
| `notas_extras` | text |
| `metodologia` | text |

### `logs_treino`
| Coluna | Tipo |
|---|---|
| `id` | uuid (PK) |
| `exercicio_id` | uuid (FK → exercicios) |
| `concluido` | bool |
| `created_at` | timestamp |

### RLS policies necessárias
- `exercicios`: SELECT e UPDATE para role `anon`
- `logs_treino`: INSERT para role `anon`
