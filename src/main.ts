import './styles.css';

type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
type BulletMode = 'normal' | 'spread' | 'rapid' | 'laser';
type PowerupMode = BulletMode | 'bomb' | 'heal' | 'shield';
type EnemyType = 'scout' | 'fighter' | 'heavy';
type PathKind = 'straight' | 'sine' | 'zigzag' | 'curve';
type DifficultyId = 'easy' | 'normal' | 'hard';

interface DifficultyConfig {
  label: string;
  baseSpawnMs: number;
  minSpawnMs: number;
  speedMul: number;
  hpMul: number;
  baseMaxEnemies: number;
  powerupDropRate: number;
  playerMaxHp: number;
  topDropBaseMs: number;
}

interface EnemyTemplate {
  radius: number;
  speed: number;
  hp: number;
  score: number;
  baseColor: string;
}

interface BulletProfile {
  interval: number;
  damage: number;
  speed: number;
  radius: number;
  color: string;
  pierce: number;
}

interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  baseX: number;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  path: PathKind;
  t: number;
  phase: number;
  amplitude: number;
  freq: number;
  zigDirection: number;
  zigSpeed: number;
  zigTimer: number;
  zigInterval: number;
  curveVelocity: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  life: number;
  maxLife: number;
  pierceLeft: number;
}

interface Powerup {
  x: number;
  y: number;
  radius: number;
  speed: number;
  mode: PowerupMode;
  color: string;
  pulse: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Player {
  x: number;
  y: number;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  lastFire: number;
  bulletMode: BulletMode;
  powerupExpireAt: number;
  invincibleUntil: number;
  shieldUntil: number;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
  phase: number;
}

const LOGICAL_WIDTH = 480;
const LOGICAL_HEIGHT = 720;
const BEST_SCORE_KEY = 'plane_shooter_high_score_v1';
const POWERUP_DURATION = 8000;
const SHIELD_DURATION = 6500;
const BOMB_MESSAGE_MS = 1800;

const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    label: 'EASY',
    baseSpawnMs: 1120,
    minSpawnMs: 520,
    speedMul: 0.82,
    hpMul: 0.85,
    baseMaxEnemies: 4,
    powerupDropRate: 0.18,
    playerMaxHp: 6,
    topDropBaseMs: 9500,
  },
  normal: {
    label: 'NORMAL',
    baseSpawnMs: 980,
    minSpawnMs: 390,
    speedMul: 1.0,
    hpMul: 1.0,
    baseMaxEnemies: 5,
    powerupDropRate: 0.12,
    playerMaxHp: 5,
    topDropBaseMs: 11500,
  },
  hard: {
    label: 'HARD',
    baseSpawnMs: 900,
    minSpawnMs: 320,
    speedMul: 1.2,
    hpMul: 1.18,
    baseMaxEnemies: 6,
    powerupDropRate: 0.08,
    playerMaxHp: 4,
    topDropBaseMs: 14500,
  },
};

const ENEMIES: Record<EnemyType, EnemyTemplate> = {
  scout: { radius: 12, speed: 120, hp: 2, score: 60, baseColor: '#9ee7ff' },
  fighter: { radius: 14.5, speed: 95, hp: 4, score: 120, baseColor: '#ffad8c' },
  heavy: { radius: 17, speed: 68, hp: 8, score: 220, baseColor: '#cf81ff' },
};

const BULLET_PROFILES: Record<BulletMode, BulletProfile> = {
  normal: { interval: 180, damage: 1, speed: 520, radius: 3.8, color: '#aee8ff', pierce: 0 },
  spread: { interval: 230, damage: 1, speed: 420, radius: 3.8, color: '#93f9a8', pierce: 0 },
  rapid: { interval: 90, damage: 1, speed: 650, radius: 3.2, color: '#ffee83', pierce: 0 },
  laser: { interval: 120, damage: 3, speed: 940, radius: 3.6, color: '#ff5e82', pierce: 5 },
};

const POWERUP_COLOR: Record<BulletMode, string> = {
  normal: '#8fd4ff',
  spread: '#a9ff7d',
  rapid: '#ffe56d',
  laser: '#ff6785',
};

const POWERUP_COLOR_BY_MODE: Record<PowerupMode, string> = {
  normal: '#8fd4ff',
  spread: '#a9ff7d',
  rapid: '#ffe56d',
  laser: '#ff6785',
  bomb: '#ffd57a',
  heal: '#61ff9b',
  shield: '#8ddcff',
};

const POWERUP_SYMBOL: Record<PowerupMode, string> = {
  normal: 'N',
  spread: 'S',
  rapid: 'R',
  laser: 'L',
  bomb: 'B',
  heal: '+',
  shield: 'D',
};

const SPRITE_DRAW_SCALE: Record<string, { w: number; h: number }> = {
  player: { w: 4.55, h: 5.85 },
  scout: { w: 4.5, h: 5.05 },
  fighter: { w: 4.45, h: 5.05 },
  heavy: { w: 4.55, h: 4.7 },
  powerup: { w: 3.75, h: 3.75 },
};

