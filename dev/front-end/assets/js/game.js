class ToasterGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameRunning = false;
        this.gameStartTime = 0;
        this.score = 0;
        this.lives = 5;
        this.maxLives = 5;
        
        // Game objects
        this.toaster = null;
        this.toasts = [];
        this.rainBalls = [];
        this.particles = [];
        
        // Input handling
        this.mousePos = { x: 0, y: 0 };
        this.isShooting = false;
        this.shootDirection = { x: 0, y: 0 };
        
        // Game settings
        this.toasterSpeed = 2;
        this.toastSpeed = 8;
        this.rainSpeed = 3;
        this.rainSpawnRate = 0.02; // Probability per frame
        this.toastSpawnRate = 0.1; // Probability per frame when shooting
        
        // Colors for rain balls - fluorescent colors with labels
        this.rainColors = [
            { color: '#ff6600', label: 'HOT' },    // Orange fluo
            { color: '#ff1493', label: 'COOL' },   // Pink fluo  
            { color: '#ffff00', label: 'COLD' }    // Yellow fluo
        ];
        
        // Assets
        this.toasterImage = null;
        this.toastImage = null;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Load assets
        this.loadAssets();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup game UI
        this.setupGameUI();
    }
    
    resizeCanvas() {
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    loadAssets() {
        // Load toaster SVG
        this.toasterImage = new Image();
        this.toasterImage.onload = () => {
            // Scale toaster to appropriate game size (original is 483x305)
            this.toasterImage.width = 80;
            this.toasterImage.height = 50;
        };
        this.toasterImage.src = 'assets/graphics/toaster.svg';
        
        // Load toast SVG
        this.toastImage = new Image();
        this.toastImage.onload = () => {
            // Scale toast to appropriate game size (original is 47x48)
            this.toastImage.width = 24;
            this.toastImage.height = 24;
        };
        this.toastImage.src = 'assets/graphics/toast.svg';
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.gameRunning) {
                this.isShooting = true;
                this.calculateShootDirection();
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isShooting = false;
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameRunning) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                this.mousePos.x = touch.clientX - rect.left;
                this.mousePos.y = touch.clientY - rect.top;
                this.isShooting = true;
                this.calculateShootDirection();
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.gameRunning) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                this.mousePos.x = touch.clientX - rect.left;
                this.mousePos.y = touch.clientY - rect.top;
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isShooting = false;
        });
        
        // Game over screen buttons
        document.getElementById('restart-game').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('exit-game').addEventListener('click', () => {
            this.exitGame();
        });
    }
    
    setupGameUI() {
        this.updateUI();
    }
    
    calculateShootDirection() {
        if (this.toaster) {
            const dx = this.mousePos.x - this.toaster.x;
            const dy = this.mousePos.y - this.toaster.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            this.shootDirection.x = dx / distance;
            this.shootDirection.y = dy / distance;
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.gameStartTime = Date.now();
        this.score = 0;
        this.lives = this.maxLives;
        
        // Initialize toaster
        this.toaster = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 70,
            width: 80,
            height: 50,
            direction: 1,
            speed: this.toasterSpeed
        };
        
        // Clear arrays
        this.toasts = [];
        this.rainBalls = [];
        this.particles = [];
        
        this.updateUI();
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        const currentTime = Date.now();
        this.score = Math.floor((currentTime - this.gameStartTime) / 1000);
        
        this.updateToaster();
        this.updateToasts();
        this.updateRainBalls();
        this.updateParticles();
        this.checkCollisions();
        this.spawnRainBalls();
        
        if (this.isShooting) {
            this.spawnToasts();
        }
        
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    updateToaster() {
        if (!this.toaster) return;
        
        // Move toaster left and right
        this.toaster.x += this.toaster.direction * this.toaster.speed;
        
        // Bounce off walls
        if (this.toaster.x <= 0 || this.toaster.x >= this.canvas.width - this.toaster.width) {
            this.toaster.direction *= -1;
            this.toaster.x = Math.max(0, Math.min(this.canvas.width - this.toaster.width, this.toaster.x));
        }
        
        // Random direction changes
        if (Math.random() < 0.005) {
            this.toaster.direction *= -1;
        }
    }
    
    updateToasts() {
        for (let i = this.toasts.length - 1; i >= 0; i--) {
            const toast = this.toasts[i];
            toast.x += toast.vx;
            toast.y += toast.vy;
            toast.rotation += toast.rotationSpeed;
            
            // Remove toasts that are off screen
            if (toast.x < 0 || toast.x > this.canvas.width || 
                toast.y < 0 || toast.y > this.canvas.height) {
                this.toasts.splice(i, 1);
            }
        }
    }
    
    updateRainBalls() {
        for (let i = this.rainBalls.length - 1; i >= 0; i--) {
            const ball = this.rainBalls[i];
            ball.y += ball.speed;
            
            // Remove balls that are off screen
            if (ball.y > this.canvas.height) {
                this.rainBalls.splice(i, 1);
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    spawnToasts() {
        if (Math.random() < this.toastSpawnRate && this.toaster) {
            this.toasts.push({
                x: this.toaster.x + this.toaster.width / 2 - 12, // Center the toast
                y: this.toaster.y,
                width: 24,
                height: 24,
                vx: this.shootDirection.x * this.toastSpeed,
                vy: this.shootDirection.y * this.toastSpeed,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.3 + 0.1 // Random spin speed between 0.1 and 0.4
            });
        }
    }
    
    spawnRainBalls() {
        if (Math.random() < this.rainSpawnRate) {
            const colorData = this.rainColors[Math.floor(Math.random() * this.rainColors.length)];
            this.rainBalls.push({
                x: Math.random() * this.canvas.width,
                y: -20,
                radius: 20, // Fixed size for all rain balls - made bigger
                color: colorData.color,
                label: colorData.label,
                speed: Math.random() * 3 + this.rainSpeed
            });
        }
    }
    
    checkCollisions() {
        // Check toaster vs rain balls
        if (this.toaster) {
            for (let i = this.rainBalls.length - 1; i >= 0; i--) {
                const ball = this.rainBalls[i];
                if (this.circleRectCollision(ball, this.toaster)) {
                    this.lives--;
                    this.createParticles(ball.x, ball.y, ball.color);
                    this.rainBalls.splice(i, 1);
                }
            }
        }
        
        // Check toasts vs rain balls
        for (let i = this.toasts.length - 1; i >= 0; i--) {
            const toast = this.toasts[i];
            for (let j = this.rainBalls.length - 1; j >= 0; j--) {
                const ball = this.rainBalls[j];
                if (this.circleRectCollision(ball, toast)) {
                    this.createParticles(ball.x, ball.y, ball.color);
                    this.toasts.splice(i, 1);
                    this.rainBalls.splice(j, 1);
                    break;
                }
            }
        }
    }
    
    circleRectCollision(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        
        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        
        return (distanceX * distanceX + distanceY * distanceY) < (circle.radius * circle.radius);
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: color,
                life: 30
            });
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#efca52';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw toaster
        if (this.toaster && this.toasterImage.complete) {
            this.ctx.drawImage(this.toasterImage, this.toaster.x, this.toaster.y, this.toaster.width, this.toaster.height);
        } else if (this.toaster) {
            // Fallback rectangle if image not loaded yet
            this.ctx.fillStyle = '#2D2218';
            this.ctx.fillRect(this.toaster.x, this.toaster.y, this.toaster.width, this.toaster.height);
        }
        
        // Draw toasts
        for (const toast of this.toasts) {
            this.ctx.save();
            
            // Move to toast center for rotation
            this.ctx.translate(toast.x + toast.width / 2, toast.y + toast.height / 2);
            this.ctx.rotate(toast.rotation);
            
            if (this.toastImage.complete) {
                this.ctx.drawImage(this.toastImage, -toast.width / 2, -toast.height / 2, toast.width, toast.height);
            } else {
                // Fallback rectangle if image not loaded yet
                this.ctx.fillStyle = '#D4A574';
                this.ctx.fillRect(-toast.width / 2, -toast.height / 2, toast.width, toast.height);
            }
            
            this.ctx.restore();
        }
        
        // Draw rain balls
        for (const ball of this.rainBalls) {
            // Draw the ball
            this.ctx.fillStyle = ball.color;
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw the label
            this.ctx.fillStyle = '#2D2218';
            this.ctx.font = 'bold 12px FKRasterGrotesk';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(ball.label, ball.x, ball.y);
        }
        
        // Draw particles
        for (const particle of this.particles) {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.fillRect(particle.x, particle.y, 4, 4);
            this.ctx.globalAlpha = 1;
        }
        
        // Draw crosshair when shooting
        if (this.isShooting && this.toaster) {
            this.ctx.strokeStyle = '#2D2218';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.mousePos.x - 10, this.mousePos.y);
            this.ctx.lineTo(this.mousePos.x + 10, this.mousePos.y);
            this.ctx.moveTo(this.mousePos.x, this.mousePos.y - 10);
            this.ctx.lineTo(this.mousePos.x, this.mousePos.y + 10);
            this.ctx.stroke();
        }
    }
    
    updateUI() {
        document.getElementById('score-value').textContent = this.score;
        document.getElementById('lives-value').textContent = this.lives;
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }
    
    restartGame() {
        document.getElementById('game-over-screen').classList.add('hidden');
        this.startGame();
    }
    
    exitGame() {
        this.gameRunning = false;
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('game-overlay').classList.add('hidden');
        document.querySelector('.main-content').classList.remove('fade-out');
    }
}

