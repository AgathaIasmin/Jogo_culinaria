document.addEventListener('DOMContentLoaded', function() {
    let menu = document.getElementById('menu');
    let animationScreen = document.getElementById('animation-screen');
    let recipeSelection = document.getElementById('recipe-selection');
    let minigame = document.getElementById('minigame');
    let startBtn = document.getElementById('start-btn');
    let creditsBtn = document.getElementById('credits-btn');
    let recipeOptions = document.querySelectorAll('.recipe-option');
    let character = document.getElementById('character');
    let tutorial = document.getElementById('tutorial');
    let tutorialText = document.getElementById('tutorial-text');
    let tutorialCharacter = document.getElementById('tutorial-character');
    let tutorialNext = document.getElementById('tutorial-next');
    let endingScreen = document.getElementById('ending-screen');
    let restartBtn = document.getElementById('restart-btn');
    let creditsScreen = document.getElementById('credits-screen');
    let backBtn = document.getElementById('back-btn');
    let score = 0;
    let lives = 3;
    const maxLives1 = 3;
    const livesPanel1 = document.getElementById('lives-panel-1');
    let neededIngredients = {
        'Pão': 2,
        'Queijo': 1,
        'carne': 2,
        'Tomate': 1
    };
    let collectedIngredients = {
        'Pão': 0,
        'Queijo': 0,
        'carne': 0,
        'Tomate': 0
    };
    let wrongIngredients = ['Cebola', 'Alface', 'Bacon', 'Pepino'];
    let activeIngredients = [];
    const maxIngredients = 20;
    let currentTutorialStep = 0;
    let collisionInterval;
    let MadeleineBlinkInterval;
    let MadeleineReactionTimeout;
    
    const INGREDIENT_IMAGES = {
        'Pão': './assets/img/pao.png',
        'Queijo': './assets/img/queijo.png',
        'carne': './assets/img/carne.png',
        'Tomate': './assets/img/tomate.png',
        'Cebola': './assets/img/cebola.png',
        'Alface': './assets/img/alface.png',
        'Bacon': './assets/img/bacon.png',
        'Pepino': './assets/img/pepino.png'
    };
    
    const tutorialSteps = [{
        text: "Oi chef! Vamos preparar um Hamburguer delicioso?",
        sprite: "./assets/img/Madeleine1.png"
    },
    {
        text: "Eu vou jogar os ingredientes continuamente!",
        sprite: "./assets/img/Madeleine2.png"
    },
    {
        text: "Precisamos de: 2 pães, 2 queijos, 1 Tomate e  1 carne!",
        sprite: "./assets/img/Madeleine1.png"
    },
    {
        text: "Cuidado com os ingredientes errados! 3 erros e você perde!",
        sprite: "./assets/img/Madeleine2.png"
    },
    {
        text: "Use o mouse para clicar nos ingredientes certos!",
        sprite: "./assets/img/Madeleine1.png"
    }
    ];
    
    // Adiciona o áudio de fundo e inicia ao carregar a página
    const backgroundMusic = new Audio('./assets/audio/Joyful.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;
    backgroundMusic.muted = true;
    
    document.addEventListener('click', function() {
        backgroundMusic.muted = false;
        backgroundMusic.play().catch(error => {
            console.error('Erro ao reproduzir áudio:', error);
        });
    }, { once: true });
    
    startBtn.addEventListener('click', () => {
        menu.style.display = 'none';
        animationScreen.style.display = 'flex';
        animateMadeleineThrow();
    
        setTimeout(() => {
            animationScreen.style.display = 'none';
            recipeSelection.style.display = 'flex';
            character.style.backgroundImage = 'url(./assets/img/Madeleine.png)';
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
        backgroundMusic.pause();
    });
    
    backBtn.addEventListener('click', () => {
        creditsScreen.style.display = 'none';
        menu.style.display = 'flex';
        backgroundMusic.play();
    });
    
    restartBtn.addEventListener('click', () => {
        endingScreen.style.display = 'none';
        menu.style.display = 'flex';
    
        score = 0;
        lives = 3;
        collectedIngredients = {
            'Pão': 0,
            'Queijo': 0,
            'carne': 0,
            'Tomate': 0
        };
        backgroundMusic.play();
    });
    
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
    
                    if (collectedIngredients[type] > neededIngredients[type]) {
                        lives--;
                        if (lives < 0) lives = 0;
                        showMadeleineReaction('Madeleine6.png');
                        updateLives1();
                        if (lives <= 0) {
                            endGame(false);
                            return;
                        }
                    } else {
                        score++;
                        showMadeleineReaction('Madeleine5.png');
    
                        if (score >= Object.values(neededIngredients).reduce((a, b) => a + b, 0)) {
                            endGame(true);
                        }
                    }
                } else {
                    lives--;
                    if (lives < 0) lives = 0;
                    showMadeleineReaction(Math.random() < 0.5 ? 'Madeleine6.png' : 'Madeleine7.png');
                    updateLives1();
    
                    if (lives <= 0) {
                        endGame(false);
                    }
                }
                break;
            }
        }
        updateTicket();
    }
    
    // Adiciona o event listener para o minigame1
    minigame.addEventListener('click', checkCollisions);
    
    function animateMadeleineThrow() {
        character.style.backgroundImage = 'url(./assets/img/Madeleine1.png)';
        setTimeout(() => {
            character.style.backgroundImage = 'url(./assets/img/Madeleine3.png)';
        }, 500);
    }
    
    function updateTutorial() {
        const step = tutorialSteps[currentTutorialStep];
        tutorialText.textContent = step.text;
        tutorialCharacter.src = step.sprite;
    }
    
    function startMinigame() {
        recipeSelection.style.display = 'none';
        minigame.style.display = 'block';
    
        score = 0;
        lives = 3;
        collectedIngredients = {
            'Pão': 0,
            'Queijo': 0,
            'carne': 0,
            'Tomate': 0
        };
    
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
            'carne': 0,
            'Tomate': 0
        };
    
        playThrowAnimation(() => {
            character.style.backgroundImage = 'url(./assets/img/Madeleine.png)';
            startMadeleineBlink();
            launchMultipleIngredients();
            collisionInterval = setInterval(checkCollisions, 16);
        });
    }
    
    function launchMultipleIngredients() {
        if (lives <= 0 || score >= Object.values(neededIngredients).reduce((a, b) => a + b, 0)) return;
    
        const totalIngredients = 10 + Math.floor(Math.random() * 6);
    
        for (let i = 0; i < totalIngredients; i++) {
            setTimeout(() => {
                createRandomIngredient();
            }, i * 200);
        }
    
        setTimeout(launchMultipleIngredients, 3000);
    }
    
    function playThrowAnimation(callback) {
        character.style.backgroundImage = 'url(./assets/img/Madeleine1.png)';
        setTimeout(() => {
            character.style.backgroundImage = 'url(./assets/img/Madeleine3.png)';
            setTimeout(() => {
                if (callback) callback();
            }, 500);
        }, 500);
    }
    
    function startMadeleineBlink() {
        MadeleineBlinkInterval = setInterval(() => {
            character.style.backgroundImage = 'url(./assets/img/Madeleine4.png)';
            setTimeout(() => {
                character.style.backgroundImage = 'url(./assets/img/Madeleine.png)';
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
        ingredient.style.pointerEvents = 'auto';
        ingredient.style.zIndex = '5';

        const startX = Math.random() * (window.innerWidth - 40);
        ingredient.style.left = `${startX}px`;
        ingredient.style.top = '-40px';
        ingredient.style.display = 'block';

        const duration = 3000 + Math.random() * 3000;
        ingredient.style.animationDuration = `${duration}ms`;

        // Adiciona o evento de clique diretamente ao ingrediente
        ingredient.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = ingredient.getAttribute('data-type');
            const isCorrect = ingredient.getAttribute('data-correct') === 'true';

            ingredient.remove();
            const index = activeIngredients.indexOf(ingredient);
            if (index !== -1) activeIngredients.splice(index, 1);

            if (isCorrect) {
                collectedIngredients[type]++;
                if (collectedIngredients[type] > neededIngredients[type]) {
                    lives--;
                    if (lives < 0) lives = 0;
                    showMadeleineReaction('Madeleine6.png');
                    updateLives1();
                    if (lives <= 0) {
                        endGame(false);
                        return;
                    }
                } else {
                    score++;
                    showMadeleineReaction('Madeleine5.png');

                    if (score >= Object.values(neededIngredients).reduce((a, b) => a + b, 0)) {
                        endGame(true);
                    }
                }
            } else {
                lives--;
                if (lives < 0) lives = 0;
                showMadeleineReaction(Math.random() < 0.5 ? 'Madeleine6.png' : 'Madeleine7.png');
                updateLives1();

                if (lives <= 0) {
                    endGame(false);
                }
            }
        });

        minigame.appendChild(ingredient);
        activeIngredients.push(ingredient);

        setTimeout(() => {
            const index = activeIngredients.indexOf(ingredient);
            if (index !== -1) activeIngredients.splice(index, 1);
            if (ingredient.parentNode) ingredient.remove();
        }, duration);
        updateTicket();
    }
    
    function showMadeleineReaction(image) {
        clearTimeout(MadeleineReactionTimeout);
        character.style.backgroundImage = `url(./assets/img/${image})`;
        MadeleineReactionTimeout = setTimeout(() => {
            character.style.backgroundImage = 'url(./assets/img/Madeleine.png)';
        }, 1000);
    }
    
    function endGame(isWin) {
        clearInterval(collisionInterval);
        clearInterval(MadeleineBlinkInterval);
    
        const highestTimeoutId = setTimeout(() => { }, 0);
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
        }
    
        if (isWin) {
            // Redireciona para o MiniGame2 após 1 segundo
            setTimeout(() => {
                window.location.href = 'MiniGame2.html'; // Caminho ajustado para pastas diferentes
            }, 1000);
        } else {
            minigame.style.display = 'none';
            endingScreen.style.display = 'flex';
        }
    }

    function updateTicket() {
        document.getElementById('score-pao').textContent = collectedIngredients['Pão'];
        document.getElementById('score-queijo').textContent = collectedIngredients['Queijo'];
        document.getElementById('score-carne').textContent = collectedIngredients['carne'];
        document.getElementById('score-tomate').textContent = collectedIngredients['Tomate'];
        document.getElementById('score-total-value').textContent = score;
    }

    function updateLives1() {
        livesPanel1.textContent = '❤️'.repeat(lives) + '🤍'.repeat(maxLives1 - lives);
    }

    lives = maxLives1;
    updateLives1();

    function showLifeLost() {
        const anim = document.getElementById('life-lost-anim');
        anim.style.display = 'block';
        anim.style.opacity = '1';
        anim.style.transition = 'none';
        anim.style.transform = 'translateY(0)';
        setTimeout(() => {
            anim.style.transition = 'opacity 0.7s, transform 0.7s';
            anim.style.opacity = '0';
            anim.style.transform = 'translateY(-40px)';
        }, 100);
        setTimeout(() => {
            anim.style.display = 'none';
        }, 800);
    }
});