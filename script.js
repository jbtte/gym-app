// Configurações do Supabase (Substitua pelos seus dados do Painel > Settings > API)
const supabaseUrl = 'https://vmoexatgbxjgaiaqgljp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb2V4YXRnYnhqZ2FpYXFnbGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTU3MTUsImV4cCI6MjA4NzA5MTcxNX0.g0g2T75guHP1NPZVVohMSRTPPE2W9CQDJ9wLoe_XglM';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
  iniciarApp();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js')
      .catch((err) => console.log('Erro SW:', err));
  }
});

// Renderiza os botões dos dias na Home
async function iniciarApp() {
  const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
  const daysList = document.getElementById('days-list');
  daysList.innerHTML = '';

  const { data } = await _supabase
    .from('exercicios')
    .select('dia_semana, grupo_muscular')
    .order('ordem', { ascending: true });

  const gruposPorDia = {};
  (data || []).forEach(({ dia_semana, grupo_muscular }) => {
    if (!gruposPorDia[dia_semana]) gruposPorDia[dia_semana] = [];
    if (!gruposPorDia[dia_semana].includes(grupo_muscular)) {
      gruposPorDia[dia_semana].push(grupo_muscular);
    }
  });

  dias.forEach((dia) => {
    const btn = document.createElement('button');
    btn.className = 'day-btn';
    const titulo = dia.charAt(0).toUpperCase() + dia.slice(1);
    const gruposlista = (gruposPorDia[dia] || []).slice(0, 4);
    const corPrincipal = `var(--${gruposlista[0] || 'cardio'})`;
    const grupos = gruposlista
      .map((g) => g.charAt(0).toUpperCase() + g.slice(1))
      .join(' · ');
    btn.innerHTML = `
      <div class="color-bar" style="background-color: ${corPrincipal}"></div>
      <div class="day-info">
        <span class="day-name">${titulo}</span>
        <span class="day-groups">${grupos}</span>
      </div>
    `;
    btn.onclick = () => carregarTreinoDoBanco(dia);
    daysList.appendChild(btn);
  });
}

// Busca os exercícios do Supabase
async function carregarTreinoDoBanco(dia) {
  document.getElementById('home-view').classList.add('hidden');
  document.getElementById('workout-view').classList.remove('hidden');
  document.getElementById('workout-title').innerText = `Treino de ${dia}`;

  const listContainer = document.getElementById('exercise-list');
  listContainer.innerHTML =
    '<p style="text-align:center; padding:20px;">Buscando ficha no banco...</p>';

  const { data, error } = await _supabase
    .from('exercicios')
    .select('*')
    .eq('dia_semana', dia)
    .order('ordem', { ascending: true });

  if (error) {
    console.error('Erro:', error);
    listContainer.innerHTML = '<p>Erro ao conectar com o banco de dados.</p>';
    return;
  }

  listContainer.innerHTML = '';
  agruparExercicios(data).forEach((grupo) => {
    listContainer.appendChild(renderGrupo(grupo));
  });

  const btnFinalizar = document.getElementById('btn-finalizar');
  btnFinalizar.textContent = 'Finalizar Treino';
  btnFinalizar.disabled = false;
  btnFinalizar.classList.remove('hidden');
}

function parseGrupoKey(metodologia) {
  if (!metodologia) return null;
  const lower = metodologia.toLowerCase().trim();
  const m = lower.match(/^(superset|bi-?set)\s+([a-z])\b/);
  if (m) return `${m[1].replace('-', '')}-${m[2]}`;
  if (lower.startsWith('circuito')) return 'circuito';
  return null;
}

function parseGrupoLabel(metodologia) {
  if (!metodologia) return null;
  const lower = metodologia.toLowerCase().trim();
  const m = lower.match(/^(superset|bi-?set)\s+([a-z])\b/);
  if (m) return `${m[1].charAt(0).toUpperCase() + m[1].slice(1)} ${m[2].toUpperCase()}`;
  if (lower.startsWith('circuito')) return 'Circuito';
  return null;
}

function agruparExercicios(exercises) {
  const groups = [];
  const seenKeys = new Set();
  const processedIdx = new Set();

  exercises.forEach((ex, i) => {
    if (processedIdx.has(i)) return;
    const key = parseGrupoKey(ex.metodologia);

    if (key && !seenKeys.has(key)) {
      seenKeys.add(key);
      const membros = [];
      exercises.forEach((e, j) => {
        if (parseGrupoKey(e.metodologia) === key) {
          membros.push(e);
          processedIdx.add(j);
        }
      });
      groups.push({ label: parseGrupoLabel(ex.metodologia), exercicios: membros, isGroup: true });
    } else if (!key) {
      processedIdx.add(i);
      groups.push({ label: null, exercicios: [ex], isGroup: false });
    }
  });

  return groups;
}