// Game activation system
class GameActivator {
    constructor() {
        this.clickCount = 0;
        this.clickTimeout = null;
        this.clickWindow = 2000; // 2 seconds window for 10 clicks
        this.game = null;
        
        this.init();
    }
    
    init() {
        const modelContainer = document.getElementById('model-container');
        if (modelContainer) {
            modelContainer.addEventListener('click', (e) => {
                this.handleClick(e);
            });
        }
    }
    
    handleClick(e) {
        e.preventDefault();
        
        this.clickCount++;
        
        // Clear existing timeout
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
        }
        
        // If we've reached 10 clicks, activate the game
        if (this.clickCount >= 10) {
            this.activateGame();
            return;
        }
        
        // Set timeout to reset click count
        this.clickTimeout = setTimeout(() => {
            this.clickCount = 0;
        }, this.clickWindow);
    }
    
    activateGame() {
        this.clickCount = 0;
        
        // Fade out main content
        const mainContent = document.querySelector('.main-content');
        mainContent.classList.add('fade-out');
        
        // Show game overlay after fade
        setTimeout(() => {
            const gameOverlay = document.getElementById('game-overlay');
            gameOverlay.classList.remove('hidden');
            
            // Initialize and start game
            if (!this.game) {
                this.game = new ToasterGame();
            }
            this.game.startGame();
        }, 1000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GameActivator();
});
