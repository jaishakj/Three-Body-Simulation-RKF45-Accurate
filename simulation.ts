// --- Vector Math ---
class Vec2 {
    constructor(public x: number, public y: number) {}
    add(v: Vec2): Vec2 { return new Vec2(this.x + v.x, this.y + v.y); }
    sub(v: Vec2): Vec2 { return new Vec2(this.x - v.x, this.y - v.y); }
    scale(s: number): Vec2 { return new Vec2(this.x * s, this.y * s); }
    mag(): number { return Math.sqrt(this.x * this.x + this.y * this.y); }
}

// --- Physics Types ---
const G = 1;
const SOFTENING = 0.1; // Slightly increased for user-created chaotic mergers

interface Body {
    id: number;
    mass: number;
    pos: Vec2;
    vel: Vec2;
    color: string;
    trail: Vec2[];
}

type StateVector = number[];

class Simulation {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    bodies: Body[] = [];
    
    // Simulation Config
    dt: number = 0.015;
    scale: number = 150;
    offsetX: number = 0;
    offsetY: number = 0;
    paused: boolean = false;
    
    // Interaction State
    isDragging: boolean = false;
    dragStart: Vec2 | null = null;
    dragCurrent: Vec2 | null = null;

    constructor() {
        this.canvas = document.getElementById('simCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.setupInputs();
        this.loadScenario('figure8');
        
        this.loop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
    }

    // --- Interaction & Inputs ---
    setupInputs() {
        // Buttons
        document.getElementById('btn-fig8')?.addEventListener('click', () => this.loadScenario('figure8'));
        document.getElementById('btn-pyth')?.addEventListener('click', () => this.loadScenario('pythagorean'));
        document.getElementById('btn-random')?.addEventListener('click', () => this.loadScenario('random'));
        document.getElementById('btn-solar')?.addEventListener('click', () => this.loadScenario('solar'));
        document.getElementById('btn-clear')?.addEventListener('click', () => { this.bodies = []; });
        document.getElementById('btn-pause')?.addEventListener('click', () => { this.paused = !this.paused; });

        // Mouse Slingshot
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStart = this.screenToWorld(e.clientX, e.clientY);
            this.dragCurrent = this.dragStart;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.dragCurrent = this.screenToWorld(e.clientX, e.clientY);
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (this.isDragging && this.dragStart && this.dragCurrent) {
                // Velocity is vector from current mouse to start (pull back like slingshot)
                const pullVector = this.dragStart.sub(this.dragCurrent);
                const launchVel = pullVector.scale(2.0); // Multiplier to make it feel snappy
                
                this.addBody(this.dragStart, launchVel, Math.random() * 0.5 + 0.5);
            }
            this.isDragging = false;
            this.dragStart = null;
            this.dragCurrent = null;
        });
    }

    screenToWorld(sx: number, sy: number): Vec2 {
        return new Vec2(
            (sx - this.offsetX) / this.scale,
            (sy - this.offsetY) / this.scale
        );
    }

    worldToScreen(v: Vec2): Vec2 {
        return new Vec2(
            this.offsetX + v.x * this.scale,
            this.offsetY + v.y * this.scale
        );
    }

    addBody(pos: Vec2, vel: Vec2, mass: number) {
        const hue = Math.floor(Math.random() * 360);
        this.bodies.push({
            id: Date.now() + Math.random(),
            mass: mass,
            pos: pos,
            vel: vel,
            color: `hsl(${hue}, 70%, 60%)`,
            trail: []
        });
    }

    loadScenario(type: string) {
        this.bodies = [];
        this.paused = false;

        if (type === 'figure8') {
            // Chenciner & Montgomery
            this.scale = 250;
            const p1 = new Vec2(0.97000436, -0.24308753);
            const v1 = new Vec2(0.4662036850, 0.4323657300);
            const v3 = new Vec2(-2 * v1.x, -2 * v1.y);
            
            this.bodies.push({ mass: 1, pos: p1, vel: v3.scale(-0.5), color: '#FF4136', trail: [], id: 1 });
            this.bodies.push({ mass: 1, pos: p1.scale(-1), vel: v3.scale(-0.5), color: '#2ECC40', trail: [], id: 2 });
            this.bodies.push({ mass: 1, pos: new Vec2(0,0), vel: v3, color: '#0074D9', trail: [], id: 3 });
        }
        else if (type === 'pythagorean') {
            // Burrau's Problem: 3-4-5 Triangle, zero initial velocity
            this.scale = 80;
            // Vertices of 3-4-5 triangle
            this.bodies.push({ mass: 3, pos: new Vec2(1, 3), vel: new Vec2(0,0), color: '#FF851B', trail: [], id: 1 });
            this.bodies.push({ mass: 4, pos: new Vec2(-2, -1), vel: new Vec2(0,0), color: '#B10DC9', trail: [], id: 2 });
            this.bodies.push({ mass: 5, pos: new Vec2(1, -1), vel: new Vec2(0,0), color: '#001f3f', trail: [], id: 3 });
        }
        else if (type === 'random') {
            this.scale = 150;
            for(let i=0; i<5; i++) {
                const pos = new Vec2((Math.random()-0.5)*4, (Math.random()-0.5)*4);
                const vel = new Vec2((Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5);
                this.addBody(pos, vel, Math.random() + 0.5);
            }
        }
        else if (type === 'solar') {
            this.scale = 100;
            // Star
            this.bodies.push({ mass: 10, pos: new Vec2(0,0), vel: new Vec2(0,0), color: '#FFDC00', trail: [], id: 1 });
            // Planet 1
            this.bodies.push({ mass: 1, pos: new Vec2(3,0), vel: new Vec2(0, 1.8), color: '#39CCCC', trail: [], id: 2 });
            // Planet 2
            this.bodies.push({ mass: 2, pos: new Vec2(5,0), vel: new Vec2(0, 1.4), color: '#F012BE', trail: [], id: 3 });
        }
    }

    // --- RK4 Core ---
    // (Kept largely the same, but optimized for dynamic arrays)
    getDerivatives(state: StateVector): StateVector {
        const numBodies = this.bodies.length;
        const derivs = new Float64Array(state.length); 
        // Using TypedArray for slight perf boost in heavy calc
        
        for (let i = 0; i < numBodies; i++) {
            const iIdx = i * 4;
            derivs[iIdx] = state[iIdx + 2];     
            derivs[iIdx + 1] = state[iIdx + 3]; 
            
            let ax = 0, ay = 0;
            
            for (let j = 0; j < numBodies; j++) {
                if (i === j) continue;
                const jIdx = j * 4;
                
                const dx = state[jIdx] - state[iIdx];
                const dy = state[jIdx + 1] - state[iIdx + 1];
                const distSq = dx*dx + dy*dy;
                const dist = Math.sqrt(distSq);
                
                const f = (G * this.bodies[j].mass) / (Math.pow(distSq + SOFTENING, 1.5));
                ax += f * dx;
                ay += f * dy;
            }
            derivs[iIdx + 2] = ax;
            derivs[iIdx + 3] = ay;
        }
        return Array.from(derivs);
    }

    integrate(dt: number) {
        if (this.bodies.length === 0) return;

        const state: StateVector = [];
        this.bodies.forEach(b => state.push(b.pos.x, b.pos.y, b.vel.x, b.vel.y));

        const k1 = this.getDerivatives(state);
        const stateK2 = state.map((v, i) => v + k1[i] * dt * 0.5);
        const k2 = this.getDerivatives(stateK2);
        const stateK3 = state.map((v, i) => v + k2[i] * dt * 0.5);
        const k3 = this.getDerivatives(stateK3);
        const stateK4 = state.map((v, i) => v + k3[i] * dt);
        const k4 = this.getDerivatives(stateK4);

        for (let i = 0; i < state.length; i++) {
            state[i] += (dt / 6.0) * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]);
        }

        this.bodies.forEach((b, i) => {
            const iIdx = i * 4;
            b.pos.x = state[iIdx];
            b.pos.y = state[iIdx + 1];
            b.vel.x = state[iIdx + 2];
            b.vel.y = state[iIdx + 3];

            if (!this.paused) {
                if (b.trail.length === 0 || 
                    b.pos.sub(b.trail[b.trail.length-1]).mag() > 0.05) {
                    b.trail.push(new Vec2(b.pos.x, b.pos.y));
                    if (b.trail.length > 150) b.trail.shift();
                }
            }
        });
    }

    // --- Rendering ---
    draw() {
        this.ctx.fillStyle = 'rgba(11, 12, 16, 0.3)'; // Trail fade
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Update Stats
        document.getElementById('body-count')!.innerText = this.bodies.length.toString();

        // Draw Trails & Bodies
        this.bodies.forEach(b => {
            // Trail
            if (b.trail.length > 1) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = b.color;
                this.ctx.lineWidth = 1;
                const start = this.worldToScreen(b.trail[0]);
                this.ctx.moveTo(start.x, start.y);
                for (let i = 1; i < b.trail.length; i++) {
                    const p = this.worldToScreen(b.trail[i]);
                    this.ctx.lineTo(p.x, p.y);
                }
                this.ctx.stroke();
            }

            // Body
            const sPos = this.worldToScreen(b.pos);
            const radius = Math.max(3, Math.sqrt(b.mass) * 4);
            
            this.ctx.beginPath();
            this.ctx.arc(sPos.x, sPos.y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = b.color;
            this.ctx.fill();
            
            // Glow
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = b.color;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        });

        // Draw Slingshot Line
        if (this.isDragging && this.dragStart && this.dragCurrent) {
            const start = this.worldToScreen(this.dragStart);
            const current = this.worldToScreen(this.dragCurrent);
            
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(current.x, current.y);
            this.ctx.strokeStyle = 'white';
            this.ctx.setLineDash([5, 5]);
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // Draw ghost body at start
            this.ctx.beginPath();
            this.ctx.arc(start.x, start.y, 6, 0, Math.PI*2);
            this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
            this.ctx.fill();
        }
    }

    loop() {
        if (!this.paused) {
            // Higher iterations = smoother physics but more CPU
            for(let i=0; i<4; i++) this.integrate(this.dt);
        }
        this.draw();
        
        // Simple FPS calculation
        const now = performance.now();
        // (FPS logic could go here)
        
        requestAnimationFrame(() => this.loop());
    }
}

// Boot
new Simulation();
