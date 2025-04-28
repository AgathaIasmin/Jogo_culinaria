let victoryScreen = document.getElementById('victory-screen');
let minigame2Screen = document.getElementById('minigame2-screen');
let chapa = document.getElementById('chapa');
let pattyStack = document.getElementById('patty-stack-visual');
let trashArea = document.getElementById('trash-area');
let startScreen = document.getElementById('start-screen');
let startMinigameBtn = document.getElementById('start-minigame-btn');
let finishedBurgers = document.getElementById('finished-burgers');

let activePatties = [];
let cookingPatties = [];
let cookedPatties = [];
let burntPatties = [];
let isDragging = false;
let currentPatty = null;
let cookingTimers = new Map();
let gameScore = 0;
let gameLives = 3;

const backgroundMusic = new Audio('./assets/audio/joyful.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;
backgroundMusic.muted = true;

document.addEventListener('click', function() {
    backgroundMusic.muted = false;
    backgroundMusic.play().catch(error => {
        console.error('Erro ao reproduzir áudio:', error);
    });
}, { once: true });

document.addEventListener('DOMContentLoaded', function() {
    minigame2Screen.style.display = 'none';
    tutorial2.style.display = 'none';

    startMinigameBtn.addEventListener('click', function() {
        startScreen.style.display = 'none';
        minigame2Screen.style.display = 'flex';
        tutorial2.style.display = 'flex';
        currentStep2 = 0;
        showTutorial2Step();
    });

    tutorial2Next.onclick = function() {
        currentStep2++;
        if (currentStep2 < tutorialSteps2.length) {
            showTutorial2Step();
        } else {
            tutorial2.style.display = 'none';
            initializeMiniGame2();
        }
    };
});

pattyStack.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', 'patty');
    pattyStack.style.opacity = '0.5';
});

pattyStack.addEventListener('dragend', (e) => {
    pattyStack.style.opacity = '1';
});

chapa.addEventListener('dragover', (e) => {
    e.preventDefault();
    chapa.classList.add('drag-over');
});

chapa.addEventListener('dragleave', () => {
    chapa.classList.remove('drag-over');
});

chapa.addEventListener('drop', (e) => {
    e.preventDefault();
    chapa.classList.remove('drag-over');
    if (e.dataTransfer.getData('text/plain') === 'patty') {
        const patty = createPattyOnGrill();
        const rect = chapa.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        patty.style.left = `${x - 60}px`;
        patty.style.top = `${y - 50}px`;
        chapa.appendChild(patty);
        activePatties.push(patty);
        startCooking(patty);
    }
});

const PATTY_IMAGES = {
    raw: './assets/img/carne.png',
    cooking: './assets/img/carne.png',
    cooked: './assets/img/carne_.png',
    burnt: './assets/img/carne.png',
    small: './assets/img/carne.png'
};

function createPattyOnGrill() {
    const pattyWrapper = document.createElement('div');
    pattyWrapper.className = 'patty-wrapper';
    pattyWrapper.draggable = true;
    
    const patty = document.createElement('div');
    patty.className = 'patty-on-grill';
    patty.setAttribute('data-cooking-state', 'raw');
    patty.setAttribute('data-cooking-progress', '0');
    patty.setAttribute('data-flipped', 'false');
    patty.style.backgroundImage = `url('${PATTY_IMAGES.raw}')`;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'cooking-progress';
    const progressBarInner = document.createElement('div');
    progressBarInner.className = 'cooking-progress-bar';
    progressBar.appendChild(progressBarInner);
    
    const flipWarning = document.createElement('div');
    flipWarning.className = 'flip-warning';
    flipWarning.textContent = 'Vire a carne!';
    
    const readyNotification = document.createElement('div');
    readyNotification.className = 'ready-notification';
    readyNotification.textContent = 'Pronto!';
    
    pattyWrapper.appendChild(flipWarning);
    pattyWrapper.appendChild(readyNotification);
    pattyWrapper.appendChild(patty);
    pattyWrapper.appendChild(progressBar);
    
    // Drag and drop para o pattyWrapper
    pattyWrapper.addEventListener('dragstart', (e) => {
        const patty = pattyWrapper.querySelector('.patty-on-grill');
        const state = patty.getAttribute('data-cooking-state');
        if (state === 'cooked' || state === 'burnt') {
            isDragging = true;
            currentPatty = pattyWrapper;
            setTimeout(() => {
                pattyWrapper.classList.add('dragging');
            }, 0);
        } else {
            e.preventDefault();
        }
    });

    pattyWrapper.addEventListener('dragend', (e) => {
        isDragging = false;
        currentPatty = null;
        pattyWrapper.classList.remove('dragging');
    });

    pattyWrapper.addEventListener('click', handlePattyClick);
    
    return pattyWrapper;
}

