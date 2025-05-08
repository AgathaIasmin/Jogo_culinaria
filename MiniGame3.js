const correctOrder = [
    { name: 'pao', img: './assets/img/pao_bottom.png' },
    { name: 'carne', img: './assets/img/carne.png' },
    { name: 'Queijo', img: './assets/img/queijo.png' },
    { name: 'carne', img: './assets/img/carne.png' },
    { name: 'Tomate', img: './assets/img/tomate.png' },
    { name: 'pao', img: './assets/img/pao_top.png' }
];

let neededIngredients = {
    'pao': 2,
    'Queijo': 1,
    'carne': 2,
    'Tomate': 1
};

let lives = 3;
let stack = [];
let timer = 30;
let timerInterval = null;
const maxLives = 3;

const ingredientsDiv = document.getElementById('ingredients');
const burgerArea = document.getElementById('burger-area');
const progressBar = document.getElementById('progress-bar');
const livesPanel = document.getElementById('lives-panel');
const timerPanel = document.getElementById('timer-panel');

function updateLives() {
    livesPanel.textContent = '❤️'.repeat(lives) + '🤍'.repeat(maxLives - lives);
}

function updateProgress() {
    const percent = (stack.length / correctOrder.length) * 100;
    progressBar.style.width = percent + '%';
}

function updateTimer() {
    timerPanel.textContent = `⏰ ${timer}s`;
}

function startTimer() {
    timer = 30;
    updateTimer();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--;
        updateTimer();
        if (timer <= 0) {
            clearInterval(timerInterval);
            setTimeout(() => {
                showGameOver3();
            }, 200);
        }
    }, 1000);
}

function resetIngredients() {
    ingredientsDiv.innerHTML = '';
    Object.entries(neededIngredients).forEach(([name, qty]) => {
        for (let i = 0; i < qty; i++) {
            const div = document.createElement('div');
            div.className = 'ingredient';
            div.draggable = true;
            div.dataset.name = name;
            div.style.backgroundImage = `url('./assets/img/${name.toLowerCase()}.png')`;
            div.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('ingredient', name);
                const img = new Image();
                img.src = `./assets/img/${name.toLowerCase()}.png`;
                img.width = 60;
                img.height = 60;
                e.dataTransfer.setDragImage(img, 30, 30);
                setTimeout(() => div.style.opacity = '0.5', 0);
            });
            div.addEventListener('dragend', () => {
                div.style.opacity = '1';
            });
            ingredientsDiv.appendChild(div);
        }
    });
    highlightNextIngredient();
}

function highlightNextIngredient() {
    const next = correctOrder[stack.length]?.name;
    [...ingredientsDiv.children].forEach(div => {
        if (div.dataset.name === next) {
            div.classList.add('highlight');
        } else {
            div.classList.remove('highlight');
        }
    });
}

burgerArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    burgerArea.style.background = '#ffe0b2';
});
burgerArea.addEventListener('dragleave', () => {
    burgerArea.style.background = '#fff8e1';
});
burgerArea.addEventListener('drop', (e) => {
    e.preventDefault();
    burgerArea.style.background = '#fff8e1';
    const name = e.dataTransfer.getData('ingredient');
    const ingDiv = [...ingredientsDiv.children].find(div => div.dataset.name === name);
    if (ingDiv) {
        const expected = correctOrder[stack.length].name;
        if (name === expected) {
            ingredientsDiv.removeChild(ingDiv);
            stack.push(name);
            const stacked = document.createElement('div');
            stacked.className = 'stacked-ingredient falling glow';
            stacked.style.backgroundImage = `url('./assets/img/${name.toLowerCase()}.png')`;
            burgerArea.appendChild(stacked);
            setTimeout(() => {
                stacked.classList.remove('falling');
                stacked.classList.remove('glow');
            }, 500);
            playSound('success', name);
            updateProgress();
            highlightNextIngredient();
            checkSuccess();
        } else {
            burgerArea.classList.add('shake');
            playSound('error', name);
            lives--;
            updateLives();
            if (lives <= 0) {
                setTimeout(() => {
                    showGameOver3();
                }, 300);
            }
            setTimeout(() => burgerArea.classList.remove('shake'), 400);
        }
    }
});

