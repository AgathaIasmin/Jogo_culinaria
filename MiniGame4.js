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
const backgroundMusic = new Audio('./assets/audio/joyful.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;
document.addEventListener('click', function() {
  backgroundMusic.muted = false;
  backgroundMusic.play().catch(error => {
    console.error('Erro ao reproduzir áudio:', error);
  });
}, {
  once: true
});
const obstacles = [
  {
    left: 600,
    top: 400,
    width: 800,
    height: 40,
    health: 9999
  },
  {
    left: 750,
    top: 0,
    width: 100,
    height: gameDisplay.clientHeight,
    health: 5
  }
];
const clientArea = {
  left: 600,
  top: 0,
  width: 800,
  height: 400
};
let zombies = [];
let bullets = [];
let lastSpawnTime = 0;
let weapon = null;
const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  pickup: false
};
let obstacleElements = [];
let score = 0;
const scoreElement = document.getElementById('score');
const gameoverElement = document.getElementById('gameover');
const restartBtn = document.getElementById('restartBtn');
let isGameOver = false;
const mesaMaxHealth = 20;
let mesaHealth = mesaMaxHealth;
const mesaHealthBar = document.getElementById('mesa-health-bar');
let grenades = 3;
const grenadesElement = document.getElementById('grenades');
let grenadesOnField = [];
let grenadeCooldown = false;
const mapWidth = 2000;
const mapHeight = 1500;
let wave = 1;
const waveElement = document.getElementById('wave');
let record = localStorage.getItem('record') || 0;
const recordElement = document.getElementById('record');
let ammo = 8;
const maxAmmo = 8;
const ammoElement = document.getElementById('ammo');
let isPaused = false;
const pauseOverlay = document.getElementById('pause-overlay');
let dashCooldown = false;
let isDashing = false;
let dashTime = 0;
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
  player.style.left = `${playerState.x}px`;
  player.style.top = `${playerState.y}px`;
  const directionMap = {
    down: 0,
    left: 1,
    up: 2,
    right: 3
  };
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
  const bgY = -zombie.animationFrame * 72;
  zombie.element.style.backgroundPosition = `${bgX}px ${bgY}px`;
}

function updateZombies() {
  const zombieSpeed = getDynamicZombieSpeed();
  zombies.forEach((zombie, index) => {
    const newX = zombie.x - zombieSpeed;
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
    const mesa = obstacles[0];
    const zombieRect = zombie.element.getBoundingClientRect();
    const mesaRect = obstacleElements[0].getBoundingClientRect();
    if (zombieRect.right > mesaRect.left && zombieRect.left < mesaRect.right && zombieRect.bottom > mesaRect.top && zombieRect.top < mesaRect.bottom) {
      mesaHealth -= 1;
      updateMesaHealthBar();
      if (mesaHealth <= 0) {
        triggerGameOver();
      }
      if (zombie.element.parentNode) {
        gameDisplay.removeChild(zombie.element);
      }
      zombies.splice(index, 1);
    }
  });
}

function spawnZombie() {
  const now = Date.now();
  const dynamicRate = getDynamicZombieSpawnRate();
  if (now - lastSpawnTime < dynamicRate) return;
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
      if (bulletRect.right > zombieRect.left && bulletRect.left < zombieRect.right && bulletRect.bottom > zombieRect.top && bulletRect.top < zombieRect.bottom) {
        zombie.health -= 1;
        zombie.healthBar.style.width = `${(zombie.health / config.zombieInitialHealth) * 100}%`;
        if (zombie.health <= 0) {
          score += 10;
          updateHUD();
          if (zombie.element.parentNode) {
            gameDisplay.removeChild(zombie.element);
          }
          zombies.splice(zombieIndex, 1);
        }
        if (bullet.element.parentNode) {
          gameDisplay.removeChild(bullet.element);
        }
        bullets.splice(bulletIndex, 1);
      }
    });
    if (bullet.x < 0 || bullet.x > gameDisplay.clientWidth || bullet.y < 0 || bullet.y > gameDisplay.clientHeight) {
      if (bullet.element.parentNode) {
        gameDisplay.removeChild(bullet.element);
      }
      bullets.splice(bulletIndex, 1);
    }
  });
}