const SPRITE_CELL_WIDTH = 384;
const SPRITE_CELL_HEIGHT = 512;
const SPRITE_SOURCES = {
  player: { sx: 0, sy: 0 },
  scout: { sx: SPRITE_CELL_WIDTH, sy: 0 },
  fighter: { sx: SPRITE_CELL_WIDTH * 2, sy: 0 },
  heavy: { sx: SPRITE_CELL_WIDTH * 3, sy: 0 },
  normal: { sx: 0, sy: SPRITE_CELL_HEIGHT },
  rapid: { sx: SPRITE_CELL_WIDTH, sy: SPRITE_CELL_HEIGHT },
  laser: { sx: SPRITE_CELL_WIDTH * 2, sy: SPRITE_CELL_HEIGHT },
  spread: { sx: SPRITE_CELL_WIDTH * 3, sy: SPRITE_CELL_HEIGHT },
} satisfies Record<EnemyType | BulletMode | 'player', { sx: number; sy: number }>;


const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
if (!canvas) throw new Error('Canvas not found');
const ctx = canvas.getContext('2d')!;
if (!ctx) throw new Error('Failed to get canvas rendering context');

const spriteSheet = new Image();
let spriteSheetReady = false;
spriteSheet.onload = () => {
  spriteSheetReady = true;
};
spriteSheet.src = '/assets/plane-shooter-sprites.png';

const stars: Star[] = [];
let selectedDifficulty: DifficultyId = 'normal';
let state: GameState = 'MENU';
let player!: Player;
let bullets: Bullet[] = [];
let enemies: Enemy[] = [];
let powerups: Powerup[] = [];
let particles: Particle[] = [];

let score = 0;
let bestScore = readBestScore();
let level = 1;
let levelUpUntil = 0;
let spawnTimer = 0;
let topDropTimer = 0;
let lastTime = 0;
let enemyIdSeed = 0;
let statusText = '';
let statusTextUntil = 0;