function handlePattyClick(e) {
    const patty = e.currentTarget.querySelector('.patty-on-grill');
    const state = patty.getAttribute('data-cooking-state');
    const progress = parseInt(patty.getAttribute('data-cooking-progress'));
    const isFlipped = patty.getAttribute('data-flipped') === 'true';
    
    if (state === 'side1' && progress >= 50 && !isFlipped) {
        patty.setAttribute('data-cooking-state', 'side2');
        patty.setAttribute('data-cooking-progress', '0');
        patty.setAttribute('data-flipped', 'true');
        patty.style.transform = 'scaleX(-1)';
        
        const flipWarning = e.currentTarget.querySelector('.flip-warning');
        flipWarning.style.display = 'none';
        
        playSizzleSound();
    }
}

function startCooking(patty) {
    const pattyElement = patty.querySelector('.patty-on-grill');
    const progressBar = patty.querySelector('.cooking-progress-bar');
    const flipWarning = patty.querySelector('.flip-warning');
    
    cookingPatties.push(patty);
    
    const startTime = Date.now();
    const totalCookTime = 6000;
    const flipTime = 3000;
    
    const timer = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const progress = (elapsedTime / totalCookTime) * 100;
        const isFlipped = pattyElement.getAttribute('data-flipped') === 'true';
        
        pattyElement.setAttribute('data-cooking-progress', progress.toString());
        progressBar.style.width = `${progress}%`;
        
        if (!isFlipped) {
            if (elapsedTime <= flipTime) {
                pattyElement.setAttribute('data-cooking-state', 'side1');
                pattyElement.style.backgroundImage = `url('${PATTY_IMAGES.cooking}')`;
                flipWarning.style.display = 'none';
                pattyElement.classList.remove('burnt');
            } else if (elapsedTime <= flipTime + 1000) {
                pattyElement.setAttribute('data-cooking-state', 'side1');
                pattyElement.style.backgroundImage = `url('${PATTY_IMAGES.cooking}')`;
                flipWarning.style.display = 'block';
                pattyElement.classList.remove('burnt');
            } else {
                pattyElement.setAttribute('data-cooking-state', 'burnt');
                pattyElement.style.backgroundImage = `url('${PATTY_IMAGES.burnt}')`;
                flipWarning.style.display = 'none';
                pattyElement.classList.add('burnt');
                clearInterval(timer);
                finishCooking(patty);
            }
        } else {
            if (elapsedTime <= totalCookTime) {
                pattyElement.setAttribute('data-cooking-state', 'side2');
                pattyElement.style.backgroundImage = `url('${PATTY_IMAGES.cooked}')`;
                flipWarning.style.display = 'none';
                pattyElement.classList.remove('burnt');
            } else {
                pattyElement.setAttribute('data-cooking-state', 'cooked');
                pattyElement.style.backgroundImage = `url('${PATTY_IMAGES.cooked}')`;
                flipWarning.style.display = 'none';
                pattyElement.classList.remove('burnt');
                clearInterval(timer);
                finishCooking(patty);
            }
        }
    }, 50);
    
    cookingTimers.set(patty, timer);
}

function finishCooking(patty) {
    const pattyElement = patty.querySelector('.patty-on-grill');
    const readyNotification = patty.querySelector('.ready-notification');
    const index = cookingPatties.indexOf(patty);
    
    if (index !== -1) {
        cookingPatties.splice(index, 1);
    }
    
    const state = pattyElement.getAttribute('data-cooking-state');
    if (state === 'burnt') {
        burntPatties.push(patty);
        gameLives--;
        checkGameProgress();
    } else if (state === 'cooked') {
        cookedPatties.push(patty);
        readyNotification.style.display = 'block';
        playSuccessSound();
    }
    
    const timer = cookingTimers.get(patty);
    if (timer) {
        clearInterval(timer);
        cookingTimers.delete(patty);
    }

    // Inicia o temporizador de queima
    patty.burnTimeout = setTimeout(() => {
        if (state === 'cooked') {
            pattyElement.setAttribute('data-cooking-state', 'burnt');
            pattyElement.style.backgroundImage = `url('${PATTY_IMAGES.burnt}')`;
            pattyElement.classList.remove('ready');
            pattyElement.classList.add('burnt');
            // Aqui você pode tocar um som, mostrar mensagem, etc.
        }
    }, 4000);
}

function checkGameProgress() {
    if (gameLives <= 0) {
        endGame(false);
    } else if (gameScore >= 2) {
        endGame(true);
    }
}

function endGame(isWin) {
    if (isWin) {
        showVictoryScreen();
    } else {
        showGameOverScreen();
    }
}

function playSizzleSound() {
    const sizzle = new Audio('./assets/audio/sizzle.mp3');
    sizzle.volume = 0.3;
    sizzle.play();
}

function playSuccessSound() {
    const success = new Audio('./assets/audio/success.mp3');
    success.volume = 0.3;
    success.play();
}

function playTrashSound() {
    const trashSound = new Audio('./assets/audio/trash.mp3');
    trashSound.volume = 0.3;
    trashSound.play();
}

function showVictoryScreen() {
    victoryScreen.style.display = 'flex';
    setTimeout(() => {
        window.location.href = 'MiniGame3.html';
    }, 1800);
}

function showGameOverScreen() {
    minigame2Screen.style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'flex';
}