function checkSuccess() {
    if (stack.length === correctOrder.length) {
        const isCorrect = stack.every((name, i) => name === correctOrder[i].name);
        if (isCorrect) {
            document.getElementById('success-message').style.display = 'block';
            playSound('success');
            clearInterval(timerInterval);
            setTimeout(() => {
                burgerArea.innerHTML = '';
                const ready = document.createElement('img');
                ready.src = './assets/img/hamburguer.png';
                ready.style.width = '180px';
                ready.style.marginTop = '60px';
                ready.style.animation = 'pop 1s';
                burgerArea.appendChild(ready);
                setTimeout(() => {
                    window.location.href = 'MiniGame4.html';
                }, 1500);
            }, 1200);
        } else {
            setTimeout(() => {
                alert('Ordem errada! Tente novamente.');
                restartGame();
            }, 300);
        }
    }
}

function playSound(type, name) {
    if (type === 'success') {
        document.getElementById('success-sound').currentTime = 0;
        document.getElementById('success-sound').play();
    } else if (type === 'error') {
        // Som diferente para cada ingrediente
        let id = 'error-sound-' + (name ? name.toLowerCase() : 'pao');
        const audio = document.getElementById(id) || document.getElementById('error-sound-pao');
        audio.currentTime = 0;
        audio.play();
    }
}

function restartGame() {
    stack = [];
    lives = maxLives;
    updateLives();
    updateProgress();
    burgerArea.innerHTML = '';
    document.getElementById('success-message').style.display = 'none';
    resetIngredients();
    startTimer();
}

function showGameOver3() {
    document.getElementById('gameover3-screen').style.display = 'flex';
    document.getElementById('ticket-objective').style.display = 'none';
    document.getElementById('game-area').style.display = 'none';
    madeleineCorner3.style.display = 'none';
    clearInterval(timerInterval);
}

function hideGameOver3() {
    document.getElementById('gameover3-screen').style.display = 'none';
    document.getElementById('ticket-objective').style.display = '';
    document.getElementById('game-area').style.display = '';
    madeleineCorner3.style.display = 'block';
}

document.getElementById('restart-btn').addEventListener('click', function() {
    hideGameOver3();
    restartGame();
});

// Inicialização
updateLives();
updateProgress();
resetIngredients();
startTimer();

// --- TELA DE START E TUTORIAL ---
const startScreen3 = document.getElementById('start-screen3');
const tutorial3 = document.getElementById('tutorial3');
const tutorial3Text = document.getElementById('tutorial3-text');
const tutorial3Madeleine = document.getElementById('tutorial3-madeleine');
const tutorial3Next = document.getElementById('tutorial3-next');
const startMinigame3Btn = document.getElementById('start-minigame3-btn');
const madeleineCorner3 = document.getElementById('madeleine-corner3');

const tutorialSteps3 = [
    { text: "Arraste os ingredientes para o hambúrguer, na ordem do ticket!", img: "./assets/img/Madeleine1.png" },
    { text: "Só pode colocar o ingrediente certo na vez certa!", img: "./assets/img/Madeleine2.png" },
    { text: "Se errar, você perde uma vida. Se acabar o tempo, também!", img: "./assets/img/Madeleine3.png" },
    { text: "Monte o hambúrguer igual ao pedido para vencer!", img: "./assets/img/Madeleine1.png" }
];
let currentStep3 = 0;

function showTutorial3Step() {
    tutorial3Text.textContent = tutorialSteps3[currentStep3].text;
    tutorial3Madeleine.src = tutorialSteps3[currentStep3].img;
}

startMinigame3Btn.onclick = function() {
    startScreen3.style.display = 'none';
    tutorial3.style.display = 'flex';
    currentStep3 = 0;
    showTutorial3Step();
};

tutorial3Next.onclick = function() {
    currentStep3++;
    if (currentStep3 < tutorialSteps3.length) {
        showTutorial3Step();
    } else {
        tutorial3.style.display = 'none';
        document.getElementById('ticket-objective').style.display = '';
        document.getElementById('game-area').style.display = '';
        madeleineCorner3.style.display = 'block';
    }
};

// Esconde o jogo até passar pelo start/tutorial
window.addEventListener('DOMContentLoaded', function() {
    document.getElementById('ticket-objective').style.display = 'none';
    document.getElementById('game-area').style.display = 'none';
    startScreen3.style.display = 'flex';
    tutorial3.style.display = 'none';
    madeleineCorner3.style.display = 'none';
});

document.getElementById('restart3-btn').addEventListener('click', function() {
    window.location.href = './index.html';
});