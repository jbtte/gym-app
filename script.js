let dadosTreino = {};

// Solicita permissão para notificações do navegador
if ('Notification' in window) {
  Notification.requestPermission();
}

// Carrega o JSON via Fetch API
fetch('treino.json')
  .then((response) => response.json())
  .then((data) => {
    dadosTreino = data;
    iniciarApp();
  })
  .catch((error) => console.error('Erro ao carregar o treino.json:', error));

function iniciarApp() {
  const daysList = document.getElementById('days-list');
  for (const dia in dadosTreino.treino) {
    const btn = document.createElement('button');
    btn.className = 'day-btn';
    const focos = dadosTreino.treino[dia].foco.join(', ');
    btn.innerHTML = `${dia} <span>Foco: ${focos}</span>`;
    btn.onclick = () => carregarTreino(dia);
    daysList.appendChild(btn);
  }
}

function carregarTreino(dia) {
  document.getElementById('home-view').classList.add('hidden');
  document.getElementById('workout-view').classList.remove('hidden');
  document.getElementById('workout-title').innerText = `Treino de ${dia}`;

  const listContainer = document.getElementById('exercise-list');
  listContainer.innerHTML = '';

  const exercicios = dadosTreino.treino[dia].exercicios;

  exercicios.forEach((ex) => {
    const card = document.createElement('div');
    card.className = 'exercise-card';

    const corGrupo = `var(--${ex.grupo_muscular_principal})`;

    let detalhes =
      ex.series !== '—'
        ? `${ex.series}x ${ex.repeticoes} reps`
        : `${ex.repeticoes}`;
    if (ex.peso !== '—') detalhes += ` - <span>${ex.peso}</span>`;

    card.innerHTML = `
            <div class="color-bar" style="background-color: ${corGrupo}"></div>
            <div class="exercise-info">
                <div class="exercise-name">${ex.nome}</div>
                <div class="exercise-details" style="color: ${corGrupo}">
                    ${detalhes}
                </div>
            </div>
        `;

    adicionarEventosDeSwipe(card, ex.nome);
    listContainer.appendChild(card);
  });
}

function voltarParaHome() {
  document.getElementById('workout-view').classList.add('hidden');
  document.getElementById('home-view').classList.remove('hidden');
}

function adicionarEventosDeSwipe(elemento, nomeExercicio) {
  let touchStartX = 0;
  let touchEndX = 0;
  const threshold = 80;

  elemento.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    elemento.style.transition = 'none';
  });

  elemento.addEventListener('touchmove', (e) => {
    let currentX = e.changedTouches[0].screenX;
    let diffX = currentX - touchStartX;
    if (diffX > -150 && diffX < 150) {
      elemento.style.transform = `translateX(${diffX}px)`;
    }
  });

  elemento.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    elemento.style.transition = 'transform 0.2s ease-out';
    elemento.style.transform = 'translateX(0px)';

    let diffX = touchEndX - touchStartX;

    if (diffX > threshold) {
      elemento.classList.toggle('done');
    } else if (diffX < -threshold) {
      notificarAumentoCarga(nomeExercicio);
    }
  });
}

function notificarAumentoCarga(exercicio) {
  // Substitua pelo seu número (DDI + DDD + Número)
  // Exemplo para Brasília: 5561999999999
  const meuNumero = '55619XXXXXXXX';

  // Formatação em Markdown do WhatsApp para facilitar o log
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const mensagem =
    `📌 *LOG DE TREINO - ${dataAtual}*\n\n` +
    `🚀 *Ajuste Necessário:* Aumentar carga\n` +
    `🏋️ *Exercício:* ${exercicio}\n\n` +
    `_Enviado via GymApp_`;

  // Abre o link da API do WhatsApp
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${meuNumero}&text=${encodeURIComponent(mensagem)}`;

  // Abre em uma nova aba/janela
  window.open(whatsappUrl, '_blank');
}
