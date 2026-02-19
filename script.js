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
function iniciarApp() {
  const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
  const daysList = document.getElementById('days-list');
  daysList.innerHTML = '';

  dias.forEach((dia) => {
    const btn = document.createElement('button');
    btn.className = 'day-btn';
    // Capitaliza a primeira letra para o botão
    const titulo = dia.charAt(0).toUpperCase() + dia.slice(1);
    btn.innerHTML = `${titulo} <span>Toque para iniciar o treino</span>`;
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
}

// Cria o HTML do exercício baseado no Schema Pro
function criarCardExercicio(ex) {
  const card = document.createElement('div');
  card.className = 'exercise-card';
  const corGrupo = `var(--${ex.grupo_muscular || 'cardio'})`;

  // Lógica para Repetições (Schema Pro)
  let repsDisplay = ex.is_ate_falha
    ? 'Até a falha'
    : `${ex.repeticoes_min}-${ex.repeticoes_max}`;

  // Lógica para Peso (Se 0 ou nulo, exibe 'Corpo')
  let pesoDisplay =
    ex.peso_atual && ex.peso_atual > 0 ? `${ex.peso_atual} kg` : 'Corpo';

  card.innerHTML = `
        <div class="color-bar" style="background-color: ${corGrupo}"></div>
        <div class="exercise-info">
            <div class="exercise-name">${ex.nome}</div>
            <div class="exercise-details">
                <strong>${ex.series}x</strong> ${repsDisplay} | <span>${pesoDisplay}</span>
                ${ex.metodologia ? `<br><small style="color:${corGrupo}; font-weight:bold;">🛠️ ${ex.metodologia}</small>` : ''}
                ${ex.notas_extras ? `<br><small style="font-style:italic; color:var(--text-sec)">${ex.notas_extras}</small>` : ''}
            </div>
        </div>
    `;

  adicionarEventosSwipe(card, ex);
  return card;
}

// Swipe: Direita (Check), Esquerda (WhatsApp + Log de Carga)
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
      // Swipe Direita: CONCLUÍDO
      elemento.classList.toggle('done');
      await registrarLogNoBanco(ex.id, true, false);
    } else if (diffX < -threshold) {
      // Swipe Esquerda: AUMENTO DE CARGA
      notificarWhatsApp(ex.nome);
      await registrarLogNoBanco(ex.id, true, true);
    }
  });
}

// Persistência real na tabela logs_treino
async function registrarLogNoBanco(exercicioId, concluido, aumento) {
  const { error } = await _supabase.from('logs_treino').insert([
    {
      exercicio_id: exercicioId,
      concluido: concluido,
      aumento_carga: aumento,
    },
  ]);

  if (error) console.error('Erro ao salvar log no banco:', error);
}

function notificarWhatsApp(nomeExercicio) {
  const meuNumero = '55619XXXXXXXX'; // Configure seu número aqui
  const dataHj = new Date().toLocaleDateString('pt-BR');
  const msg = `🚀 *PROGRESSÃO DE CARGA* - ${dataHj}\n\nExercicio: *${nomeExercicio}*\n_Registrado no Log do Supabase._`;
  window.open(
    `https://api.whatsapp.com/send?phone=${meuNumero}&text=${encodeURIComponent(msg)}`,
    '_blank',
  );
}

function voltarParaHome() {
  document.getElementById('workout-view').classList.add('hidden');
  document.getElementById('home-view').classList.remove('hidden');
}
