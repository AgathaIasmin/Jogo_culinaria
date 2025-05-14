const player = document.getElementById('player');
    const gameDisplay = document.querySelector('.game-display');
    const crosshairElement = document.getElementById('crosshair');
    const spriteWidth = 72;
    const spriteHeight = 72;
    let crosshair = null;
    let mouseMoved = false;

    const config = {
        speed: 3,
        zombieSpawnRate: 1500,
        zombieSpeed: 0.5,
        bulletSpeed: 12,
        fireRate: 80,
        crosshairDetectionRadius: 30,
        zombieInitialHealth: 3,
        animationSpeed: 150,
        plateSpawnRate: 5000,
        counterHealth: 100,
        counterDamageRate: 0.1
    };

    const playerState = {
        x: 250,
        y: 150,
        direction: 'down',
        canShoot: true,
        lastShotTime: 0,
        isMoving: false,
        animationFrame: 0,
        lastFrameTime: 0,
        hasWeapon: true,
        hasPlate: false
    };

    const gameState = {
        plates: [],
        leftCounter: {
            x: 100,
            y: 400,
            width: 150,
            height: 100,
            plates: []
        },
        rightCounter: {
            x: gameDisplay.clientWidth - 250,
            y: 400,
            width: 150,
            height: 100,
            health: config.counterHealth,
            healthBar: null
        }
    };

    let zombies = [];
    let bullets = [];
    let lastSpawnTime = 0;
    let lastPlateSpawnTime = 0;
    let weapon = null;

    const keys = { up: false, down: false, left: false, right: false, pickup: false };

    const barrierState = {
        right: {
            health: 100,
            maxHealth: 100,
            broken: false,
            element: null
        },
        left: {
            element: null
        }
    };

    // Tutorial do MiniGame4
    const tutorial4Steps = [
        { text: "Pegue os pratos que aparecem na cozinha!", img: "./assets/img/Madeleine1.png" },
        { text: "Leve os pratos até a bancada da esquerda para pontuar.", img: "./assets/img/Madeleine2.png" },
        { text: "Monstros vão tentar quebrar a barreira da bancada da direita.", img: "./assets/img/Madeleine3.png" },
        { text: "Atire nos monstros para proteger a barreira!", img: "./assets/img/Madeleine1.png" },
        { text: "Se a barreira quebrar, os monstros podem te atacar. Não deixe eles te pegarem!", img: "./assets/img/Madeleine2.png" },
        { text: "Boa sorte, chef! Clique em Começar para jogar.", img: "./assets/img/Madeleine1.png" }
    ];
    let currentTutorial4Step = 0;

    const PLATE_GOAL = 15;
    let platesDelivered = 0;

    const PLATE_SIZE = 30; // Novo tamanho do prato
    let currentPlate = null; // Variável para armazenar o prato atual

    // Adicione um listener para a tecla E
    let ePressed = false;
    document.addEventListener('keydown', (e) => {
        if (e.key === 'e' || e.key === 'E') {
            if (!playerState.hasPlate) {
                // Tentar coletar o prato
                if (currentPlate && isPlayerCollidingWithPlate(currentPlate)) {
                    currentPlate.collected = true;
                    playerState.hasPlate = true;
                    currentPlate.element.style.display = 'none'; // Esconde o prato
                    showPlateOnPlayer(true); // Mostra o prato no jogador
                    console.log('Prato coletado!');
                }
            } else {
                // Soltar o prato
                const plateOnPlayer = document.getElementById('plate-on-player');
                if (plateOnPlayer) {
                    // Verifica se o jogador está na área de entrega
                    if (isPlayerInDeliveryArea()) {
                        platesDelivered++; // Incrementa os pratos entregues
                        playerState.hasPlate = false; // O jogador não está mais segurando um prato
                        plateOnPlayer.remove(); // Remove o prato visual do jogador
                        currentPlate = null; // Reseta o prato atual
                        console.log('Prato entregue! Total de pratos entregues:', platesDelivered);
                        spawnPlate(); // Gera um novo prato
                    } else {
                        // Soltar o prato no chão
                        const droppedPlate = document.createElement('div');
                        droppedPlate.className = 'plate';
                        droppedPlate.style.width = `${PLATE_SIZE}px`;
                        droppedPlate.style.height = `${PLATE_SIZE}px`;
                        droppedPlate.style.position = 'absolute';
                        droppedPlate.style.zIndex = 10;

                        // Define a posição do prato solto
                        droppedPlate.style.left = `${playerState.x + 16}px`; // Ajuste a posição conforme necessário
                        droppedPlate.style.top = `${playerState.y - 18}px`; // Ajuste a posição conforme necessário

                        gameDisplay.appendChild(droppedPlate);
                        gameState.plates.push({ element: droppedPlate, collected: false });
                        playerState.hasPlate = false; // O jogador não está mais segurando um prato
                        plateOnPlayer.remove(); // Remove o prato visual do jogador
                        console.log('Prato solto!');
                    }
                }
            }
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === 'e' || e.key === 'E') ePressed = false;
    });

    // ----- Funções do Jogo -----
    function createCrosshair() {
        if (!crosshair) {
            crosshair = {
                x: gameDisplay.clientWidth / 2,
                y: gameDisplay.clientHeight / 2
            };
            updateCrosshairElement();
        }
    }
    function updateCrosshair(x, y) {
        const crosshair = document.getElementById('crosshair');
        if (crosshair) {
            crosshair.style.left = `${x}px`;
            crosshair.style.top = `${y}px`;
        }
    }
    function updateCrosshairElement() {
        if (crosshairElement) {
            crosshairElement.style.left = `${crosshair.x}px`;
            crosshairElement.style.top = `${crosshair.y}px`;
        }
    }
    function handleMovement() {
        let moveX = 0;
        let moveY = 0;
        if (keys.up) moveY = -1;
        if (keys.down) moveY = 1;
        if (keys.left) moveX = -1;
        if (keys.right) moveX = 1;
        playerState.isMoving = (moveX !== 0 || moveY !== 0);
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.7071;
            moveY *= 0.7071;
        }
        let newX = playerState.x + moveX * config.speed;
        let newY = playerState.y + moveY * config.speed;
        // Colisão com barreiras
        const playerWidth = spriteWidth;
        const playerHeight = spriteHeight;
        // Esquerda
        if (barrierState.left.element && checkBarrierCollision(newX, playerState.y, playerWidth, playerHeight, barrierState.left.element, barrierState.left.broken)) {
            newX = playerState.x;
        }
        // Direita
        if (barrierState.right.element && checkBarrierCollision(newX, playerState.y, playerWidth, playerHeight, barrierState.right.element, barrierState.right.broken)) {
            newX = playerState.x;
        }
        if (barrierState.left.element && checkBarrierCollision(playerState.x, newY, playerWidth, playerHeight, barrierState.left.element, barrierState.left.broken)) {
            newY = playerState.y;
        }
        if (barrierState.right.element && checkBarrierCollision(playerState.x, newY, playerWidth, playerHeight, barrierState.right.element, barrierState.right.broken)) {
            newY = playerState.y;
        }
        playerState.x = Math.max(0, Math.min(gameDisplay.clientWidth - spriteWidth, newX));
        playerState.y = Math.max(0, Math.min(gameDisplay.clientHeight - spriteHeight, newY));
        if (playerState.isMoving) {
            if (moveX > 0) playerState.direction = 'right';
            else if (moveX < 0) playerState.direction = 'left';
            else if (moveY < 0) playerState.direction = 'up';
            else if (moveY > 0) playerState.direction = 'down';
        }
    }
    function updatePlayerAnimation() {
        const now = Date.now();
        if (playerState.isMoving && now - playerState.lastFrameTime > config.animationSpeed) {
            playerState.animationFrame = (playerState.animationFrame + 1) % 4;
            playerState.lastFrameTime = now;
        } else if (!playerState.isMoving) {
            playerState.animationFrame = 0;
        }
    }
    function updatePlayer() {
        player.style.transform = `translate(${playerState.x}px, ${playerState.y}px)`;
        const directionMap = { down: 0, left: 1, up: 2, right: 3 };
        const bgX = -directionMap[playerState.direction] * spriteWidth;
        const bgY = -playerState.animationFrame * spriteHeight;
        player.style.backgroundPosition = `${bgX}px ${bgY}px`;
    }
    function shoot(event) {
        const rect = gameDisplay.getBoundingClientRect();
        const playerCenterX = playerState.x + spriteWidth / 2;
        const playerCenterY = playerState.y + spriteHeight / 2;
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const angle = Math.atan2(mouseY - playerCenterY, mouseX - playerCenterX);
        const bullet = document.createElement('div');
        bullet.className = 'bullet';
        bullet.style.left = `${playerCenterX}px`;
        bullet.style.top = `${playerCenterY}px`;
        const speed = 10;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        bullets.push({
            element: bullet,
            x: playerCenterX,
            y: playerCenterY,
            dx: dx,
            dy: dy
        });
        gameDisplay.appendChild(bullet);
    }
    function updateZombieAnimation(zombie) {
        const now = Date.now();
        if (zombie.isMoving && now - zombie.lastFrameTime > config.animationSpeed) {
            zombie.animationFrame = (zombie.animationFrame + 1) % 4;
            zombie.lastFrameTime = now;
        } else if (!zombie.isMoving) {
            zombie.animationFrame = 0;
        }
        const bgX = 0;
        const bgY = -zombie.animationFrame * 72; // 72 é a altura de cada quadro
        zombie.element.style.backgroundPosition = `${bgX}px ${bgY}px`;
    }
    function updateZombies() {
        zombies.forEach((zombie, index) => {
            let newX = zombie.x - config.zombieSpeed;
            let collided = false;
            // Colisão com barreira esquerda
            if (barrierState.left.element && checkBarrierCollision(newX, zombie.y, spriteWidth, spriteHeight, barrierState.left.element, barrierState.left.broken)) {
                newX = zombie.x;
                collided = true;
            }
            // Colisão com barreira direita
            if (barrierState.right.element && checkBarrierCollision(newX, zombie.y, spriteWidth, spriteHeight, barrierState.right.element, barrierState.right.broken)) {
                newX = zombie.x;
                collided = true;
            }
            zombie.x = newX;
            zombie.element.style.left = `${zombie.x}px`;
            zombie.element.style.top = `${zombie.y}px`;
            updateZombieAnimation(zombie);
            if (zombie.x < -spriteWidth) {
                gameDisplay.removeChild(zombie.element);
                zombies.splice(index, 1);
            }
        });
        // Checagem de dano ocorre normalmente em damageRightBarrier
    }
    function spawnZombie() {
        const now = Date.now();
        if (now - lastSpawnTime < config.zombieSpawnRate) return;
        lastSpawnTime = now;
        const zombie = document.createElement('div');
        zombie.className = 'zombie';
        const healthBarContainer = document.createElement('div');
        healthBarContainer.className = 'health-bar-container';
        const healthBar = document.createElement('div');
        healthBar.className = 'health-bar';
        healthBar.style.width = '100%';
        healthBarContainer.appendChild(healthBar);
        zombie.appendChild(healthBarContainer);
        gameDisplay.appendChild(zombie);
        const x = gameDisplay.clientWidth + spriteWidth;
        const y = Math.random() * (gameDisplay.clientHeight - spriteHeight);
        zombie.style.left = `${x}px`;
        zombie.style.top = `${y}px`;
        zombies.push({
            element: zombie,
            x: x,
            y: y,
            direction: 'left',
            health: config.zombieInitialHealth,
            healthBar: healthBar,
            animationFrame: 0,
            lastFrameTime: 0,
            isMoving: true
        });
    }
    function updateBullets() {
        bullets.forEach((bullet, bulletIndex) => {
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;
            bullet.element.style.left = `${bullet.x}px`;
            bullet.element.style.top = `${bullet.y}px`;
            zombies.forEach((zombie, zombieIndex) => {
                const bulletRect = bullet.element.getBoundingClientRect();
                const zombieRect = zombie.element.getBoundingClientRect();
                if (
                    bulletRect.right > zombieRect.left &&
                    bulletRect.left < zombieRect.right &&
                    bulletRect.bottom > zombieRect.top &&
                    bulletRect.top < zombieRect.bottom
                ) {
                    zombie.health -= 1;
                    zombie.healthBar.style.width = `${(zombie.health / config.zombieInitialHealth) * 100}%`;
                    if (zombie.health <= 0) {
                        if (zombie.element.parentNode) {
                            gameDisplay.removeChild(zombie.element);
                        }
                        zombies.splice(zombieIndex, 1);
                    }
                    if (bullet.element.parentNode) {
                        gameDisplay.removeChild(bullet.element);
                    }
                    bullets.splice(bulletIndex, 1);
                    return;
                }
            });
            if (
                bullet.x < 0 || bullet.x > gameDisplay.clientWidth ||
                bullet.y < 0 || bullet.y > gameDisplay.clientHeight
            ) {
                if (bullet.element.parentNode) {
                    gameDisplay.removeChild(bullet.element);
                }
                bullets.splice(bulletIndex, 1);
            }
        });
    }
    function addWeaponToPlayer() {
        const weapon = document.createElement('div');
        weapon.id = 'weapon';
        weapon.style.backgroundImage = "url('./assets/img/arma.png')";
        player.appendChild(weapon);
    }
    addWeaponToPlayer();
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'w': case 'ArrowUp': keys.up = true; break;
            case 's': case 'ArrowDown': keys.down = true; break;
            case 'a': case 'ArrowLeft': keys.left = true; break;
            case 'd': case 'ArrowRight': keys.right = true; break;
        }
    });
    document.addEventListener('keyup', (e) => {
        switch (e.key) {
            case 'w': case 'ArrowUp': keys.up = false; break;
            case 's': case 'ArrowDown': keys.down = false; break;
            case 'a': case 'ArrowLeft': keys.left = false; break;
            case 'd': case 'ArrowRight': keys.right = false; break;
        }
    });
    gameDisplay.addEventListener('mousemove', (e) => {
        const rect = gameDisplay.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        if (crosshairElement) {
            crosshairElement.style.left = `${mouseX}px`;
            crosshairElement.style.top = `${mouseY}px`;
        }
        const playerCenterX = playerState.x + spriteWidth / 2;
        const playerCenterY = playerState.y + spriteHeight / 2;
        const angle = Math.atan2(mouseY - playerCenterY, mouseX - playerCenterX) * (180 / Math.PI);
        const weapon = document.getElementById('weapon');
        if (weapon) {
            weapon.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        }
    });
    gameDisplay.addEventListener('click', (e) => {
        shoot(e);
    });
    function checkCounterInteraction() {
        // Verifica se o jogador tem um prato
        // Removido: lógica relacionada ao prato
    }
    function updateCounterPlates() {
        const counterElement = document.querySelector('.left-counter');
        if (!counterElement) return;

        counterElement.innerHTML = '';
        gameState.leftCounter.plates.forEach(plate => {
            const plateElement = document.createElement('div');
            plateElement.className = 'counter-plate';
            plateElement.style.left = `${plate.x}px`;
            plateElement.style.top = `${plate.y}px`;
            counterElement.appendChild(plateElement);
        });
    }
    function updateRightCounterHealth() {
        const counterElement = document.querySelector('.right-counter');
        if (!counterElement) return;

        if (!gameState.rightCounter.healthBar) {
            const healthBar = document.createElement('div');
            healthBar.className = 'counter-health-bar';
            counterElement.appendChild(healthBar);
            gameState.rightCounter.healthBar = healthBar;
        }

        const healthPercentage = (gameState.rightCounter.health / config.counterHealth) * 100;
        gameState.rightCounter.healthBar.style.width = `${healthPercentage}%`;
    }
    function damageRightCounter() {
        if (zombies.length > 0) {
            gameState.rightCounter.health -= config.counterDamageRate;
            updateRightCounterHealth();

            if (gameState.rightCounter.health <= 0) {
                endGame(false);
            }
        }
    }
    function setupBarriers() {
        barrierState.right.element = document.querySelector('.right-barrier');
        barrierState.left.element = document.querySelector('.left-barrier');
    }
    function updateRightBarrierVisual() {
        if (!barrierState.right.element) return;
        if (barrierState.right.broken) {
            barrierState.right.element.classList.add('broken');
        } else {
            barrierState.right.element.classList.remove('broken');
        }
    }
    function updateBarrierHealthBar() {
        const bar = document.querySelector('.barrier-health-bar');
        if (!bar) return;
        const percent = Math.max(0, barrierState.right.health / barrierState.right.maxHealth);
        bar.style.width = (percent * 100) + '%';
        if (percent > 0.6) {
            bar.style.background = 'linear-gradient(to right, #4CAF50, #8BC34A)';
        } else if (percent > 0.3) {
            bar.style.background = 'linear-gradient(to right, #FFC107, #FFEB3B)';
        } else {
            bar.style.background = 'linear-gradient(to right, #F44336, #FF5722)';
        }
    }
    function damageRightBarrier() {
        if (barrierState.right.broken) return;
        if (!barrierState.right.element) return;
        const barrierRect = barrierState.right.element.getBoundingClientRect();
        // Aumenta a área de colisão em 30px para cada lado
        const expand = 30;
        const bigBarrierRect = {
            left: barrierRect.left - expand,
            right: barrierRect.right + expand,
            top: barrierRect.top - expand,
            bottom: barrierRect.bottom + expand
        };
        let collidingZombies = 0;
        zombies.forEach(zombie => {
            const zombieRect = zombie.element.getBoundingClientRect();
            if (
                zombieRect.right > bigBarrierRect.left &&
                zombieRect.left < bigBarrierRect.right &&
                zombieRect.bottom > bigBarrierRect.top &&
                zombieRect.top < bigBarrierRect.bottom
            ) {
                collidingZombies++;
            }
        });
        if (collidingZombies > 0) {
            barrierState.right.health -= config.counterDamageRate * collidingZombies;
            updateBarrierHealthBar();
            if (barrierState.right.health <= 0) {
                barrierState.right.broken = true;
                updateRightBarrierVisual();
            }
        }
    }
    function checkZombiePlayerCollision() {
        if (!barrierState.right.broken) return;
        const playerRect = {
            left: playerState.x,
            right: playerState.x + spriteWidth,
            top: playerState.y,
            bottom: playerState.y + spriteHeight
        };
        zombies.forEach(zombie => {
            const zombieRect = zombie.element.getBoundingClientRect();
            const gameRect = gameDisplay.getBoundingClientRect();
            // Ajusta para coordenadas relativas ao gameDisplay
            const zx = zombie.x;
            const zy = zombie.y;
            if (
                playerRect.right > zx &&
                playerRect.left < zx + spriteWidth &&
                playerRect.bottom > zy &&
                playerRect.top < zy + spriteHeight
            ) {
                endGame(false);
            }
        });
    }
    function showTutorial4Step() {
        document.getElementById('tutorial4-text').textContent = tutorial4Steps[currentTutorial4Step].text;
        document.getElementById('tutorial4-madeleine').src = tutorial4Steps[currentTutorial4Step].img;
        const btn = document.getElementById('tutorial4-next');
        if (currentTutorial4Step === tutorial4Steps.length - 1) {
            btn.textContent = 'Começar';
        } else {
            btn.textContent = 'Próximo';
        }
    }
    function gameLoop() {
        if (window._gameShouldRun === false) return;
        handleMovement();
        updatePlayerAnimation();
        updatePlayer();
        spawnZombie();
        updateZombies();
        updateBullets();
        checkCounterInteraction();
        checkProximityToPlate(); // Verifica a proximidade do prato
        if (!barrierState.right.broken) {
            damageRightBarrier();
        } else {
            checkZombiePlayerCollision();
        }
        requestAnimationFrame(gameLoop);
    }
    createCrosshair();
    setupBarriers();
    updateBarrierHealthBar();
    window._gameShouldRun = false;

    // Função de colisão com barreiras
    function checkBarrierCollision(x, y, width, height, barrier, broken) {
        if (broken) return false;
        const barrierRect = barrier.getBoundingClientRect();
        const gameRect = gameDisplay.getBoundingClientRect();
        // Coordenadas relativas ao gameDisplay
        const bLeft = barrierRect.left - gameRect.left;
        const bRight = barrierRect.right - gameRect.left;
        const bTop = barrierRect.top - gameRect.top;
        const bBottom = barrierRect.bottom - gameRect.top;
        return (
            x < bRight &&
            x + width > bLeft &&
            y < bBottom &&
            y + height > bTop
        );
    }

    window.addEventListener('DOMContentLoaded', function() {
        document.getElementById('tutorial4').style.display = 'flex';
        showTutorial4Step();
    });

    document.getElementById('tutorial4-next').onclick = function() {
        currentTutorial4Step++;
        if (currentTutorial4Step < tutorial4Steps.length) {
            showTutorial4Step();
        } else {
            document.getElementById('tutorial4').style.display = 'none';
            window._gameShouldRun = true;
            requestAnimationFrame(gameLoop);
        }
    };

    // No início do jogo, crie o primeiro prato
    // Removido: lógica de criação do prato

    document.addEventListener('keydown', (e) => {
        if ((e.key === 'e' || e.key === 'E') && !playerState.hasPlate) {
            let collected = false;
            gameState.plates.forEach((plate, index) => {
                if (plate.collected) return;
                if (isPlayerCollidingWithPlate(plate)) {
                    plate.collected = true;
                    playerState.hasPlate = true;
                    plate.element.style.display = 'none';
                    collected = true;
                    showPlateOnPlayer(true);
                }
            });
            if (collected) {
                console.log('Prato coletado!');
            } else {
                console.log('Tentou coletar, mas não estava colidindo.');
            }
        }
    });

    // Adicione um prato visual ao player
    function showPlateOnPlayer(show) {
        let plateOnPlayer = document.getElementById('plate-on-player');
        if (show && !plateOnPlayer) {
            plateOnPlayer = document.createElement('div');
            plateOnPlayer.id = 'plate-on-player';
            plateOnPlayer.className = 'plate';
            plateOnPlayer.style.width = '40px';
            plateOnPlayer.style.height = '40px';
            plateOnPlayer.style.zIndex = 20;
            plateOnPlayer.style.position = 'absolute';
            player.appendChild(plateOnPlayer);
        } else if (!show && plateOnPlayer) {
            plateOnPlayer.remove();
        }
    }

    // Atualize a posição do prato junto ao player
    function updatePlateOnPlayerPosition() {
        const plateOnPlayer = document.getElementById('plate-on-player');
        if (plateOnPlayer) {
            plateOnPlayer.style.left = '16px';
            plateOnPlayer.style.top = '-18px';
        }
    }

    // Defina as coordenadas das mesas
    const leftTable = { x: 100, width: 150 }; // Exemplo: mesa à esquerda
    const rightTable = { x: gameDisplay.clientWidth - 250, width: 150 }; // Exemplo: mesa à direita

    // Função para criar um prato aleatório
    function spawnPlate() {
        if (currentPlate) return; // Não cria um novo prato se já houver um

        const plate = document.createElement('div');
        plate.className = 'plate';
        plate.style.width = `${PLATE_SIZE}px`;
        plate.style.height = `${PLATE_SIZE}px`;
        plate.style.position = 'absolute';
        plate.style.zIndex = 10;

        // Gera uma posição aleatória entre as mesas
        let x, y;

        // Gera a posição x
        do {
            x = Math.random() * (rightTable.x - leftTable.x - PLATE_SIZE) + leftTable.x; // PLATE_SIZE é a largura do prato
        } while (x < leftTable.x + leftTable.width || x > rightTable.x); // Verifica se está dentro da mesa

        // Gera a posição y
        y = Math.random() * (gameDisplay.clientHeight - PLATE_SIZE); // PLATE_SIZE é a altura do prato

        plate.style.left = `${x}px`;
        plate.style.top = `${y}px`;

        // Cria um elemento visual de interação
        const interactionArea = document.createElement('div');
        interactionArea.className = 'interaction-area';
        interactionArea.style.width = '80px'; // Tamanho da área de interação
        interactionArea.style.height = '80px';
        interactionArea.style.position = 'absolute';
        interactionArea.style.left = `${x - 25}px`; // Centraliza em relação ao prato
        interactionArea.style.top = `${y - 25}px`; // Centraliza em relação ao prato
        interactionArea.style.border = '2px dashed rgba(255, 255, 0, 0.7)'; // Estilo do contorno
        interactionArea.style.borderRadius = '50%'; // Forma circular
        interactionArea.style.display = 'none'; // Inicialmente escondido

        gameDisplay.appendChild(plate);
        gameDisplay.appendChild(interactionArea);
        gameState.plates.push({ element: plate, interactionArea: interactionArea, collected: false });
        currentPlate = { element: plate, interactionArea: interactionArea }; // Armazena o prato atual
    }

    // Função para verificar a proximidade do jogador ao prato
    function checkProximityToPlate() {
        if (currentPlate && !currentPlate.collected) {
            const plateRect = currentPlate.element.getBoundingClientRect();
            const playerRect = {
                left: playerState.x,
                right: playerState.x + spriteWidth,
                top: playerState.y,
                bottom: playerState.y + spriteHeight
            };

            // Verifica a distância entre o jogador e o prato
            const distanceX = Math.abs((playerRect.left + playerRect.right) / 2 - (plateRect.left + plateRect.right) / 2);
            const distanceY = Math.abs((playerRect.top + playerRect.bottom) / 2 - (plateRect.top + plateRect.bottom) / 2);
            const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

            // Se o jogador estiver próximo, mostra a área de interação
            if (distance < 100) { // 100 é o raio da área de interação
                console.log('Prato pode ser coletado');
                currentPlate.interactionArea.style.display = 'block';
                currentPlate.element.classList.add('can-pick');
            } else {
                currentPlate.interactionArea.style.display = 'none';
                currentPlate.element.classList.remove('can-pick');
            }
        }
    }

    // Chame a função spawnPlate em um intervalo para gerar pratos aleatórios
    setInterval(spawnPlate, config.plateSpawnRate); // config.plateSpawnRate já está definido como 5000

    function isPlayerCollidingWithPlate(plate) {
        const playerRect = {
            left: playerState.x,
            right: playerState.x + spriteWidth,
            top: playerState.y,
            bottom: playerState.y + spriteHeight
        };
        const plateRect = plate.element.getBoundingClientRect();
        const gameRect = gameDisplay.getBoundingClientRect();

        // Ajusta as coordenadas do prato para o sistema de coordenadas do gameDisplay
        const adjustedPlateRect = {
            left: plateRect.left - gameRect.left,
            right: plateRect.right - gameRect.left,
            top: plateRect.top - gameRect.top,
            bottom: plateRect.bottom - gameRect.top
        };

        return (
            playerRect.right > adjustedPlateRect.left &&
            playerRect.left < adjustedPlateRect.right &&
            playerRect.bottom > adjustedPlateRect.top &&
            playerRect.top < adjustedPlateRect.bottom
        );
    }

    // Função para verificar se o jogador está na área de entrega
    function isPlayerInDeliveryArea() {
        const deliveryArea = { x: leftTable.x, width: leftTable.width, y: 400, height: 100 }; // Área da mesa da esquerda
        const playerRect = {
            left: playerState.x,
            right: playerState.x + spriteWidth,
            top: playerState.y,
            bottom: playerState.y + spriteHeight
        };

        return (
            playerRect.right > deliveryArea.x &&
            playerRect.left < deliveryArea.x + deliveryArea.width &&
            playerRect.bottom > deliveryArea.y &&
            playerRect.top < deliveryArea.y + deliveryArea.height
        );
    }

    console.log('Player Position:', playerState.x, playerState.y);
    console.log('Plate Position:', plate.element.style.left, plate.element.style.top);
    console.log('Collision:', isPlayerCollidingWithPlate(plate));