function renderGrupo(grupo) {
  const wrapper = document.createElement('div');
  wrapper.className = 'exercise-group';

  if (grupo.label) {
    const label = document.createElement('div');
    label.className = 'group-label';
    label.textContent = grupo.label;
    wrapper.appendChild(label);
  }

  if (grupo.isGroup) {
    const cards = document.createElement('div');
    cards.className = 'group-cards';
    grupo.exercicios.forEach((ex) => cards.appendChild(criarCardExercicio(ex, false)));
    wrapper.appendChild(cards);
  } else {
    grupo.exercicios.forEach((ex) => wrapper.appendChild(criarCardExercicio(ex, true)));
  }

  return wrapper;
}

// Cria o HTML do exercício baseado no Schema Pro
function criarCardExercicio(ex, showMetodologia = true) {
  const card = document.createElement('div');
  card.className = 'exercise-card';
  card.dataset.id = ex.id;
  const corGrupo = `var(--${ex.grupo_muscular || 'cardio'})`;

  // Lógica para Repetições (Schema Pro)
  let repsDisplay = ex.is_ate_falha
    ? 'Até a falha'
    : ex.repeticoes_min === ex.repeticoes_max
      ? `${ex.repeticoes_min}`
      : `${ex.repeticoes_min}-${ex.repeticoes_max}`;

  // Lógica para Peso (Se 0 ou nulo, exibe 'Corpo')
  let pesoDisplay =
    ex.peso_atual && ex.peso_atual > 0 ? `${ex.peso_atual} kg` : 'Corpo';

  const pesoCtrl = ex.peso_atual > 0
    ? `<div class="peso-ctrl" data-id="${ex.id}" data-peso="${ex.peso_atual}">
         <button class="peso-btn">−</button>
         <span class="peso-display">${pesoDisplay}</span>
         <button class="peso-btn">+</button>
       </div>`
    : '';

  card.innerHTML = `
        <div class="color-bar" style="background-color: ${corGrupo}"></div>
        <div class="exercise-info">
            <div class="exercise-name">${ex.nome}</div>
            <div class="exercise-details">
                <strong>${ex.series}x</strong> ${repsDisplay}
                ${showMetodologia && ex.metodologia ? `<br><small style="color:${corGrupo}; font-weight:bold;">🛠️ ${ex.metodologia}</small>` : ''}
                ${ex.notas_extras ? `<br><small style="font-style:italic; color:var(--text-sec)">${ex.notas_extras}</small>` : ''}
            </div>
        </div>
        ${pesoCtrl}
    `;

  if (ex.peso_atual > 0) {
    const ctrl = card.querySelector('.peso-ctrl');
    const [btnMenos, btnMais] = ctrl.querySelectorAll('.peso-btn');
    btnMenos.addEventListener('click', (e) => { e.stopPropagation(); atualizarPeso(ctrl, -1); });
    btnMais.addEventListener('click', (e) => { e.stopPropagation(); atualizarPeso(ctrl, +1); });
  }

  adicionarEventosSwipe(card, ex);
  return card;
}

async function atualizarPeso(ctrl, delta) {
  const id = ctrl.dataset.id;
  const pesoAtual = parseFloat(ctrl.dataset.peso);
  const novoPeso = Math.max(0.5, pesoAtual + delta);

  const { error } = await _supabase
    .from('exercicios')
    .update({ peso_atual: novoPeso })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar peso:', error);
    return;
  }

  ctrl.dataset.peso = novoPeso;
  ctrl.querySelector('.peso-display').textContent = `${novoPeso} kg`;
}

// Swipe Direita: CONCLUÍDO
function adicionarEventosSwipe(elemento, ex) {
  let touchStartX = 0;
  const threshold = 80;

  elemento.addEventListener(
    'touchstart',
    (e) => (touchStartX = e.changedTouches[0].screenX),
    { passive: true },
  );

  elemento.addEventListener('touchend', async (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const diffX = touchEndX - touchStartX;

    if (diffX > threshold) {
      elemento.classList.toggle('done');
    }
  });
}