const keyState: Record<string, boolean> = {
  w: false,
  a: false,
  s: false,
  d: false,
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

function readBestScore(): number {
  const raw = localStorage.getItem(BEST_SCORE_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function writeBestScore(value: number): void {
  const next = Math.max(bestScore, value);
  if (next !== bestScore) {
    bestScore = next;
    localStorage.setItem(BEST_SCORE_KEY, String(next));
  }
}

function setupCanvas(): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = LOGICAL_WIDTH * dpr;
  canvas.height = LOGICAL_HEIGHT * dpr;
  const cssWidth = Math.min(window.innerWidth * 0.95, LOGICAL_WIDTH);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${(cssWidth * LOGICAL_HEIGHT) / LOGICAL_WIDTH}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createStars(): void {
  if (stars.length > 0) return;
  for (let i = 0; i < 240; i += 1) {
    stars.push({
      x: Math.random() * LOGICAL_WIDTH,
      y: Math.random() * LOGICAL_HEIGHT,
      radius: Math.random() * 1.8 + 0.5,
      speed: Math.random() * 0.8 + 0.25,
      alpha: Math.random() * 0.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

function createPlayer(): Player {
  const cfg = DIFFICULTIES[selectedDifficulty];
  return {
    x: LOGICAL_WIDTH / 2,
    y: LOGICAL_HEIGHT - 98,
    radius: 13.8,
    speed: 295,
    hp: cfg.playerMaxHp,
    maxHp: cfg.playerMaxHp,
    lastFire: 0,
    bulletMode: 'normal',
    powerupExpireAt: 0,
    invincibleUntil: 0,
    shieldUntil: 0,
  };
}

function levelFromScore(): number {
  return 1 + Math.floor(score / 1000);
}

function levelFactor(): number {
  return 1 + Math.max(0, level - 1) * 0.13;
}

function maxEnemiesAllowed(): number {
  const cfg = DIFFICULTIES[selectedDifficulty];
  const growthCap = cfg.baseMaxEnemies + 9;
  return Math.min(cfg.baseMaxEnemies + Math.floor(level * 0.7), growthCap);
}

function spawnIntervalMs(): number {
  const cfg = DIFFICULTIES[selectedDifficulty];
  return Math.max(cfg.minSpawnMs, cfg.baseSpawnMs / (1 + (level - 1) * 0.1));
}

function topDropIntervalMs(): number {
  const cfg = DIFFICULTIES[selectedDifficulty];
  return Math.max(cfg.topDropBaseMs * 0.45, cfg.topDropBaseMs / (1 + (level - 1) * 0.08));
}

function randomChoice<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((acc, v) => acc + v, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i += 1) {
    r -= weights[i]!;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

function spawnEnemy(): void {
  if (enemies.length >= maxEnemiesAllowed()) return;
  const path = randomChoice<PathKind>(['straight', 'sine', 'zigzag', 'curve'], [0.35, 0.28, 0.22, 0.15]);
  const heavyChance = Math.min(0.30, 0.12 + level * 0.012);
  const fighterChance = Math.min(0.34, 0.17 + level * 0.008);
  const scoutChance = 1 - heavyChance - fighterChance;
  const type = randomChoice<EnemyType>(['scout', 'fighter', 'heavy'], [scoutChance, fighterChance, heavyChance]);
  const template = ENEMIES[type];
  const cfg = DIFFICULTIES[selectedDifficulty];
  const scale = levelFactor();

  const radius = template.radius * (0.95 + Math.random() * 0.1);
  const x = Math.random() * (LOGICAL_WIDTH - radius * 2.3) + radius * 1.15;
  const hp = Math.max(1, Math.round(template.hp * cfg.hpMul * (1 + (level - 1) * 0.08)));
  enemies.push({
    id: enemyIdSeed += 1,
    type,
    x,
    y: -radius,
    baseX: x,
    radius,
    speed: template.speed * cfg.speedMul * scale,
    hp,
    maxHp: hp,
    scoreValue: Math.round(template.score * (1 + (level - 1) * 0.06)),
    path,
    t: 0,
    phase: Math.random() * Math.PI * 2,
    amplitude: Math.random() * 54 + 28,
    freq: Math.random() * 1.8 + 0.9,
    zigDirection: Math.random() < 0.5 ? -1 : 1,
    zigSpeed: Math.random() * 130 + 90,
    zigTimer: 0,
    zigInterval: Math.random() * 0.6 + 0.35,
    curveVelocity: (Math.random() * 2 - 1) * 45,
  });
}

function randomPowerupMode(): PowerupMode {
  return randomChoice<PowerupMode>(
    ['spread', 'rapid', 'laser', 'bomb', 'heal', 'shield'],
    [0.26, 0.24, 0.18, 0.1, 0.13, 0.09],
  );
}

function spawnPowerup(x: number, y: number, mode: PowerupMode, forced = false): void {
  const cfg = DIFFICULTIES[selectedDifficulty];
  if (!forced) {
    const chance = Math.min(0.55, cfg.powerupDropRate + level * 0.009);
    if (Math.random() > chance) return;
  }
  powerups.push({
    x,
    y,
    radius: 10,
    speed: 105 + Math.random() * 40,
    mode,
    color: POWERUP_COLOR_BY_MODE[mode],
    pulse: Math.random() * Math.PI * 2,
  });
}

function setStatusText(text: string, now: number): void {
  statusText = text;
  statusTextUntil = now + BOMB_MESSAGE_MS;
}

function triggerBomb(now: number): void {
  if (enemies.length === 0) {
    setStatusText('BOMB：未检测到敌机，未触发清屏', now);
    return;
  }

  let bonus = 0;
  for (const enemy of enemies) {
    const isHeavy = enemy.type === 'heavy';
    bonus += enemy.scoreValue + (isHeavy ? 45 : 0);
    addExplosion(enemy.x, enemy.y, isHeavy ? 'rgba(255,184,255,0.9)' : 'rgba(255,220,140,0.9)');
  }

  const count = enemies.length;
  const clearBonus = count * 30;
  const totalGain = bonus + clearBonus;
  score += totalGain;
  setStatusText(`BOMB 清屏：消灭 ${count} 敌 +${totalGain}`, now);
  addExplosion(player.x, player.y, 'rgba(255,220,120,0.7)');
  enemies.splice(0, enemies.length);
}

function triggerHeal(now: number): void {
  if (player.hp < player.maxHp) {
    player.hp += 1;
    setStatusText(`维修补给：HP +1 (${player.hp}/${player.maxHp})`, now);
    addExplosion(player.x, player.y, 'rgba(110,255,170,0.85)');
    return;
  }

  score += 120;
  setStatusText('维修补给：满血，转化 +120 分', now);
  addExplosion(player.x, player.y, 'rgba(110,255,170,0.65)');
}

function triggerShield(now: number): void {
  player.shieldUntil = now + SHIELD_DURATION;
  player.invincibleUntil = Math.max(player.invincibleUntil, now + 700);
  setStatusText(`护盾启动：${Math.ceil(SHIELD_DURATION / 1000)}s`, now);
  addExplosion(player.x, player.y, 'rgba(120,220,255,0.75)');
}

function fireBullets(now: number): void {
  const profile = BULLET_PROFILES[player.bulletMode];
  if (now - player.lastFire < profile.interval) return;
  player.lastFire = now;

  const spawn = (vx: number, vy: number, r: number, d: number, p = 0): void => {
    bullets.push({
      x: player.x + vx * 0,
      y: player.y - player.radius,
      vx,
      vy,
      radius: r,
      damage: d,
      color: profile.color,
      life: 0,
      maxLife: 4,
      pierceLeft: p,
    });
  };

  if (player.bulletMode === 'normal') {
    spawn(0, -profile.speed, profile.radius, profile.damage, 0);
    return;
  }
  if (player.bulletMode === 'rapid') {
    spawn(-5, -profile.speed, profile.radius * 0.9, profile.damage, 0);
    spawn(5, -profile.speed, profile.radius * 0.9, profile.damage, 0);
    return;
  }
  if (player.bulletMode === 'spread') {
    const angles = [-0.36, 0, 0.36];
    for (const angle of angles) {
      const vx = Math.sin(angle) * profile.speed * 0.32;
      const vy = -Math.cos(angle) * profile.speed;
      spawn(vx, vy, profile.radius, profile.damage, 0);
    }
    return;
  }
  spawn(0, -profile.speed, profile.radius * 1.05, profile.damage, profile.pierce);
}

function normalizeDirectionalInput(): { x: number; y: number } {
  let dx = 0;
  let dy = 0;
  if (keyState.w || keyState.ArrowUp) dy -= 1;
  if (keyState.s || keyState.ArrowDown) dy += 1;
  if (keyState.a || keyState.ArrowLeft) dx -= 1;
  if (keyState.d || keyState.ArrowRight) dx += 1;
  const len = Math.hypot(dx, dy);
  return len > 0 ? { x: dx / len, y: dy / len } : { x: 0, y: 0 };
}

function addExplosion(x: number, y: number, base: string): void {
  for (let i = 0; i < 18; i += 1) {
    const dir = Math.random() * Math.PI * 2;
    const speed = Math.random() * 120 + 40;
    particles.push({
      x,
      y,
      vx: Math.cos(dir) * speed,
      vy: Math.sin(dir) * speed,
      radius: Math.random() * 2.4 + 0.8,
      life: 0.5 + Math.random() * 0.35,
      maxLife: 0,
      color: base,
    });
  }
  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    if (p.maxLife === 0) p.maxLife = p.life;
  }
}

function circleCollision(ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean {
  return (ax - bx) ** 2 + (ay - by) ** 2 <= (ar + br) ** 2;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function update(dt: number, now: number): void {
  if (state !== 'PLAYING') return;

  const nowLevel = levelFromScore();
  if (nowLevel > level) {
    level = nowLevel;
    levelUpUntil = now + 1400;
  }

  // player
  const dir = normalizeDirectionalInput();
  if (dir.x !== 0 || dir.y !== 0) {
    player.x += dir.x * player.speed * dt;
    player.y += dir.y * player.speed * dt;
  }
  player.x = clamp(player.x, player.radius + 3, LOGICAL_WIDTH - player.radius - 3);
  player.y = clamp(player.y, player.radius + 3, LOGICAL_HEIGHT - player.radius - 3);

  if (player.bulletMode !== 'normal' && now >= player.powerupExpireAt) {
    player.bulletMode = 'normal';
    player.powerupExpireAt = 0;
  }
  if (statusText && now >= statusTextUntil) {
    statusText = '';
  }
  fireBullets(now);

  // spawn
  spawnTimer += dt * 1000;
  topDropTimer += dt * 1000;
  if (spawnTimer >= spawnIntervalMs()) {
    const baseDoubleSpawn = selectedDifficulty === 'hard' ? 0.34 : selectedDifficulty === 'normal' ? 0.3 : 0.24;
    const count = Math.random() < Math.max(0.14, baseDoubleSpawn - (level - 1) * 0.005) ? 2 : 1;
    for (let i = 0; i < count; i += 1) {
      spawnEnemy();
    }
    spawnTimer = 0;
  }
  if (topDropTimer >= topDropIntervalMs()) {
    spawnPowerup(Math.random() * (LOGICAL_WIDTH - 40) + 20, -14, randomPowerupMode(), true);
    topDropTimer = 0;
  }

  // bullets
  for (const bullet of bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life += dt;
  }
  bullets = bullets.filter((bullet) => bullet.y + bullet.radius > -50 && bullet.y - bullet.radius < LOGICAL_HEIGHT + 50 && bullet.life < bullet.maxLife);

  // enemies
  for (const enemy of enemies) {
    enemy.y += enemy.speed * dt;
    enemy.t += dt;
    if (enemy.path === 'straight') {
      enemy.x = enemy.baseX;
    } else if (enemy.path === 'sine') {
      enemy.x = enemy.baseX + Math.sin(enemy.t * enemy.freq + enemy.phase) * enemy.amplitude * 0.85;
    } else if (enemy.path === 'zigzag') {
      enemy.zigTimer += dt;
      if (enemy.zigTimer >= enemy.zigInterval) {
        enemy.zigDirection *= -1;
        enemy.zigTimer = 0;
      }
      enemy.x += enemy.zigDirection * enemy.zigSpeed * dt;
      if (enemy.x < enemy.radius + 2 || enemy.x > LOGICAL_WIDTH - enemy.radius - 2) {
        enemy.zigDirection *= -1;
      }
    } else {
      const target = Math.min(LOGICAL_WIDTH - enemy.radius, Math.max(enemy.radius, player.x));
      const steering = (target - enemy.x) * 0.35;
      enemy.curveVelocity += steering * dt;
      enemy.curveVelocity *= 0.92;
      enemy.x += enemy.curveVelocity * dt;
    }
    enemy.x = clamp(enemy.x, enemy.radius + 2, LOGICAL_WIDTH - enemy.radius - 2);
  }
  enemies = enemies.filter((enemy) => enemy.y - enemy.radius < LOGICAL_HEIGHT + 30);

  // powerups
  for (const power of powerups) {
    power.y += power.speed * dt;
    power.pulse += dt * 2.8;
  }
  powerups = powerups.filter((power) => power.y - power.radius < LOGICAL_HEIGHT + 16);

  // particles
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 30 * dt;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);

  // collisions
  // player - enemy
  for (let ei = enemies.length - 1; ei >= 0; ei -= 1) {
    const e = enemies[ei];
    if (!e) continue;
    if (circleCollision(player.x, player.y, player.radius, e.x, e.y, e.radius)) {
      if (now < player.shieldUntil) {
        score += Math.floor(e.scoreValue * 0.45);
        addExplosion(e.x, e.y, 'rgba(125,220,255,0.9)');
        enemies.splice(ei, 1);
        continue;
      }
      if (now >= player.invincibleUntil) {
        player.hp -= 1;
        player.invincibleUntil = now + 1000;
        addExplosion(player.x, player.y, 'rgba(255,180,205,0.9)');
        enemies.splice(ei, 1);
        if (player.hp <= 0) {
          state = 'GAME_OVER';
          writeBestScore(score);
          return;
        }
      }
    }
  }

  // bullets - enemies
  for (let bi = bullets.length - 1; bi >= 0; bi -= 1) {
    const b = bullets[bi]!;
    let hit = false;
    for (let ei = enemies.length - 1; ei >= 0; ei -= 1) {
      const e = enemies[ei];
      if (!e) continue;
      if (!circleCollision(b.x, b.y, b.radius, e.x, e.y, e.radius)) continue;

      e.hp -= b.damage;
      addExplosion(b.x, b.y, 'rgba(255,255,255,0.7)');
      hit = true;

      if (e.hp <= 0) {
        score += e.scoreValue;
        addExplosion(e.x, e.y, e.type === 'heavy' ? 'rgba(255,184,255,0.85)' : 'rgba(255,220,140,0.85)');
        if (Math.random() < Math.min(0.7, DIFFICULTIES[selectedDifficulty].powerupDropRate + level * 0.011)) {
          spawnPowerup(e.x, e.y, randomPowerupMode(), true);
        }
        enemies.splice(ei, 1);
      }

      if (b.pierceLeft <= 0) {
        bullets.splice(bi, 1);
        break;
      }
      b.pierceLeft -= 1;
      if (b.pierceLeft <= 0) {
        bullets.splice(bi, 1);
        break;
      }
    }
    if (hit && bi >= bullets.length) break;
  }

  // player - powerup
  for (let pi = powerups.length - 1; pi >= 0; pi -= 1) {
    const powerup = powerups[pi];
    if (!powerup) continue;
    if (circleCollision(player.x, player.y, player.radius, powerup.x, powerup.y, powerup.radius)) {
      if (powerup.mode === 'bomb') {
        triggerBomb(now);
      } else if (powerup.mode === 'heal') {
        triggerHeal(now);
      } else if (powerup.mode === 'shield') {
        triggerShield(now);
      } else {
        player.bulletMode = powerup.mode;
        player.powerupExpireAt = now + POWERUP_DURATION;
        player.lastFire = 0;
        setStatusText(`武器更新：${POWERUP_SYMBOL[powerup.mode]} (${powerup.mode.toUpperCase()})`, now);
      }
      addExplosion(powerup.x, powerup.y, 'rgba(140,255,190,0.85)');
      powerups.splice(pi, 1);
    }
  }
}

function drawBackground(dt: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
  sky.addColorStop(0, '#060a19');
  sky.addColorStop(0.4, '#0e1f45');
  sky.addColorStop(1, '#1a2a51');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  for (const star of stars) {
    star.y += star.speed + level * 0.08;
    star.phase += dt * 2;
    const a = star.alpha * (0.45 + Math.sin(star.phase + dt * 2) * 0.22);
    ctx.fillStyle = `rgba(190,220,255,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    if (star.y > LOGICAL_HEIGHT) {
      star.y = -6;
      star.x = Math.random() * LOGICAL_WIDTH;
    }
  }

  for (let i = 0; i < 9; i += 1) {
    const sx = ((i * 58 + (Date.now() / 50) * 0.12) % LOGICAL_WIDTH);
    ctx.strokeStyle = `rgba(120, 158, 240, ${0.03 + (Math.sin(Date.now() / 500 + i) + 1) * 0.02})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx + ((i % 2 === 0 ? 1 : -1) * 7), LOGICAL_HEIGHT);
    ctx.stroke();
  }
}

function drawParticles(): void {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color.replace('0.85', `${alpha.toFixed(3)}`);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0, p.radius * (0.3 + alpha)), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSprite(
  source: { sx: number; sy: number },
  x: number,
  y: number,
  width: number,
  height: number,
  rotation = 0,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(
    spriteSheet,
    source.sx,
    source.sy,
    SPRITE_CELL_WIDTH,
    SPRITE_CELL_HEIGHT,
    -width / 2,
    -height / 2,
    width,
    height,
  );
  ctx.restore();
}

function powerupSpriteSource(mode: PowerupMode): { sx: number; sy: number } {
  if (mode === 'bomb') return SPRITE_SOURCES.rapid;
  if (mode === 'heal') return SPRITE_SOURCES.normal;
  if (mode === 'shield') return SPRITE_SOURCES.laser;
  return SPRITE_SOURCES[mode];
}

function drawPlayer(now: number): void {
  const blink = now < player.invincibleUntil && Math.floor(now / 60) % 2 === 0;
  if (blink) return;
  const x = player.x;
  const y = player.y;
  const r = player.radius;
  const pulse = 1 + Math.sin(now / 90) * 0.06;
  const shieldActive = now < player.shieldUntil;
  if (spriteSheetReady) {
    drawSprite(SPRITE_SOURCES.player, x, y - 2, r * SPRITE_DRAW_SCALE.player.w, r * SPRITE_DRAW_SCALE.player.h);
    for (let i = -1; i <= 1; i += 1) {
      ctx.fillStyle = `rgba(91, 220, 255, ${0.18 + pulse * 0.04})`;
      ctx.beginPath();
      ctx.ellipse(x + i * 9, y + r * 2.35, 3.2, 8.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = `rgba(180, 228, 255, ${0.45 + pulse * 0.12})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(x, y, r + 0.4, 0, Math.PI * 2);
    ctx.stroke();
    if (shieldActive) {
      ctx.strokeStyle = `rgba(125, 220, 255, ${0.42 + Math.sin(now / 140) * 0.18})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.0, 0, Math.PI * 2);
      ctx.stroke();
    }
    return;
  }
  const core = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, r + 2);
  core.addColorStop(0, '#ecfbff');
  core.addColorStop(1, '#6cb1ff');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.1);
  ctx.lineTo(x + r * 0.78, y + r * 0.1);
  ctx.lineTo(x + r * 0.18, y + r * 1.05);
  ctx.lineTo(x - r * 0.18, y + r * 1.05);
  ctx.lineTo(x - r * 0.78, y + r * 0.1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.36)';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.55, y + 2);
  ctx.lineTo(x - r - 9, y + r + 7);
  ctx.lineTo(x - 2, y + r * 0.98);
  ctx.lineTo(x - r * 0.4, y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + r * 0.55, y + 2);
  ctx.lineTo(x + r + 9, y + r + 7);
  ctx.lineTo(x + 2, y + r * 0.98);
  ctx.lineTo(x + r * 0.4, y - 2);
  ctx.closePath();
  ctx.fill();

  for (let i = -1; i <= 1; i += 1) {
    ctx.fillStyle = `rgba(91, 200, 255, ${0.23 + i * 0.02})`;
    ctx.beginPath();
    ctx.ellipse(x + i * 4, y + r + 6, 2.7 + i * 0.2, 4.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = `rgba(180, 228, 255, ${0.7 + pulse * 0.1})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, r + 0.4, 0, Math.PI * 2);
  ctx.stroke();
  if (shieldActive) {
    ctx.strokeStyle = 'rgba(125, 220, 255, 0.62)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawEnemy(enemy: Enemy): void {
  const healthRatio = enemy.hp / enemy.maxHp;
  const data = ENEMIES[enemy.type];
  if (spriteSheetReady) {
    const scale = SPRITE_DRAW_SCALE[enemy.type];
    const sizes: Record<EnemyType, { w: number; h: number }> = {
      scout: { w: enemy.radius * scale.w, h: enemy.radius * scale.h },
      fighter: { w: enemy.radius * scale.w, h: enemy.radius * scale.h },
      heavy: { w: enemy.radius * scale.w, h: enemy.radius * scale.h },
    };
    const size = sizes[enemy.type];
    drawSprite(SPRITE_SOURCES[enemy.type], enemy.x, enemy.y, size.w, size.h, Math.PI);
  } else if (enemy.type === 'scout') {
    ctx.fillStyle = data.baseColor;
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y - enemy.radius);
    ctx.lineTo(enemy.x + enemy.radius * 0.72, enemy.y + enemy.radius * 0.52);
    ctx.lineTo(enemy.x - enemy.radius * 0.72, enemy.y + enemy.radius * 0.52);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(enemy.x - enemy.radius * 0.45, enemy.y + 1, enemy.radius * 0.9, enemy.radius * 0.28);
  } else if (enemy.type === 'fighter') {
    ctx.fillStyle = data.baseColor;
    ctx.fillRect(enemy.x - enemy.radius * 0.85, enemy.y - enemy.radius * 0.65, enemy.radius * 1.7, enemy.radius * 1.3);
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fill();
    ctx.fillStyle = data.baseColor;
  } else {
    const glow = ctx.createRadialGradient(enemy.x, enemy.y - 4, enemy.radius * 0.1, enemy.x, enemy.y, enemy.radius * 1.2);
    glow.addColorStop(0, 'rgba(255,220,255,0.95)');
    glow.addColorStop(0.5, data.baseColor);
    glow.addColorStop(1, 'rgba(84, 35, 130, 0.9)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y, enemy.radius * 1.15, enemy.radius, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // HP bar
  const barW = enemy.radius * 2;
  const barY = enemy.y + enemy.radius + 5;
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(enemy.x - barW * 0.5, barY, barW, 3.2);
  ctx.fillStyle = 'rgba(90, 242, 160, 0.95)';
  ctx.fillRect(enemy.x - barW * 0.5, barY, barW * Math.max(0, healthRatio), 3.2);
}

function drawPowerups(dt: number): void {
  for (const p of powerups) {
    const scale = 1 + Math.sin(p.pulse) * 0.18;
    ctx.fillStyle = `rgba(255,255,255,0.16)`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * (1.35 * scale), 0, Math.PI * 2);
    ctx.fill();
    if (spriteSheetReady) {
      drawSprite(powerupSpriteSource(p.mode), p.x, p.y, p.radius * SPRITE_DRAW_SCALE.powerup.w * scale, p.radius * SPRITE_DRAW_SCALE.powerup.h * scale);
      if (p.mode === 'bomb' || p.mode === 'heal' || p.mode === 'shield') {
        ctx.strokeStyle =
          p.mode === 'bomb'
            ? `rgba(255, 130, 90, ${0.8 + scale * 0.1})`
            : p.mode === 'heal'
              ? `rgba(105, 255, 150, ${0.72 + scale * 0.1})`
              : `rgba(125, 220, 255, ${0.72 + scale * 0.1})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (1.75 + scale * 0.2), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = p.mode === 'bomb' ? '#fff4d1' : '#f5fff9';
        ctx.font = `bold ${12 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(POWERUP_SYMBOL[p.mode], p.x, p.y + 1);
      }
      continue;
    }
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.radius * 0.72, p.y - p.radius * 0.72, p.radius * 1.44, p.radius * 1.44);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(p.x - p.radius * 0.72, p.y - p.radius * 0.72, p.radius * 1.44, p.radius * 1.44);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = POWERUP_SYMBOL[p.mode];
    ctx.fillText(label, p.x, p.y + 1);
  }
}

function drawBullets(): void {
  for (const b of bullets) {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHUD(now: number): void {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const safeMode = player.bulletMode === 'normal' ? 'NORMAL' : player.bulletMode.toUpperCase();
  const remain =
    player.bulletMode === 'normal'
      ? ''
      : ` (${Math.max(0, Math.ceil((player.powerupExpireAt - now) / 1000))}s)`;
  const shieldRemain = Math.max(0, Math.ceil((player.shieldUntil - now) / 1000));
  const statusAlpha = statusText ? Math.min(1, (statusTextUntil - now) / BOMB_MESSAGE_MS) : 0;

  ctx.fillStyle = 'rgba(7, 14, 32, 0.64)';
  const hudHeight = statusText || shieldRemain > 0 ? 166 : 128;
  ctx.fillRect(10, 10, 268, hudHeight);
  ctx.fillStyle = '#f5f8ff';
  ctx.font = '700 13px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(`SCORE: ${score}`, 22, 31);
  ctx.fillText(`BEST: ${bestScore}`, 22, 48);
  ctx.fillText(`LV:${level}  DIFF:${DIFFICULTIES[selectedDifficulty].label}`, 22, 65);
  ctx.fillText(`HP`, 22, 94);
  ctx.fillText(`武器: ${safeMode}${remain}`, 22, 112);
  if (shieldRemain > 0) {
    ctx.fillStyle = '#b9eaff';
    ctx.fillText(`护盾: ${shieldRemain}s`, 22, 130);
  }
  if (statusText) {
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0.18, statusAlpha).toFixed(3)})`;
    ctx.fillText(statusText, 22, shieldRemain > 0 ? 154 : 136);
  }

  const hpWidth = 112;
  const hpRatio = player.hp / player.maxHp;
  ctx.fillStyle = 'rgba(255,255,255,0.24)';
  ctx.fillRect(52, 84, hpWidth, 10);
  ctx.fillStyle = hpRatio > 0.6 ? 'rgba(90,255,150,0.95)' : hpRatio > 0.3 ? 'rgba(255, 220, 120, 0.9)' : 'rgba(255, 110, 110, 0.9)';
  ctx.fillRect(52, 84, hpWidth * hpRatio, 10);
  ctx.strokeStyle = 'rgba(255,255,255,0.36)';
  ctx.strokeRect(52, 84, hpWidth, 10);
}

function drawOverlays(now: number): void {
  if (state === 'PLAYING') return;
  ctx.fillStyle = 'rgba(10, 18, 40, 0.86)';
  ctx.fillRect(32, 180, LOGICAL_WIDTH - 64, 360);
  ctx.strokeStyle = 'rgba(160, 197, 255, 0.55)';
  ctx.strokeRect(32, 180, LOGICAL_WIDTH - 64, 360);

  if (state === 'MENU') {
    ctx.fillStyle = '#edf5ff';
    ctx.font = '800 30px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('2D 飞机大战', LOGICAL_WIDTH / 2, 236);
    ctx.font = '15px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#d1dcf8';
    ctx.fillText('W/A/S/D 或方向键移动，自动前进发射', LOGICAL_WIDTH / 2, 268);
    ctx.fillText('按空格开始，P/Esc 暂停', LOGICAL_WIDTH / 2, 288);
    ctx.fillText('道具: S(散射) R(快速) L(激光) B(清屏)', LOGICAL_WIDTH / 2, 308);
    ctx.fillText('新增: +(回血) D(护盾)', LOGICAL_WIDTH / 2, 328);
    ctx.fillText('1 2 3 选择难度：EASY / NORMAL / HARD', LOGICAL_WIDTH / 2, 348);

    const color = (key: DifficultyId) => (selectedDifficulty === key ? '#8cf' : '#b9c7ff');
    ctx.fillStyle = color('easy');
    ctx.fillText(`1. EASY`, LOGICAL_WIDTH / 2, 382);
    ctx.fillStyle = color('normal');
    ctx.fillText(`2. NORMAL`, LOGICAL_WIDTH / 2, 408);
    ctx.fillStyle = color('hard');
    ctx.fillText(`3. HARD`, LOGICAL_WIDTH / 2, 434);
    ctx.fillStyle = '#e2ecff';
    ctx.fillText('规则：每 1000 分提升难度（速度/血量/生成）', LOGICAL_WIDTH / 2, 464);
    return;
  }

  if (state === 'PAUSED') {
    ctx.fillStyle = '#f4faff';
    ctx.font = '700 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME PAUSED', LOGICAL_WIDTH / 2, 286);
    ctx.font = '16px sans-serif';
    ctx.fillText('按 P / Esc / 空格恢复', LOGICAL_WIDTH / 2, 314);
    return;
  }

  ctx.fillStyle = '#f5f9ff';
  ctx.font = '800 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', LOGICAL_WIDTH / 2, 286);
  ctx.font = '16px sans-serif';
  ctx.fillText(`本局分数：${score}`, LOGICAL_WIDTH / 2, 318);
  ctx.fillText(`最高分：${Math.max(bestScore, score)}`, LOGICAL_WIDTH / 2, 340);
  ctx.fillText('按空格重开', LOGICAL_WIDTH / 2, 364);
}

function drawLevelUpBanner(now: number): void {
  if (now > levelUpUntil) return;
  const alpha = (levelUpUntil - now) / 1200;
  ctx.fillStyle = `rgba(170, 220, 255, ${alpha * 0.75})`;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, 56);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.textAlign = 'center';
  ctx.font = '700 24px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(`LEVEL ${level} UP`, LOGICAL_WIDTH / 2, 38);
}

function render(now: number, dt: number): void {
  drawBackground(dt);
  drawParticles();
  for (const enemy of enemies) drawEnemy(enemy);
  drawPowerups(dt);
  drawBullets();
  if (state !== 'MENU') {
    drawPlayer(now);
  }
  if (state === 'PLAYING' || state === 'PAUSED') drawHUD(now);
  drawOverlays(now);
  drawLevelUpBanner(now);
}

function loop(now: number): void {
  const dt = Math.min((now - lastTime) / 1000, 1 / 20);
  if (state === 'PLAYING') update(dt, now);
  render(now, dt);
  lastTime = now;
  requestAnimationFrame(loop);
}

function startGame(): void {
  player = createPlayer();
  bullets = [];
  enemies = [];
  powerups = [];
  particles = [];
  score = 0;
  level = 1;
  levelUpUntil = 0;
  spawnTimer = 0;
  topDropTimer = 0;
  lastTime = performance.now();
  statusText = '';
  statusTextUntil = 0;
  state = 'PLAYING';
}

function setupInput(): void {
  window.addEventListener('keydown', (event) => {
    const key = event.key;
    const lower = key.toLowerCase();
    if (Object.hasOwn(keyState, key)) {
      keyState[key] = true;
      event.preventDefault();
      return;
    }
    if (Object.hasOwn(keyState, lower)) {
      keyState[lower] = true;
      event.preventDefault();
      return;
    }

    if (key === ' ' && !event.repeat) {
      event.preventDefault();
      if (state === 'MENU' || state === 'GAME_OVER') {
        startGame();
      } else if (state === 'PAUSED') {
        state = 'PLAYING';
      }
      return;
    }

    if (lower === 'p' || key === 'Escape') {
      if (state === 'PLAYING') {
        state = 'PAUSED';
      } else if (state === 'PAUSED') {
        state = 'PLAYING';
      }
      event.preventDefault();
      return;
    }

    if (state === 'MENU') {
      if (key === '1') selectedDifficulty = 'easy';
      if (key === '2') selectedDifficulty = 'normal';
      if (key === '3') selectedDifficulty = 'hard';
    }
  });

  window.addEventListener('keyup', (event) => {
    const key = event.key;
    const lower = key.toLowerCase();
    if (Object.hasOwn(keyState, key)) keyState[key] = false;
    if (Object.hasOwn(keyState, lower)) keyState[lower] = false;
  });
}

function setup(): void {
  setupCanvas();
  createStars();
  setupInput();
  window.addEventListener('resize', setupCanvas);
  requestAnimationFrame((time) => {
    lastTime = time;
    player = createPlayer();
    requestAnimationFrame(loop);
  });
}

setup();
