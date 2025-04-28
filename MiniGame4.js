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
        animationSpeed: 150
    };

    const playerState = {
        x: 200,
        y: 150,
        direction: 'down',
        canShoot: true,
        lastShotTime: 0,
        isMoving: false,
        animationFrame: 0,
        lastFrameTime: 0,
        hasWeapon: true
    };

    const obstacles = [
        { left: 750, top: 0, width: 100, height: gameDisplay.clientHeight }
    ];

    let zombies = [];
    let bullets = [];
    let lastSpawnTime = 0;
    let weapon = null;

    const keys = { up: false, down: false, left: false, right: false, pickup: false };

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
        const newX = playerState.x + moveX * config.speed;
        const newY = playerState.y + moveY * config.speed;
        if (!checkCollision(newX, playerState.y, spriteWidth, spriteHeight, obstacles)) {
            playerState.x = Math.max(0, Math.min(gameDisplay.clientWidth - spriteWidth, newX));
        }
        if (!checkCollision(playerState.x, newY, spriteWidth, spriteHeight, obstacles)) {
            playerState.y = Math.max(0, Math.min(gameDisplay.clientHeight - spriteHeight, newY));
        }
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
            const newX = zombie.x - config.zombieSpeed;
            if (!checkCollision(newX, zombie.y, spriteWidth, spriteHeight, obstacles)) {
                zombie.x = newX;
            }
            zombie.element.style.left = `${zombie.x}px`;
            zombie.element.style.top = `${zombie.y}px`;
            updateZombieAnimation(zombie);
            if (zombie.x < -spriteWidth) {
                gameDisplay.removeChild(zombie.element);
                zombies.splice(index, 1);
            }
        });
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
    function checkCollision(x, y, width, height, objects) {
        return objects.some(obj => {
            return (
                x < obj.left + obj.width &&
                x + width > obj.left &&
                y < obj.top + obj.height &&
                y + height > obj.top
            );
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
    function gameLoop() {
        handleMovement();
        updatePlayerAnimation();
        updatePlayer();
        spawnZombie();
        updateZombies();
        updateBullets();
        requestAnimationFrame(gameLoop);
    }
    createCrosshair();
    gameLoop();