function checkCollision(x, y, width, height, objects) {
  return objects.some(obj => {
    return (x < obj.left + obj.width && x + width > obj.left && y < obj.top + obj.height && y + height > obj.top);
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
    case 'w':
    case 'ArrowUp':
      keys.up = true;
      break;
    case 's':
    case 'ArrowDown':
      keys.down = true;
      break;
    case 'a':
    case 'ArrowLeft':
      keys.left = true;
      break;
    case 'd':
    case 'ArrowRight':
      keys.right = true;
      break;
  }
});
document.addEventListener('keyup', (e) => {
  switch (e.key) {
    case 'w':
    case 'ArrowUp':
      keys.up = false;
      break;
    case 's':
    case 'ArrowDown':
      keys.down = false;
      break;
    case 'a':
    case 'ArrowLeft':
      keys.left = false;
      break;
    case 'd':
    case 'ArrowRight':
      keys.right = false;
      break;
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
  if (isGameOver) return;
  handleMovement();
  updatePlayerAnimation();
  updatePlayer();
  spawnZombie();
  updateZombies();
  updateBullets();
  updateCamera();
  requestAnimationFrame(gameLoop);
}
createCrosshair();
function renderObstacles() {
  obstacles.forEach((obs, idx) => {
    const el = document.createElement('div');
    el.className = 'obstacle';
    if (obs.width > 500 && obs.height < 100) {
      el.classList.add('bancada');
    }
    el.style.left = `${obs.left}px`;
    el.style.top = `${obs.top}px`;
    el.style.width = `${obs.width}px`;
    el.style.height = `${obs.height}px`;
    el.dataset.idx = idx;
    gameDisplay.appendChild(el);
    obstacleElements[idx] = el;
  });
}
renderObstacles();
// Atualize o placar
function updateHUD() {
  scoreElement.textContent = `Pontos: ${score}`;
  scoreElement.classList.add('score-pulse');
  setTimeout(() => scoreElement.classList.remove('score-pulse'), 300);
  waveElement.textContent = `Wave: ${wave}`;
  recordElement.textContent = `Recorde: ${record}`;
  ammoElement.textContent = `Munição: ${ammo}/${maxAmmo}`;
}
function triggerGameOver() {
  isGameOver = true;
  gameoverElement.style.display = 'block';
}
restartBtn.addEventListener('click', () => {
  score = 0;
  mesaHealth = mesaMaxHealth;
  isGameOver = false;
  zombies.forEach(z => z.element.remove());
  bullets.forEach(b => b.element.remove());
  zombies = [];
  bullets = [];
  playerState.x = 200;
  playerState.y = 150;
  updateHUD();
  updateMesaHealthBar();
  gameoverElement.style.display = 'none';
  requestAnimationFrame(gameLoop);
  grenades = 3;
  updateGrenadesHUD();
});
function updateMesaHealthBar() {
  const percent = Math.max(0, mesaHealth / mesaMaxHealth) * 100;
  mesaHealthBar.style.width = percent + '%';
  if (percent > 60) {
    mesaHealthBar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
  } else if (percent > 30) {
    mesaHealthBar.style.background = 'linear-gradient(90deg, #FFC107, #FFEB3B)';
  } else {
    mesaHealthBar.style.background = 'linear-gradient(90deg, #F44336, #FF5722)';
  }
}
updateHUD();
updateMesaHealthBar();

function getDynamicZombieSpawnRate() {
  const minRate = 400;
  const rate = config.zombieSpawnRate - Math.floor(score / 100) * 100;
  return Math.max(minRate, rate);
}

function getDynamicZombieSpeed() {
  const maxSpeed = 2.5;
  const speed = config.zombieSpeed + Math.floor(score / 200) * 0.1;
  return Math.min(maxSpeed, speed);
}

function updateGrenadesHUD() {
  grenadesElement.textContent = `Granadas: ${grenades}`;
}

function updateCamera() {
  const viewWidth = gameDisplay.parentElement.clientWidth;
  const viewHeight = gameDisplay.parentElement.clientHeight;
  let offsetX = playerState.x + spriteWidth / 2 - viewWidth / 2;
  let offsetY = playerState.y + spriteHeight / 2 - viewHeight / 2;
  offsetX = Math.max(0, Math.min(mapWidth - viewWidth, offsetX));
  offsetY = Math.max(0, Math.min(mapHeight - viewHeight, offsetY));
  gameDisplay.style.transform = `translate(${-offsetX}px, ${-offsetY}px)`;
}

function renderClientArea() {
  const area = document.createElement('div');
  area.className = 'client-area';
  area.style.left = `${clientArea.left}px`;
  area.style.top = `${clientArea.top}px`;
  area.style.width = `${clientArea.width}px`;
  area.style.height = `${clientArea.height}px`;
  gameDisplay.appendChild(area);
}
renderClientArea();

function spawnClient() {
  const client = document.createElement('div');
  client.className = 'client';
  const x = clientArea.left + Math.random() * (clientArea.width - 50);
  const y = clientArea.top + Math.random() * (clientArea.height - 50);
  client.style.left = `${x}px`;
  client.style.top = `${y}px`;
  gameDisplay.appendChild(client);
}
gameLoop();