class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu';
        this.score = 0;
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        
        this.player = null;
        this.bots = [];
        this.bullets = [];
        this.powerUps = [];
        this.particles = [];
        
        this.setupCanvas();
        this.setupEventListeners();
        this.initializeGame();
    }
    
    setupCanvas() {
        this.canvas.width = 900;
        this.canvas.height = 600;
    }
    
    setupEventListeners() {
        // Menu buttons
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.startGame());
        document.getElementById('victoryRestartButton').addEventListener('click', () => this.startGame());
        
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') e.preventDefault();
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'playing' && this.player) {
                this.player.shoot();
            }
        });
    }
    
    initializeGame() {
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, this);
        this.bots = [];
        this.bullets = [];
        this.powerUps = [];
        this.particles = [];
        this.score = 0;
        
        // Create bots
        for (let i = 0; i < 3; i++) {
            this.spawnBot();
        }
        
        this.updateUI();
    }
    
    spawnBot() {
        let x, y;
        do {
            x = Math.random() * (this.canvas.width - 60) + 30;
            y = Math.random() * (this.canvas.height - 60) + 30;
        } while (this.getDistance(x, y, this.player.x, this.player.y) < 200);
        
        this.bots.push(new Bot(x, y, this));
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('gameMenu').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('victory').classList.add('hidden');
        document.getElementById('gameCanvas').classList.remove('hidden');
        document.getElementById('gameUI').classList.remove('hidden');
        
        this.initializeGame();
        this.gameLoop();
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Update player
        this.player.update();
        
        // Update bots
        this.bots.forEach(bot => bot.update());
        
        // Update bullets
        this.bullets.forEach(bullet => bullet.update());
        
        // Update power-ups
        this.powerUps.forEach(powerUp => powerUp.update());
        
        // Update particles
        this.particles.forEach(particle => particle.update());
        
        // Check collisions
        this.checkCollisions();
        
        // Remove dead entities
        this.bullets = this.bullets.filter(bullet => !bullet.dead);
        this.powerUps = this.powerUps.filter(powerUp => !powerUp.dead);
        this.particles = this.particles.filter(particle => !particle.dead);
        this.bots = this.bots.filter(bot => !bot.dead);
        
        // Check win/lose conditions
        if (this.player.dead) {
            this.gameOver();
        } else if (this.bots.length === 0) {
            this.victory();
        }
        
        // Spawn power-ups randomly
        if (Math.random() < 0.002 && this.powerUps.length < 2) {
            this.spawnPowerUp();
        }
        
        this.updateUI();
    }
    
    checkCollisions() {
        // Bullet vs Player/Bot collisions
        this.bullets.forEach(bullet => {
            if (bullet.owner === 'player') {
                this.bots.forEach(bot => {
                    if (this.getDistance(bullet.x, bullet.y, bot.x, bot.y) < bot.radius) {
                        bot.takeDamage(bullet.damage);
                        bullet.dead = true;
                        this.createExplosion(bullet.x, bullet.y, '#ff6b6b');
                        
                        if (bot.dead) {
                            this.score += 100;
                            this.createExplosion(bot.x, bot.y, '#ff0000', 30);
                        }
                    }
                });
            } else if (bullet.owner === 'bot') {
                if (this.getDistance(bullet.x, bullet.y, this.player.x, this.player.y) < this.player.radius) {
                    this.player.takeDamage(bullet.damage);
                    bullet.dead = true;
                    this.createExplosion(bullet.x, bullet.y, '#ffaa00');
                }
            }
        });
        
        // Power-up vs Player collision
        this.powerUps.forEach(powerUp => {
            if (this.getDistance(powerUp.x, powerUp.y, this.player.x, this.player.y) < this.player.radius + powerUp.radius) {
                powerUp.apply(this.player);
                powerUp.dead = true;
                this.createExplosion(powerUp.x, powerUp.y, '#00ff00', 20);
            }
        });
    }
    
    spawnPowerUp() {
        const types = ['health', 'rapidfire', 'damage'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = Math.random() * (this.canvas.width - 40) + 20;
        const y = Math.random() * (this.canvas.height - 40) + 20;
        
        this.powerUps.push(new PowerUp(x, y, type, this));
    }
    
    createExplosion(x, y, color, size = 15) {
        for (let i = 0; i < size; i++) {
            const angle = (Math.PI * 2 * i) / size;
            const speed = Math.random() * 3 + 2;
            this.particles.push(new Particle(x, y, angle, speed, color));
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid pattern
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Draw game entities
        this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
        this.bullets.forEach(bullet => bullet.render(this.ctx));
        this.bots.forEach(bot => bot.render(this.ctx));
        this.player.render(this.ctx);
        this.particles.forEach(particle => particle.render(this.ctx));
    }
    
    getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    
    updateUI() {
        document.getElementById('healthValue').textContent = Math.max(0, this.player.health);
        document.getElementById('playerHealth').style.width = `${Math.max(0, this.player.health)}%`;
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('enemiesValue').textContent = this.bots.length;
    }
    
    gameOver() {
        this.gameState = 'gameover';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('gameCanvas').classList.add('hidden');
        document.getElementById('gameUI').classList.add('hidden');
    }
    
    victory() {
        this.gameState = 'victory';
        document.getElementById('victoryScore').textContent = this.score;
        document.getElementById('victory').classList.remove('hidden');
        document.getElementById('gameCanvas').classList.add('hidden');
        document.getElementById('gameUI').classList.add('hidden');
    }
}

class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.radius = 20;
        this.speed = 5;
        this.health = 100;
        this.maxHealth = 100;
        this.dead = false;
        this.color = '#4CAF50';
        this.shootCooldown = 0;
        this.maxShootCooldown = 20;
        this.damage = 20;
        this.rapidFireTime = 0;
    }
    
    update() {
        if (this.dead) return;
        
        // Movement
        let dx = 0, dy = 0;
        if (this.game.keys['w'] || this.game.keys['arrowup']) dy = -1;
        if (this.game.keys['s'] || this.game.keys['arrowdown']) dy = 1;
        if (this.game.keys['a'] || this.game.keys['arrowleft']) dx = -1;
        if (this.game.keys['d'] || this.game.keys['arrowright']) dx = 1;
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        this.x += dx * this.speed;
        this.y += dy * this.speed;
        
        // Keep player in bounds
        this.x = Math.max(this.radius, Math.min(this.game.canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(this.game.canvas.height - this.radius, this.y));
        
        // Update cooldowns
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.rapidFireTime > 0) {
            this.rapidFireTime--;
            this.maxShootCooldown = 10;
        } else {
            this.maxShootCooldown = 20;
        }
    }
    
    shoot() {
        if (this.shootCooldown > 0) return;
        
        const angle = Math.atan2(this.game.mouse.y - this.y, this.game.mouse.x - this.x);
        this.game.bullets.push(new Bullet(this.x, this.y, angle, 'player', this.damage, this.game));
        this.shootCooldown = this.maxShootCooldown;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
        }
    }
    
    render(ctx) {
        if (this.dead) return;
        
        // Draw player
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw player border
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw direction indicator
        const angle = Math.atan2(this.game.mouse.y - this.y, this.game.mouse.x - this.x);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(angle) * 30, this.y + Math.sin(angle) * 30);
        ctx.stroke();
        
        // Draw rapid fire indicator
        if (this.rapidFireTime > 0) {
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class Bot {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.radius = 18;
        this.speed = 2;
        this.health = 60;
        this.maxHealth = 60;
        this.dead = false;
        this.color = '#f44336';
        this.shootCooldown = 0;
        this.maxShootCooldown = 60;
        this.damage = 15;
        this.targetAngle = 0;
        this.wanderAngle = Math.random() * Math.PI * 2;
    }
    
    update() {
        if (this.dead) return;
        
        // AI behavior
        const distToPlayer = this.game.getDistance(this.x, this.y, this.game.player.x, this.game.player.y);
        
        if (distToPlayer < 300) {
            // Attack mode - move towards player and shoot
            this.targetAngle = Math.atan2(this.game.player.y - this.y, this.game.player.x - this.x);
            
            // Shoot if in range
            if (distToPlayer < 200 && this.shootCooldown === 0) {
                this.shoot();
            }
        } else {
            // Wander mode
            this.wanderAngle += (Math.random() - 0.5) * 0.3;
            this.targetAngle = this.wanderAngle;
        }
        
        // Move towards target angle
        const dx = Math.cos(this.targetAngle) * this.speed;
        const dy = Math.sin(this.targetAngle) * this.speed;
        
        this.x += dx;
        this.y += dy;
        
        // Keep bot in bounds
        if (this.x < this.radius || this.x > this.game.canvas.width - this.radius) {
            this.targetAngle = Math.PI - this.targetAngle;
        }
        if (this.y < this.radius || this.y > this.game.canvas.height - this.radius) {
            this.targetAngle = -this.targetAngle;
        }
        
        this.x = Math.max(this.radius, Math.min(this.game.canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(this.game.canvas.height - this.radius, this.y));
        
        // Update cooldown
        if (this.shootCooldown > 0) this.shootCooldown--;
    }
    
    shoot() {
        const angle = Math.atan2(this.game.player.y - this.y, this.game.player.x - this.x);
        this.game.bullets.push(new Bullet(this.x, this.y, angle, 'bot', this.damage, this.game));
        this.shootCooldown = this.maxShootCooldown;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
        }
    }
    
    render(ctx) {
        if (this.dead) return;
        
        // Draw bot
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bot border
        ctx.strokeStyle = '#c62828';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw health bar
        if (this.health < this.maxHealth) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(this.x - 20, this.y - this.radius - 10, 40, 4);
            
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(this.x - 20, this.y - this.radius - 10, 40 * (this.health / this.maxHealth), 4);
        }
    }
}

