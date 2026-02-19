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
  data.forEach((ex) => {
    const card = criarCardExercicio(ex);
    listContainer.appendChild(card);
  });

  const btnFinalizar = document.getElementById('btn-finalizar');
  btnFinalizar.textContent = 'Finalizar Treino';
  btnFinalizar.disabled = false;
  btnFinalizar.classList.remove('hidden');
}

// Cria o HTML do exercício baseado no Schema Pro
function criarCardExercicio(ex) {
  const card = document.createElement('div');
  card.className = 'exercise-card';
  card.dataset.id = ex.id;
  const corGrupo = `var(--${ex.grupo_muscular || 'cardio'})`;

  // Lógica para Repetições (Schema Pro)
  let repsDisplay = ex.is_ate_falha
    ? 'Até a falha'
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
                ${ex.metodologia ? `<br><small style="color:${corGrupo}; font-weight:bold;">🛠️ ${ex.metodologia}</small>` : ''}
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
    voltarParaHome();
    return;
  }

  const btn = document.getElementById('btn-finalizar');
  btn.disabled = true;

  const logs = Array.from(cards).map((card) => ({
    exercicio_id: card.dataset.id,
    concluido: true,
  }));

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
  document.getElementById('btn-finalizar').classList.add('hidden');
  document.getElementById('home-view').classList.remove('hidden');
}
