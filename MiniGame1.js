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
        const victoryScreen = document.getElementById('victory-screen');
        const nextGameBtn = document.getElementById('next-game-btn');
        const minigame2Screen = document.getElementById('minigame2-screen');
        const chapa = document.getElementById('chapa');
        const pattyStack = document.getElementById('patty-stack-visual');
        const trashBin = document.getElementById('trash-bin');
        
        let score = 0;
        let lives = 3;
        let neededIngredients = {
            'Pão': 2,
            'Queijo': 2,
            'carne': 1,
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
        
        // Variáveis do MiniGame2
        let activePatties = [];
        let cookingPatties = [];
        let cookedPatties = [];
        let burntPatties = [];
        let isDragging = false;
        let currentPatty = null;
        let cookingTimers = new Map();
        
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
            text: "Oi chef! Vamos preparar um carne delicioso?",
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
        
        nextGameBtn.addEventListener('click', () => {
            victoryScreen.style.display = 'none';
            minigame2Screen.style.display = 'flex';
            initializeMiniGame2();
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
                            livesElement.textContent = `Vidas: ${lives}`;
                            showMadeleineReaction('Madeleine6.png');
                            if (lives <= 0) {
                                endGame(false);
                                return;
                            }
                        } else {
                            score++;
                            const totalNeeded = Object.values(neededIngredients).reduce((a, b) => a + b, 0);
                            scoreElement.textContent = `Ingredientes: ${score}/${totalNeeded}`;
                            showMadeleineReaction('Madeleine5.png');
        
                            if (score >= totalNeeded) {
                                endGame(true);
                            }
                        }
                    } else {
                        lives--;
                        livesElement.textContent = `Vidas: ${lives}`;
                        showMadeleineReaction(Math.random() < 0.5 ? 'Madeleine6.png' : 'Madeleine7.png');
        
                        if (lives <= 0) {
                            endGame(false);
                        }
                    }
                    break;
                }
            }
        }
        
        // Adiciona o event listener para o minigame1
        minigame.addEventListener('click', checkCollisions);
        
        // Eventos do MiniGame2
        pattyStack.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            isDragging = true;
            currentPatty = e.target;
            e.dataTransfer.setData('text/plain', 'patty');
            e.target.classList.add('dragging');
            e.target.style.opacity = '0.5';
        });
        
        pattyStack.addEventListener('dragend', (e) => {
            e.stopPropagation();
            isDragging = false;
            if (currentPatty) {
                currentPatty.classList.remove('dragging');
                currentPatty.style.opacity = '1';
            }
            currentPatty = null;
        });
        
        chapa.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isDragging) {
                chapa.classList.add('drag-over-patty');
            }
        });
        
        chapa.addEventListener('dragleave', (e) => {
            e.stopPropagation();
            chapa.classList.remove('drag-over-patty');
        });
        
        chapa.addEventListener('drop', (e) => {
            e.preventDefault();
            chapa.classList.remove('drag-over-patty');
            
            if (isDragging) {
                const patty = createPattyOnGrill();
                const rect = chapa.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                patty.style.position = 'absolute';
                patty.style.left = `${x - 40}px`;
                patty.style.top = `${y - 32.5}px`;
                
                chapa.appendChild(patty);
                activePatties.push(patty);
                startCooking(patty);
                
                // Resetar estado de arrasto
                isDragging = false;
                currentPatty = null;
            }
        });
        
        function createPattyOnGrill() {
            const pattyWrapper = document.createElement('div');
            pattyWrapper.className = 'patty-wrapper';
            pattyWrapper.draggable = false;
            
            const patty = document.createElement('div');
            patty.className = 'patty-on-grill';
            patty.setAttribute('data-cooking-state', 'raw');
            patty.setAttribute('data-cooking-progress', '0');
            patty.setAttribute('data-flipped', 'false');
            
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
            
            const steam = document.createElement('div');
            steam.className = 'steam';
            
            pattyWrapper.appendChild(steam);
            pattyWrapper.appendChild(flipWarning);
            pattyWrapper.appendChild(readyNotification);
            pattyWrapper.appendChild(patty);
            pattyWrapper.appendChild(progressBar);
            
            pattyWrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                const state = patty.getAttribute('data-cooking-state');
                const progress = parseInt(patty.getAttribute('data-cooking-progress'));
                const isFlipped = patty.getAttribute('data-flipped') === 'true';
                
                if (state === 'side1' && progress >= 50 && !isFlipped) {
                    patty.setAttribute('data-cooking-state', 'side2');
                    patty.setAttribute('data-cooking-progress', '0');
                    patty.setAttribute('data-flipped', 'true');
                    patty.style.transform = 'scaleX(-1)';
                    flipWarning.style.display = 'none';
                    readyNotification.style.display = 'none';
                    
                    const sizzle = new Audio('./assets/audio/sizzle.mp3');
                    sizzle.volume = 0.3;
                    sizzle.play();
                }
            });

            pattyWrapper.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const state = patty.getAttribute('data-cooking-state');
                if (state === 'cooked') {
                    isDragging = true;
                    currentPatty = pattyWrapper;
                    pattyWrapper.style.opacity = '0.7';
                    pattyWrapper.style.cursor = 'grabbing';
                }
            });

            pattyWrapper.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                if (isDragging && currentPatty) {
                    isDragging = false;
                    currentPatty.style.opacity = '1';
                    currentPatty.style.cursor = 'grab';
                    currentPatty = null;
                }
            });

            pattyWrapper.addEventListener('mouseleave', (e) => {
                e.stopPropagation();
                if (isDragging && currentPatty) {
                    isDragging = false;
                    currentPatty.style.opacity = '1';
                    currentPatty.style.cursor = 'grab';
                    currentPatty = null;
                }
            });
            
            return pattyWrapper;
        }
        
        function animateMadeleineThrow() {
            character.style.backgroundImage = 'url(./assets/img/Madeleine1.png)';
            setTimeout(() => {
                character.style.backgroundImage = 'url(./assets/img/Madeleine3.png)';
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
                'carne': 0,
                'Tomate': 0
            };
        
            scoreElement.textContent = `Ingredientes: 0/6`;
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
                'carne': 0,
                'Tomate': 0
            };
        
            scoreElement.textContent = `Ingredientes: 0/6`;
            livesElement.textContent = `Vidas: 3`;
        
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
                        livesElement.textContent = `Vidas: ${lives}`;
                        showMadeleineReaction('Madeleine6.png');
                        if (lives <= 0) {
                            endGame(false);
                            return;
                        }
                    } else {
                        score++;
                        const totalNeeded = Object.values(neededIngredients).reduce((a, b) => a + b, 0);
                        scoreElement.textContent = `Ingredientes: ${score}/${totalNeeded}`;
                        showMadeleineReaction('Madeleine5.png');

                        if (score >= totalNeeded) {
                            endGame(true);
                        }
                    }
                } else {
                    lives--;
                    livesElement.textContent = `Vidas: ${lives}`;
                    showMadeleineReaction(Math.random() < 0.5 ? 'Madeleine6.png' : 'Madeleine7.png');

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
                minigame.style.display = 'none';
                showVictoryScreen();
            } else {
                minigame.style.display = 'none';
                endingScreen.style.display = 'flex';
            }
        }
        
        trashBin.addEventListener('click', () => {
            const pattiesToRemove = [...cookedPatties, ...burntPatties];
            pattiesToRemove.forEach(patty => {
                const timer = cookingTimers.get(patty);
                if (timer) {
                    clearInterval(timer);
                    cookingTimers.delete(patty);
                }
                patty.remove();
            });
            cookedPatties = [];
            burntPatties = [];
        });

        // Add interactive highlight effect to the grill
        const highlight = document.createElement('div');
        highlight.className = 'chapa-highlight';
        chapa.appendChild(highlight);

        chapa.addEventListener('mousemove', (e) => {
            const rect = chapa.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            highlight.style.setProperty('--x', x + '%');
            highlight.style.setProperty('--y', y + '%');
        });

        // Adiciona os eventos de drag and drop para a área de remoção
        const removalArea = document.getElementById('removal-area');
        
        removalArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            removalArea.classList.add('drag-over');
        });
        
        removalArea.addEventListener('dragleave', () => {
            removalArea.classList.remove('drag-over');
        });
        
        removalArea.addEventListener('drop', (e) => {
            e.preventDefault();
            removalArea.classList.remove('drag-over');
            
            const patty = document.querySelector('.patty-wrapper.dragging');
            if (patty && patty.querySelector('.patty-on-grill').getAttribute('data-cooking-state') === 'cooked') {
                const successEffect = document.createElement('div');
                successEffect.className = 'success-effect';
                successEffect.textContent = '✓';
                removalArea.appendChild(successEffect);
                
                setTimeout(() => {
                    successEffect.remove();
                    patty.remove();
                    const index = cookedPatties.indexOf(patty);
                    if (index !== -1) {
                        cookedPatties.splice(index, 1);
                    }
                }, 500);
            }
        });

        // Inicialização do MiniGame2
        function initializeMiniGame2() {
            // Resetar estados
            activePatties = [];
            cookingPatties = [];
            cookedPatties = [];
            burntPatties = [];
            isDragging = false;
            currentPatty = null;
            cookingTimers.clear();

            // Limpar a chapa
            while (chapa.firstChild) {
                chapa.removeChild(chapa.firstChild);
            }

            // Configurar eventos da pilha de hambúrgueres
            pattyStack.addEventListener('mousedown', startDragging);
            pattyStack.addEventListener('mouseup', stopDragging);
            pattyStack.addEventListener('mouseleave', stopDragging);

            // Configurar eventos da chapa
            chapa.addEventListener('dragover', handleDragOver);
            chapa.addEventListener('dragleave', handleDragLeave);
            chapa.addEventListener('drop', handleDrop);

            // Configurar eventos da área de remoção
            removalArea.addEventListener('dragover', handleRemovalDragOver);
            removalArea.addEventListener('dragleave', handleRemovalDragLeave);
            removalArea.addEventListener('drop', handleRemovalDrop);
        }

        function startDragging(e) {
            if (e.target === pattyStack || e.target === pattyStack.querySelector('img')) {
                isDragging = true;
                currentPatty = pattyStack;
                pattyStack.style.opacity = '0.5';
                pattyStack.style.cursor = 'grabbing';
            }
        }

        function stopDragging() {
            if (isDragging) {
                isDragging = false;
                currentPatty = null;
                pattyStack.style.opacity = '1';
                pattyStack.style.cursor = 'grab';
            }
        }

        function handleDragOver(e) {
            e.preventDefault();
            if (isDragging) {
                chapa.classList.add('drag-over-patty');
            }
        }

        function handleDragLeave() {
            chapa.classList.remove('drag-over-patty');
        }

        function handleDrop(e) {
            e.preventDefault();
            chapa.classList.remove('drag-over-patty');
            
            if (isDragging) {
                const patty = createPattyOnGrill();
                const rect = chapa.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                patty.style.position = 'absolute';
                patty.style.left = `${x - 40}px`;
                patty.style.top = `${y - 32.5}px`;
                
                chapa.appendChild(patty);
                activePatties.push(patty);
                startCooking(patty);
                
                // Resetar estado de arrasto
                stopDragging();
            }
        }

        function createPattyOnGrill() {
            const pattyWrapper = document.createElement('div');
            pattyWrapper.className = 'patty-wrapper';
            
            const patty = document.createElement('div');
            patty.className = 'patty-on-grill';
            patty.setAttribute('data-cooking-state', 'raw');
            patty.setAttribute('data-cooking-progress', '0');
            patty.setAttribute('data-flipped', 'false');
            
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
            
            const steam = document.createElement('div');
            steam.className = 'steam';
            
            pattyWrapper.appendChild(steam);
            pattyWrapper.appendChild(flipWarning);
            pattyWrapper.appendChild(readyNotification);
            pattyWrapper.appendChild(patty);
            pattyWrapper.appendChild(progressBar);
            
            // Adicionar eventos de clique e arrasto
            pattyWrapper.addEventListener('click', handlePattyClick);
            pattyWrapper.addEventListener('mousedown', startPattyDrag);
            pattyWrapper.addEventListener('mouseup', stopPattyDrag);
            pattyWrapper.addEventListener('mouseleave', stopPattyDrag);
            
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
                
                const sizzle = new Audio('./assets/audio/sizzle.mp3');
                sizzle.volume = 0.3;
                sizzle.play();
            }
        }

        function startPattyDrag(e) {
            const patty = e.currentTarget.querySelector('.patty-on-grill');
            if (patty.getAttribute('data-cooking-state') === 'cooked') {
                isDragging = true;
                currentPatty = e.currentTarget;
                currentPatty.style.opacity = '0.7';
                currentPatty.style.cursor = 'grabbing';
            }
        }

        function stopPattyDrag() {
            if (isDragging && currentPatty) {
                isDragging = false;
                currentPatty.style.opacity = '1';
                currentPatty.style.cursor = 'grab';
                currentPatty = null;
            }
        }

        function startCooking(patty) {
            const pattyElement = patty.querySelector('.patty-on-grill');
            const progressBar = patty.querySelector('.cooking-progress-bar');
            const flipWarning = patty.querySelector('.flip-warning');
            
            cookingPatties.push(patty);
            
            const startTime = Date.now();
            const totalCookTime = 6000; // 6 segundos no total
            const flipTime = 3000; // 3 segundos para virar
            
            const timer = setInterval(() => {
                const elapsedTime = Date.now() - startTime;
                const progress = (elapsedTime / totalCookTime) * 100;
                const isFlipped = pattyElement.getAttribute('data-flipped') === 'true';
                
                pattyElement.setAttribute('data-cooking-progress', progress.toString());
                progressBar.style.width = `${progress}%`;
                
                if (!isFlipped) {
                    if (elapsedTime <= flipTime) {
                        pattyElement.setAttribute('data-cooking-state', 'side1');
                        flipWarning.style.display = 'none';
                    } else if (elapsedTime <= flipTime + 1000) {
                        pattyElement.setAttribute('data-cooking-state', 'side1');
                        flipWarning.style.display = 'block';
                    } else {
                        pattyElement.setAttribute('data-cooking-state', 'burnt');
                        flipWarning.style.display = 'none';
                        clearInterval(timer);
                        finishCooking(patty);
                    }
                } else {
                    if (elapsedTime <= totalCookTime) {
                        pattyElement.setAttribute('data-cooking-state', 'side2');
                        flipWarning.style.display = 'none';
                    } else {
                        pattyElement.setAttribute('data-cooking-state', 'cooked');
                        flipWarning.style.display = 'none';
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
            } else if (state === 'cooked') {
                cookedPatties.push(patty);
                readyNotification.style.display = 'block';
                
                const successSound = new Audio('./assets/audio/success.mp3');
                successSound.volume = 0.3;
                successSound.play();
            }
            
            const timer = cookingTimers.get(patty);
            if (timer) {
                clearInterval(timer);
                cookingTimers.delete(patty);
            }
        }

        function handleRemovalDragOver(e) {
            e.preventDefault();
            if (isDragging && currentPatty) {
                removalArea.classList.add('drag-over');
            }
        }

        function handleRemovalDragLeave() {
            removalArea.classList.remove('drag-over');
        }

        function handleRemovalDrop(e) {
            e.preventDefault();
            removalArea.classList.remove('drag-over');
            
            if (isDragging && currentPatty) {
                const patty = currentPatty.querySelector('.patty-on-grill');
                if (patty.getAttribute('data-cooking-state') === 'cooked') {
                    const successEffect = document.createElement('div');
                    successEffect.className = 'success-effect';
                    successEffect.textContent = '✓';
                    removalArea.appendChild(successEffect);
                    
                    setTimeout(() => {
                        successEffect.remove();
                        currentPatty.remove();
                        const index = cookedPatties.indexOf(currentPatty);
                        if (index !== -1) {
                            cookedPatties.splice(index, 1);
                        }
                    }, 500);
                }
            }
        }

        function showVictoryScreen() {
            victoryScreen.style.display = 'flex';
            setTimeout(() => {
                document.getElementById('transition-message').style.display = 'block';
                setTimeout(() => {
                    victoryScreen.style.display = 'none';
                    minigame2Screen.style.display = 'flex';
                    showPhase2Tutorial();
                }, 3000);
            }, 1000);
        }

        function showPhase2Tutorial() {
            const tutorialSteps = [
                {
                    text: "Bem-vindo à fase 2! Agora você vai cozinhar hambúrgueres!",
                    sprite: "./assets/img/Madeleine1.png"
                },
                {
                    text: "Arraste a carne da pilha para a chapa para começar a cozinhar.",
                    sprite: "./assets/img/Madeleine2.png"
                },
                {
                    text: "Quando a barra de progresso chegar na metade, clique na carne para virá-la!",
                    sprite: "./assets/img/Madeleine1.png"
                },
                {
                    text: "Depois que a carne estiver pronta, arraste-a para a área de remoção.",
                    sprite: "./assets/img/Madeleine2.png"
                },
                {
                    text: "Cuidado para não queimar a carne! Boa sorte!",
                    sprite: "./assets/img/Madeleine1.png"
                }
            ];

            // Criar a estrutura do tutorial igual à fase 1
            const tutorial = document.createElement('div');
            tutorial.id = 'tutorial';
            tutorial.style.position = 'absolute';
            tutorial.style.width = '100%';
            tutorial.style.height = '100%';
            tutorial.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            tutorial.style.display = 'flex';
            tutorial.style.flexDirection = 'column';
            tutorial.style.justifyContent = 'center';
            tutorial.style.alignItems = 'center';
            tutorial.style.zIndex = '10';

            const tutorialBox = document.createElement('div');
            tutorialBox.id = 'tutorial-box';
            tutorialBox.style.width = '600px';
            tutorialBox.style.backgroundColor = 'white';
            tutorialBox.style.borderRadius = '20px';
            tutorialBox.style.padding = '30px';
            tutorialBox.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
            tutorialBox.style.position = 'relative';

            const tutorialCharacter = document.createElement('div');
            tutorialCharacter.id = 'tutorial-character';
            tutorialCharacter.style.width = '150px';
            tutorialCharacter.style.height = '200px';
            tutorialCharacter.style.backgroundSize = 'contain';
            tutorialCharacter.style.backgroundRepeat = 'no-repeat';
            tutorialCharacter.style.position = 'absolute';
            tutorialCharacter.style.left = '-120px';
            tutorialCharacter.style.bottom = '0';

            const tutorialText = document.createElement('div');
            tutorialText.id = 'tutorial-text';
            tutorialText.style.fontSize = '1.5em';
            tutorialText.style.marginBottom = '20px';
            tutorialText.style.minHeight = '120px';

            const tutorialNext = document.createElement('button');
            tutorialNext.id = 'tutorial-next';
            tutorialNext.textContent = 'Próximo';
            tutorialNext.style.backgroundColor = '#4CAF50';
            tutorialNext.style.color = 'white';
            tutorialNext.style.border = 'none';
            tutorialNext.style.padding = '10px 20px';
            tutorialNext.style.fontSize = '1.2em';
            tutorialNext.style.borderRadius = '10px';
            tutorialNext.style.cursor = 'pointer';
            tutorialNext.style.float = 'right';

            tutorialBox.appendChild(tutorialCharacter);
            tutorialBox.appendChild(tutorialText);
            tutorialBox.appendChild(tutorialNext);
            tutorial.appendChild(tutorialBox);
            minigame2Screen.appendChild(tutorial);

            let currentStep = 0;

            function updateTutorial() {
                const step = tutorialSteps[currentStep];
                tutorialText.textContent = step.text;
                tutorialCharacter.style.backgroundImage = `url('${step.sprite}')`;
            }

            tutorialNext.addEventListener('click', () => {
                currentStep++;
                if (currentStep < tutorialSteps.length) {
                    updateTutorial();
                } else {
                    tutorial.remove();
                    initializeMiniGame2();
                }
            });

            updateTutorial();
        }