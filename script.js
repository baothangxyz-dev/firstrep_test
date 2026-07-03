const SoundEffects = {
    ctx: null,
    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.ctx = null;
        }
    },
    playEat() {
        if (!this.ctx) return;
        try {
            let osc = this.ctx.createOscillator();
            let gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.1);
        } catch (e) {}
    },
    playGameOver() {
        if (!this.ctx) return;
        try {
            let osc = this.ctx.createOscillator();
            let gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.4);
        } catch (e) {}
    }
};

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 4;
        this.speedY = (Math.random() - 0.5) * 4;
        this.alpha = 1;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= 0.04;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Food {
    constructor(gridSize, canvasSize) {
        this.gridSize = gridSize;
        this.canvasSize = canvasSize;
        this.x = 0;
        this.y = 0;
        this.isSpecial = false;
    }

    randomizePosition(snakeBody, obstacles = []) {
        const maxPos = (this.canvasSize / this.gridSize) - 1;
        let valid = false;

        while (!valid) {
            this.x = Math.floor(Math.random() * maxPos) * this.gridSize;
            this.y = Math.floor(Math.random() * maxPos) * this.gridSize;
            
            valid = !snakeBody.some(segment => segment.x === this.x && segment.y === this.y) &&
                    !obstacles.some(obs => obs.x === this.x && obs.y === this.y);
        }
        this.isSpecial = Math.random() < 0.2;
    }

    draw(ctx) {
        ctx.save();
        const centerX = this.x + this.gridSize / 2;
        const centerY = this.y + this.gridSize / 2;
        const baseRadius = this.gridSize / 2 - 2;
        
        if (this.isSpecial) {
            // Special food with pulsing animation and star shape
            const pulse = Math.sin(ctx.canvas.game?.animationTime * 0.05 || 0) * 0.3 + 0.7;
            const radius = baseRadius * pulse;
            
            // Radial gradient for special food
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, "#ffff66");
            gradient.addColorStop(0.7, "#ffdf00");
            gradient.addColorStop(1, "#ff9500");
            
            ctx.fillStyle = gradient;
            ctx.shadowBlur = 25;
            ctx.shadowColor = "#ffdf00";
            
            // Draw star
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const angle = (i * Math.PI) / 5 - Math.PI / 2;
                const dist = i % 2 === 0 ? radius : radius * 0.6;
                const px = centerX + Math.cos(angle) * dist;
                const py = centerY + Math.sin(angle) * dist;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            // Regular food with pulsing animation
            const pulse = Math.sin(ctx.canvas.game?.animationTime * 0.08 || 0) * 0.2 + 0.8;
            const radius = baseRadius * pulse;
            
            // Radial gradient for regular food
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, "#ff7777");
            gradient.addColorStop(0.6, "#ff4a4a");
            gradient.addColorStop(1, "#cc0000");
            
            ctx.fillStyle = gradient;
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#ff4a4a";
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class Snake {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.reset();
    }

    reset() {
        this.body = [
            { x: 5 * this.gridSize, y: 5 * this.gridSize },
            { x: 4 * this.gridSize, y: 5 * this.gridSize },
            { x: 3 * this.gridSize, y: 5 * this.gridSize }
        ];
        this.dx = this.gridSize;
        this.dy = 0;
        this.nextDx = this.dx;
        this.nextDy = this.dy;
    }

    changeDirection(key) {
        if ((key === 'ArrowUp' || key === 'w' || key === 'W') && this.dy === 0) { this.nextDx = 0; this.nextDy = -this.gridSize; }
        if ((key === 'ArrowDown' || key === 's' || key === 'S') && this.dy === 0) { this.nextDx = 0; this.nextDy = this.gridSize; }
        if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && this.dx === 0) { this.nextDx = -this.gridSize; this.nextDy = 0; }
        if ((key === 'ArrowRight' || key === 'd' || key === 'D') && this.dx === 0) { this.nextDx = this.gridSize; this.nextDy = 0; }
    }

    update(level, canvasSize) {
        this.dx = this.nextDx;
        this.dy = this.nextDy;

        let headX = this.body[0].x + this.dx;
        let headY = this.body[0].y + this.dy;

        this.body.unshift({ x: headX, y: headY });
    }

    popTail() {
        return this.body.pop();
    }

    checkSelfCollision() {
        const head = this.body[0];
        for (let i = 1; i < this.body.length; i++) {
            if (this.body[i].x === head.x && this.body[i].y === head.y) {
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        this.body.forEach((segment, index) => {
            if (index === 0) {
                // Head with gradient
                const gradient = ctx.createLinearGradient(segment.x, segment.y, segment.x + this.gridSize, segment.y + this.gridSize);
                gradient.addColorStop(0, "#00f2fe");
                gradient.addColorStop(1, "#0099cc");
                ctx.fillStyle = gradient;
                ctx.shadowBlur = 20;
                ctx.shadowColor = "#00f2fe";
                ctx.fillRect(segment.x + 1, segment.y + 1, this.gridSize - 2, this.gridSize - 2);
                
                // Draw eyes
                ctx.fillStyle = "#000";
                ctx.shadowBlur = 0;
                const eyeSize = 4;
                const eyeOffset = 6;
                ctx.fillRect(segment.x + eyeOffset, segment.y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(segment.x + this.gridSize - eyeOffset - eyeSize, segment.y + eyeOffset, eyeSize, eyeSize);
            } else {
                // Body segments with gradient
                const gradient = ctx.createLinearGradient(segment.x, segment.y, segment.x + this.gridSize, segment.y + this.gridSize);
                gradient.addColorStop(0, "#4facfe");
                gradient.addColorStop(1, "#2980b9");
                ctx.fillStyle = gradient;
                ctx.shadowBlur = 8;
                ctx.shadowColor = "rgba(79, 172, 254, 0.6)";
                ctx.fillRect(segment.x + 1, segment.y + 1, this.gridSize - 2, this.gridSize - 2);
            }
        });
        ctx.restore();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.gridSize = 25;

        this.snake = new Snake(this.gridSize);
        this.food = new Food(this.gridSize, this.canvas.width);
        
        this.level = 1;
        this.score = 0;
        this.highScore = 0;
        this.animationTime = 0;
        
        try {
            const saved = localStorage.getItem("snake_high_score");
            this.highScore = saved ? parseInt(saved) : 0;
        } catch (e) {
            this.highScore = 0;
        }
        
        this.obstacles = [];
        this.particles = [];
        this.gameInterval = null;
        this.isGameOver = false;

        this.initDOMEvents();
        this.updateHUD();
    }

    initDOMEvents() {
        document.querySelectorAll(".level-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                this.level = parseInt(e.target.getAttribute("data-level"));
            });
        });

        document.querySelectorAll(".level-btn-gameover").forEach(btn => {
            btn.addEventListener("click", (e) => {
                this.level = parseInt(e.target.getAttribute("data-level"));
                document.querySelectorAll(".level-btn").forEach(b => {
                    if (b.getAttribute("data-level") === e.target.getAttribute("data-level")) {
                        b.classList.add("active");
                    } else {
                        b.classList.remove("active");
                    }
                });
                this.startGame();
            });
        });

        document.getElementById("start-btn").addEventListener("click", () => {
            SoundEffects.init();
            this.startGame();
        });
        document.getElementById("restart-btn").addEventListener("click", () => this.startGame());

        document.getElementById("menu-btn").addEventListener("click", () => {
            document.getElementById("main-menu").classList.remove("hidden");
            document.getElementById("game-over-screen").classList.add("hidden");
            document.getElementById("game-screen").classList.add("hidden");
            if (this.gameInterval) clearInterval(this.gameInterval);
        });

        window.addEventListener("keydown", (e) => this.snake.changeDirection(e.key));
    }

    generateObstacles() {
        this.obstacles = [];
        if (this.level === 3) {
            const mid = this.canvas.width / 2;
            const offset = 4 * this.gridSize;
            
            this.obstacles = [
                {x: mid - offset, y: mid - offset}, {x: mid - offset + this.gridSize, y: mid - offset},
                {x: mid + offset, y: mid - offset}, {x: mid + offset - this.gridSize, y: mid - offset},
                {x: mid - offset, y: mid + offset}, {x: mid - offset + this.gridSize, y: mid + offset},
                {x: mid + offset, y: mid + offset}, {x: mid + offset - this.gridSize, y: mid + offset}
            ];
        }
    }

    startGame() {
        this.score = 0;
        this.isGameOver = false;
        this.particles = [];
        this.snake.reset();
        this.generateObstacles();
        this.food.randomizePosition(this.snake.body, this.obstacles);
        
        document.getElementById("main-menu").classList.add("hidden");
        document.getElementById("game-over-screen").classList.add("hidden");
        document.getElementById("game-screen").classList.remove("hidden");

        this.updateHUD();

        const speed = this.level === 1 ? 130 : (this.level === 2 ? 100 : 80);
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.gameLoop(), speed);
    }

    gameLoop() {
        if (this.isGameOver) return;

        this.animationTime++;
        this.snake.update(this.level, this.canvas.width);
        this.checkCollisions();
        this.updateParticles();
        this.draw();
    }

    checkCollisions() {
        const head = this.snake.body[0];

        if (head.x < 0 || head.x >= this.canvas.width || head.y < 0 || head.y >= this.canvas.height) {
            this.triggerGameOver();
            return;
        }

        if (this.snake.checkSelfCollision()) {
            this.triggerGameOver();
            return;
        }

        if (this.level === 3) {
            const hitObstacle = this.obstacles.some(obs => obs.x === head.x && obs.y === head.y);
            if (hitObstacle) {
                this.triggerGameOver();
                return;
            }
        }

        if (head.x === this.food.x && head.y === this.food.y) {
            SoundEffects.playEat();
            this.score += this.food.isSpecial ? 3 : 1;
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                try {
                    localStorage.setItem("snake_high_score", this.highScore);
                } catch (e) {}
            }

            this.createParticles(head.x + this.gridSize / 2, head.y + this.gridSize / 2, this.food.isSpecial ? "#ffdf00" : "#ff4a4a");
            this.food.randomizePosition(this.snake.body, this.obstacles);
            this.updateHUD();
        } else {
            this.snake.popTail();
        }
    }

    triggerGameOver() {
        this.isGameOver = true;
        SoundEffects.playGameOver();
        if (this.gameInterval) clearInterval(this.gameInterval);
        document.getElementById("game-over-screen").classList.remove("hidden");
        this.updateHUD();
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    updateParticles() {
        this.particles = this.particles.filter(p => p.alpha > 0);
        this.particles.forEach(p => p.update());
    }

    updateHUD() {
        document.getElementById("score").textContent = this.score;
        document.getElementById("high-score").textContent = this.highScore;
        document.getElementById("level-display").textContent = this.level;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.level === 3) {
            this.ctx.save();
            this.ctx.fillStyle = "#8b0000";
            this.obstacles.forEach(obs => {
                this.ctx.fillRect(obs.x + 1, obs.y + 1, this.gridSize - 2, this.gridSize - 2);
            });
            this.ctx.restore();
        }

        this.ctx.canvas.game = this;
        this.food.draw(this.ctx);
        this.snake.draw(this.ctx);
        this.particles.forEach(p => p.draw(this.ctx));
    }
}

const game = new Game();