async function finalizarTreino() {
  const cards = document.querySelectorAll('.exercise-card.done');
  if (cards.length === 0) {
    alert('Marque pelo menos um exercício antes de finalizar.');
    return;
  }

  const btn = document.getElementById('btn-finalizar');
  btn.disabled = true;

  const logs = Array.from(cards).map((card) => {
    const pesoCtrl = card.querySelector('.peso-ctrl');
    return {
      exercicio_id: card.dataset.id,
      nome_exercicio: card.querySelector('.exercise-name').textContent,
      concluido: true,
      peso_usado: pesoCtrl ? parseFloat(pesoCtrl.dataset.peso) || null : null,
    };
  });

  const { error } = await _supabase.from('logs_treino').insert(logs);

  if (error) {
    console.error('Erro ao finalizar treino:', error);
    btn.disabled = false;
    return;
  }

  voltarParaHome();
}

function voltarParaHome() {
  document.getElementById('workout-view').classList.add('hidden');
  document.getElementById('progress-view').classList.add('hidden');
  document.getElementById('btn-finalizar').classList.add('hidden');
  document.getElementById('home-view').classList.remove('hidden');
}

async function carregarProgresso() {
  document.getElementById('home-view').classList.add('hidden');
  document.getElementById('progress-view').classList.remove('hidden');

  const container = document.getElementById('progress-list');
  container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-sec)">Carregando...</p>';

  const { data, error } = await _supabase
    .from('logs_treino')
    .select('created_at, peso_usado, nome_exercicio, exercicios(nome, grupo_muscular)')
    .not('peso_usado', 'is', null)
    .gt('peso_usado', 0)
    .order('created_at', { ascending: true });

  if (error) {
    container.innerHTML = '<p style="text-align:center;padding:40px;">Erro ao carregar dados.</p>';
    return;
  }

  const byExercise = {};
  (data || []).forEach((log) => {
    const nome = log.exercicios?.nome || log.nome_exercicio;
    const grupo = log.exercicios?.grupo_muscular || 'cardio';
    if (!nome) return;
    if (!byExercise[nome]) byExercise[nome] = { grupo, entradas: [] };
    byExercise[nome].entradas.push({
      date: new Date(log.created_at),
      peso: log.peso_usado,
    });
  });

  const entries = Object.entries(byExercise);

  if (entries.length === 0) {
    container.innerHTML = `
      <p style="text-align:center;padding:40px;color:var(--text-sec);line-height:1.6">
        Nenhuma progressão registrada ainda.<br>
        <small>Complete alguns treinos para ver os dados aqui.</small>
      </p>`;
    return;
  }

  container.innerHTML = '';
  entries.forEach(([nome, { grupo, entradas }]) => {
    container.appendChild(criarCardProgresso(nome, grupo, entradas));
  });
}

function criarCardProgresso(nome, grupo, entradas) {
  const card = document.createElement('div');
  card.className = 'progress-card';

  const cor = `var(--${grupo || 'cardio'})`;
  const pesos = entradas.map((e) => e.peso);
  const pesoAtual = pesos[pesos.length - 1];
  const delta = pesoAtual - pesos[0];
  const deltaStr = delta === 0 ? '' : (delta > 0 ? `+${delta} kg` : `${delta} kg`);
  const deltaClass = delta > 0 ? 'delta-pos' : delta < 0 ? 'delta-neg' : '';

  card.innerHTML = `
    <div class="color-bar" style="background-color:${cor}"></div>
    <div class="progress-info">
      <div class="progress-name">${nome}</div>
      <div class="progress-meta">
        <span class="progress-weight">${pesoAtual} kg</span>
        ${deltaStr ? `<span class="progress-delta ${deltaClass}">${deltaStr}</span>` : ''}
        <span class="progress-count">${entradas.length} sessões</span>
      </div>
    </div>
    <div class="sparkline" style="color:${cor}">${sparkline(pesos)}</div>
  `;

  return card;
}

function sparkline(pesos, w = 80, h = 34) {
  if (pesos.length < 2) {
    return `<svg width="${w}" height="${h}"><circle cx="${w / 2}" cy="${h / 2}" r="3" fill="currentColor" opacity="0.5"/></svg>`;
  }
  const min = Math.min(...pesos);
  const max = Math.max(...pesos);
  const range = max - min || 1;
  const pad = 4;
  const pts = pesos.map((v, i) => {
    const x = ((i / (pesos.length - 1)) * (w - pad * 2) + pad).toFixed(1);
    const y = (h - pad - ((v - min) / range) * (h - pad * 2)).toFixed(1);
    return `${x},${y}`;
  });
  const [lastX, lastY] = pts[pts.length - 1].split(',');
  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <polyline points="${pts.join(' ')}" fill="none" stroke="currentColor" stroke-width="1.5"
        stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
      <circle cx="${lastX}" cy="${lastY}" r="3" fill="currentColor"/>
    </svg>`;
}