class Bullet {
    constructor(x, y, angle, owner, damage, game) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner;
        this.damage = damage;
        this.game = game;
        this.speed = 8;
        this.radius = 4;
        this.dead = false;
        this.lifetime = 60;
    }
    
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        this.lifetime--;
        
        // Check if bullet is out of bounds or expired
        if (this.x < 0 || this.x > this.game.canvas.width || 
            this.y < 0 || this.y > this.game.canvas.height || 
            this.lifetime <= 0) {
            this.dead = true;
        }
    }
    
    render(ctx) {
        ctx.fillStyle = this.owner === 'player' ? '#ffeb3b' : '#ff9800';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.owner === 'player' ? '#ffeb3b' : '#ff9800';
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class PowerUp {
    constructor(x, y, type, game) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.game = game;
        this.radius = 15;
        this.dead = false;
        this.lifetime = 300;
        this.pulse = 0;
    }
    
    update() {
        this.lifetime--;
        this.pulse += 0.1;
        
        if (this.lifetime <= 0) {
            this.dead = true;
        }
    }
    
    apply(player) {
        switch (this.type) {
            case 'health':
                player.health = Math.min(player.maxHealth, player.health + 30);
                break;
            case 'rapidfire':
                player.rapidFireTime = 300;
                break;
            case 'damage':
                player.damage += 10;
                break;
        }
    }
    
    render(ctx) {
        const scale = 1 + Math.sin(this.pulse) * 0.1;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);
        
        // Draw power-up based on type
        switch (this.type) {
            case 'health':
                ctx.fillStyle = '#4CAF50';
                break;
            case 'rapidfire':
                ctx.fillStyle = '#ff00ff';
                break;
            case 'damage':
                ctx.fillStyle = '#ff5722';
                break;
        }
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw icon
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        switch (this.type) {
            case 'health':
                ctx.fillText('+', 0, 0);
                break;
            case 'rapidfire':
                ctx.fillText('⚡', 0, 0);
                break;
            case 'damage':
                ctx.fillText('!', 0, 0);
                break;
        }
        
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, angle, speed, color) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.color = color;
        this.lifetime = 30;
        this.dead = false;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.lifetime--;
        
        if (this.lifetime <= 0) {
            this.dead = true;
        }
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.lifetime / 30;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new Game();
});