function initializeMiniGame2() {
    while (chapa.firstChild) {
        chapa.removeChild(chapa.firstChild);
    }
    
    activePatties = [];
    cookingPatties = [];
    cookedPatties = [];
    burntPatties = [];
    isDragging = false;
    currentPatty = null;
    cookingTimers.clear();
    gameScore = 0;
    gameLives = 3;
}

trashArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (isDragging && currentPatty) {
        const patty = currentPatty.querySelector('.patty-on-grill');
        const state = patty.getAttribute('data-cooking-state');
        if (state === 'burnt') {
            trashArea.classList.add('drag-over');
        }
    }
});

trashArea.addEventListener('dragleave', () => {
    trashArea.classList.remove('drag-over');
});

trashArea.addEventListener('drop', (e) => {
    e.preventDefault();
    trashArea.classList.remove('drag-over');
    
    if (isDragging && currentPatty) {
        const patty = currentPatty.querySelector('.patty-on-grill');
        const state = patty.getAttribute('data-cooking-state');
        
        if (state === 'burnt') {
            currentPatty.remove();
            
            const activeIndex = activePatties.indexOf(currentPatty);
            if (activeIndex !== -1) {
                activePatties.splice(activeIndex, 1);
            }
            
            const burntIndex = burntPatties.indexOf(currentPatty);
            if (burntIndex !== -1) {
                burntPatties.splice(burntIndex, 1);
            }
            
            playTrashSound();
            
            checkGameProgress();
        }
        
        isDragging = false;
        currentPatty = null;
    }
});

// Adicione o drop para hambúrgueres prontos
finishedBurgers.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (isDragging && currentPatty) {
        const patty = currentPatty.querySelector('.patty-on-grill');
        const state = patty.getAttribute('data-cooking-state');
        if (state === 'cooked') {
            finishedBurgers.classList.add('drag-over');
        }
    }
});

finishedBurgers.addEventListener('dragleave', () => {
    finishedBurgers.classList.remove('drag-over');
});

finishedBurgers.addEventListener('drop', (e) => {
    e.preventDefault();
    finishedBurgers.classList.remove('drag-over');
    if (isDragging && currentPatty) {
        const patty = currentPatty.querySelector('.patty-on-grill');
        const state = patty.getAttribute('data-cooking-state');
        if (state === 'cooked') {
            // Remove o patty da chapa
            currentPatty.remove();

            // Remove das listas ativas
            const activeIndex = activePatties.indexOf(currentPatty);
            if (activeIndex !== -1) {
                activePatties.splice(activeIndex, 1);
            }

            const cookedIndex = cookedPatties.indexOf(currentPatty);
            if (cookedIndex !== -1) {
                cookedPatties.splice(cookedIndex, 1);
            }

            // Cria um novo patty na área de hambúrgueres prontos
            const cookedPatty = document.createElement('div');
            cookedPatty.className = 'cooked-patty';
            cookedPatty.style.backgroundImage = `url('${PATTY_IMAGES.small}')`;
            cookedPatty.style.backgroundSize = 'contain';
            cookedPatty.style.backgroundPosition = 'center';
            cookedPatty.style.backgroundRepeat = 'no-repeat';
            finishedBurgers.appendChild(cookedPatty);

            // Incrementa a pontuação
            gameScore++;

            // Toca o som de sucesso
            playSuccessSound();
        }
        isDragging = false;
        currentPatty = null;
    }
});

function goToMiniGame3() {
    minigame2Screen.style.display = 'none';
    document.getElementById('minigame3-screen').style.display = 'flex';
}

let prontoBtn = document.getElementById('pronto-btn');
prontoBtn.addEventListener('click', function() {
    const prontos = finishedBurgers.querySelectorAll('.cooked-patty').length;
    if (prontos >= 2) {
        showVictoryScreen();
    } else {
        endGame(false);
    }
});

document.getElementById('restart-btn').addEventListener('click', function() {
    window.location.href = './index.html';
});

// --- TELA DE TUTORIAL MINIGAME2 ---
const tutorial2 = document.getElementById('tutorial2');
const tutorial2Text = document.getElementById('tutorial2-text');
const tutorial2Madeleine = document.getElementById('tutorial2-madeleine');
const tutorial2Next = document.getElementById('tutorial2-next');

const tutorialSteps2 = [
    { text: "Arraste as carnes para a chapa para começar a fritar!", img: "./assets/img/Madeleine1.png" },
    { text: "Espere o lado dourar, clique para virar e frite o outro lado.", img: "./assets/img/Madeleine2.png" },
    { text: "Quando estiver pronta, arraste para o prato de hambúrgueres prontos.", img: "./assets/img/Madeleine3.png" },
    { text: "Cuidado para não queimar! Se queimar, jogue na lixeira.", img: "./assets/img/Madeleine1.png" }
];
let currentStep2 = 0;

function showTutorial2Step() {
    tutorial2Text.textContent = tutorialSteps2[currentStep2].text;
    tutorial2Madeleine.src = tutorialSteps2[currentStep2].img;
}