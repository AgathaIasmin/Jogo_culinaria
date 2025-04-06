const menu = document.getElementById('menu');
const animationScreen = document.getElementById('animation-screen');
const recipeSelection = document.getElementById('recipe-selection');
const minigame = document.getElementById('minigame');
const startBtn = document.getElementById('start-btn');
const creditsBtn = document.getElementById('credits-btn');
const recipeOptions = document.querySelectorAll('.recipe-option');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const character = document.getElementById('character');
const tutorial = document.getElementById('tutorial');
const tutorialText = document.getElementById('tutorial-text');
const tutorialCharacter = document.getElementById('tutorial-character');
const tutorialNext = document.getElementById('tutorial-next');
const endingScreen = document.getElementById('ending-screen');
const restartBtn = document.getElementById('restart-btn');
const creditsScreen = document.getElementById('credits-screen');
const backBtn = document.getElementById('back-btn');

let score = 0;
let lives = 3;
let neededIngredients = {
    'Pão': 2,
    'Queijo': 2,
    'Hambúrguer': 1
};
let collectedIngredients = {
    'Pão': 0,
    'Queijo': 0,
    'Hambúrguer': 0
};
let wrongIngredients = ['Tomate', 'Cebola', 'Alface', 'Bacon', 'Pepino'];
let activeIngredients = [];
const maxIngredients = 20;
let currentTutorialStep = 0;
let collisionInterval;
let meggyBlinkInterval;
let meggyReactionTimeout;

const INGREDIENT_IMAGES = {
    'Pão': './assets/img/pao.png',
    'Queijo': './assets/img/queijo.png',
    'Hambúrguer': './assets/img/hamburguer.png',
    'Tomate': './assets/img/tomate.png',
    'Cebola': './assets/img/cebola.png',
    'Alface': './assets/img/alface.png',
    'Bacon': './assets/img/bacon.png',
    'Pepino': './assets/img/pepino.png'
};

const tutorialSteps = [{
    text: "Oi chef! Vamos preparar um hambúrguer delicioso?",
    sprite: "./assets/img/meggy1.png"
},
{
    text: "Eu vou jogar os ingredientes continuamente!",
    sprite: "./assets/img/meggy2.png"
},
{
    text: "Precisamos de: 2 pães, 2 queijos e 1 hambúrguer!",
    sprite: "./assets/img/meggy1.png"
},
{
    text: "Cuidado com os ingredientes errados! 3 erros e você perde!",
    sprite: "./assets/img/meggy2.png"
},
{
    text: "Use o mouse para clicar nos ingredientes certos!",
    sprite: "./assets/img/meggy1.png"
}
];

startBtn.addEventListener('click', () => {
    menu.style.display = 'none';
    animationScreen.style.display = 'flex';
    animateMeggyThrow();

    setTimeout(() => {
        animationScreen.style.display = 'none';
        recipeSelection.style.display = 'flex';
        character.style.backgroundImage = 'url(./assets/img/meggy.png)';
    }, 3000);
});

recipeOptions.forEach(option => {
    option.addEventListener('click', () => {
        startMinigame();
    });
});

tutorialNext.addEventListener('click', () => {
    currentTutorialStep++;

    if (currentTutorialStep < tutorialSteps.length) {
        updateTutorial();
    } else {
        tutorial.style.display = 'none';
        startGameplay();
    }
});

creditsBtn.addEventListener('click', () => {
    menu.style.display = 'none';
    creditsScreen.style.display = 'flex';
});

backBtn.addEventListener('click', () => {
    creditsScreen.style.display = 'none';
    menu.style.display = 'flex';
});

restartBtn.addEventListener('click', () => {
    endingScreen.style.display = 'none';
    menu.style.display = 'flex';

    score = 0;
    lives = 3;
    collectedIngredients = {
        'Pão': 0,
        'Queijo': 0,
        'Hambúrguer': 0
    };
});

endingScreen.style.display = 'none';

function animateMeggyThrow() {
    character.style.backgroundImage = 'url(./assets/img/meggy1.png)';
    setTimeout(() => {
        character.style.backgroundImage = 'url(./assets/img/meggy3.png)';
    }, 500);
}

function updateTutorial() {
    const step = tutorialSteps[currentTutorialStep];
    tutorialText.textContent = step.text;
    tutorialCharacter.style.backgroundImage = `url('${step.sprite}')`;
}

function startMinigame() {
    recipeSelection.style.display = 'none';
    minigame.style.display = 'block';

    score = 0;
    lives = 3;
    collectedIngredients = {
        'Pão': 0,
        'Queijo': 0,
        'Hambúrguer': 0
    };

    scoreElement.textContent = `Ingredientes: 0/5`;
    livesElement.textContent = `Vidas: 3`;

    currentTutorialStep = 0;
    updateTutorial();
    tutorial.style.display = 'flex';
}

function startGameplay() {
    minigame.querySelectorAll('.ingredient').forEach(el => el.remove());
    activeIngredients = [];

    score = 0;
    lives = 3;
    collectedIngredients = {
        'Pão': 0,
        'Queijo': 0,
        'Hambúrguer': 0
    };

    scoreElement.textContent = `Ingredientes: 0/5`;
    livesElement.textContent = `Vidas: 3`;

    playThrowAnimation(() => {
        character.style.backgroundImage = 'url(./assets/img/meggy.png)';
        startMeggyBlink();
        launchMultipleIngredients();
        collisionInterval = setInterval(checkCollisions, 16);
    });
}

function launchMultipleIngredients() {
    if (lives <= 0 || score >= 5) return;

    const totalIngredients = 10 + Math.floor(Math.random() * 6);

    for (let i = 0; i < totalIngredients; i++) {
        setTimeout(() => {
            createRandomIngredient();
        }, i * 200);
    }

    setTimeout(launchMultipleIngredients, 3000);
}

function playThrowAnimation(callback) {
    character.style.backgroundImage = 'url(./assets/img/meggy1.png)';
    setTimeout(() => {
        character.style.backgroundImage = 'url(./assets/img/meggy3.png)';
        setTimeout(() => {
            if (callback) callback();
        }, 500);
    }, 500);
}

function startMeggyBlink() {
    meggyBlinkInterval = setInterval(() => {
        character.style.backgroundImage = 'url(./assets/img/meggy4.png)';
        setTimeout(() => {
            character.style.backgroundImage = 'url(./assets/img/meggy.png)';
        }, 100);
    }, 3000 + Math.random() * 2000);
}

function createRandomIngredient() {
    if (activeIngredients.length >= maxIngredients) return;

    const isCorrect = Math.random() < 0.7;
    let type;

    if (isCorrect) {
        const neededTypes = Object.keys(neededIngredients).filter(
            t => collectedIngredients[t] < neededIngredients[t]
        );
        if (neededTypes.length === 0) {
            type = wrongIngredients[Math.floor(Math.random() * wrongIngredients.length)];
        } else {
            type = neededTypes[Math.floor(Math.random() * neededTypes.length)];
        }
    } else {
        type = wrongIngredients[Math.floor(Math.random() * wrongIngredients.length)];
    }

    createIngredient(type, isCorrect);
}

function createIngredient(type, isCorrect) {
    const ingredient = document.createElement('div');
    ingredient.className = 'ingredient falling';
    ingredient.style.backgroundImage = `url('${INGREDIENT_IMAGES[type]}')`;
    ingredient.setAttribute('data-type', type);
    ingredient.setAttribute('data-correct', isCorrect);

    const startX = Math.random() * (window.innerWidth - 40);
    ingredient.style.left = `${startX}px`;
    ingredient.style.top = '-40px';
    ingredient.style.display = 'block';

    const duration = 3000 + Math.random() * 3000;
    ingredient.style.animationDuration = `${duration}ms`;

    minigame.appendChild(ingredient);
    activeIngredients.push(ingredient);

    setTimeout(() => {
        const index = activeIngredients.indexOf(ingredient);
        if (index !== -1) activeIngredients.splice(index, 1);
        if (ingredient.parentNode) ingredient.remove();
    }, duration);
}

function checkCollisions(event) {
    const clickX = event.clientX;
    const clickY = event.clientY;

    for (let i = activeIngredients.length - 1; i >= 0; i--) {
        const ing = activeIngredients[i];
        const ingRect = ing.getBoundingClientRect();

        if (clickX >= ingRect.left && clickX <= ingRect.right &&
            clickY >= ingRect.top && clickY <= ingRect.bottom) {

            const type = ing.getAttribute('data-type');
            const isCorrect = ing.getAttribute('data-correct') === 'true';

            ing.remove();
            activeIngredients.splice(i, 1);

            if (isCorrect) {
                collectedIngredients[type]++;
                score++;

                const totalNeeded = Object.values(neededIngredients).reduce((a, b) => a + b, 0);
                scoreElement.textContent = `Ingredientes: ${score}/${totalNeeded}`;

                showMeggyReaction('meggy8.png');

                if (score >= totalNeeded) {
                    endGame(true);
                }
            } else {
                lives--;
                livesElement.textContent = `Vidas: ${lives}`;

                showMeggyReaction(Math.random() < 0.5 ? 'meggy6.png' : 'meggy7.png');

                if (lives <= 0) {
                    endGame(false);
                }
            }
            break;
        }
    }
}

function showMeggyReaction(image) {
    clearTimeout(meggyReactionTimeout);
    character.style.backgroundImage = `url(./assets/img/${image})`;
    meggyReactionTimeout = setTimeout(() => {
        character.style.backgroundImage = 'url(./assets/img/meggy.png)';
    }, 1000);
}

function endGame(isWin) {
    clearInterval(collisionInterval);
    clearInterval(meggyBlinkInterval);

    const highestTimeoutId = setTimeout(() => { }, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
    }

    if (isWin) {
        minigame.style.display = 'none';
        menu.style.display = 'flex';

        score = 0;
        lives = 3;
        collectedIngredients = {
            'Pão': 0,
            'Queijo': 0,
            'Hambúrguer': 0
        };
    } else {
        minigame.style.display = 'none';
        endingScreen.style.display = 'flex';
    }
}

minigame.addEventListener('click', checkCollisions);