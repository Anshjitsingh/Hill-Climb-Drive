const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let W, H;

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

/* =========================
   SALVATAGGIO
========================= */

let save = JSON.parse(localStorage.getItem("hillDriveSave")) || {
    coins: 0,
    totalDistance: 0,
    world: "day",
    volume: 50,
    particles: true
};

function saveGame() {
    localStorage.setItem("hillDriveSave", JSON.stringify(save));
    document.getElementById("menuCoins").textContent = save.coins;
}

function updateMenuCoins() {
    document.getElementById("menuCoins").textContent = save.coins;
}

updateMenuCoins();

/* =========================
   MENU
========================= */

const menu = document.getElementById("menu");
const worldMenu = document.getElementById("worldMenu");
const settingsMenu = document.getElementById("settingsMenu");
const loading = document.getElementById("loading");
const game = document.getElementById("game");

document.getElementById("startBtn").onclick = startLoading;

document.getElementById("worldBtn").onclick = () => {
    menu.classList.add("hidden");
    worldMenu.classList.remove("hidden");
};

document.getElementById("settingsBtn").onclick = () => {
    menu.classList.add("hidden");
    settingsMenu.classList.remove("hidden");
};

document.getElementById("worldBack").onclick = () => {
    worldMenu.classList.add("hidden");
    menu.classList.remove("hidden");
};

document.getElementById("settingsBack").onclick = () => {
    settingsMenu.classList.add("hidden");
    menu.classList.remove("hidden");
};

document.querySelectorAll(".world-choice").forEach(button => {
    button.onclick = () => {
        save.world = button.dataset.world;
        saveGame();

        worldMenu.classList.add("hidden");
        menu.classList.remove("hidden");
    };
});

document.getElementById("volume").value = save.volume;

document.getElementById("volume").oninput = e => {
    save.volume = Number(e.target.value);
    saveGame();
};

document.getElementById("particles").checked = save.particles;

document.getElementById("particles").onchange = e => {
    save.particles = e.target.checked;
    saveGame();
};

document.getElementById("resetSave").onclick = () => {
    if (confirm("Vuoi cancellare tutti i progressi?")) {
        localStorage.removeItem("hillDriveSave");

        save = {
            coins: 0,
            totalDistance: 0,
            world: "day",
            volume: 50,
            particles: true
        };

        updateMenuCoins();
        document.getElementById("volume").value = 50;
        document.getElementById("particles").checked = true;
    }
};

/* =========================
   LOADING
========================= */

function startLoading() {
    menu.classList.add("hidden");
    loading.classList.remove("hidden");

    let progress = 0;

    const interval = setInterval(() => {
        progress += 3;

        document.getElementById("loadingProgress").style.width =
            progress + "%";

        if (progress >= 100) {
            clearInterval(interval);

            setTimeout(() => {
                loading.classList.add("hidden");
                game.classList.remove("hidden");
                startGame();
            }, 300);
        }
    }, 35);
}

/* =========================
   MONDO
========================= */

const worlds = {
    day: {
        name: "☀️ Giorno",
        sky: "#65c7f7",
        ground: "#6ab04c",
        hill: "#386b2f"
    },

    night: {
        name: "🌙 Notte",
        sky: "#111a3a",
        ground: "#273d25",
        hill: "#172817"
    },

    evening: {
        name: "🌅 Sera",
        sky: "#ed765e",
        ground: "#638c43",
        hill: "#435d30"
    },

    spring: {
        name: "🌸 Primavera",
        sky: "#83d8f5",
        ground: "#62b84c",
        hill: "#39802d"
    },

    summer: {
        name: "☀️ Estate",
        sky: "#45b8ed",
        ground: "#83bd3f",
        hill: "#54832c"
    },

    winter: {
        name: "❄️ Inverno",
        sky: "#b9d7e8",
        ground: "#e9f4f7",
        hill: "#bdd0d6"
    }
};

/* =========================
   GAME
========================= */

let playing = false;
let paused = false;

let car = {
    x: 180,
    y: 300,
    vx: 0,
    vy: 0,
    angle: 0,
    wheelRotation: 0
};

let cameraX = 0;
let terrain = [];
let objects = [];

let fuel = 100;
let distance = 0;
let speed = 0;

let keys = {
    left: false,
    right: false,
    brake: false
};

let lastTime = 0;

/* =========================
   TERRENO INFINITO
========================= */

function generateTerrainUntil(targetX) {

    let last = terrain[terrain.length - 1];

    if (!last) {
        terrain.push({
            x: -500,
            y: H * .72
        });

        last = terrain[terrain.length - 1];
    }

    while (last.x < targetX) {

        const nextX = last.x + 60;

        const wave =
            Math.sin(nextX * 0.008) * 55 +
            Math.sin(nextX * 0.021) * 25;

        const random = (Math.random() - .5) * 25;

        let nextY = H * .68 + wave + random;

        nextY = Math.max(H * .45, Math.min(H * .82, nextY));

        terrain.push({
            x: nextX,
            y: nextY
        });

        last = terrain[terrain.length - 1];

        if (Math.random() < .12) {
            objects.push({
                type: "coin",
                x: nextX,
                y: nextY - 70,
                collected: false
            });
        }

        if (Math.random() < .025) {
            objects.push({
                type: "fuel",
                x: nextX,
                y: nextY - 65,
                collected: false
            });
        }
    }
}

generateTerrainUntil(5000);

/* =========================
   TERRAIN HEIGHT
========================= */

function getGroundY(x) {

    for (let i = 0; i < terrain.length - 1; i++) {

        if (
            x >= terrain[i].x &&
            x <= terrain[i + 1].x
        ) {

            const a = terrain[i];
            const b = terrain[i + 1];

            const t =
                (x - a.x) /
                (b.x - a.x);

            return a.y + (b.y - a.y) * t;
        }
    }

    return H * .7;
}

/* =========================
   START
========================= */

function startGame() {

    playing = true;
    paused = false;

    fuel = 100;
    distance = 0;

    car.x = 180;
    car.y = getGroundY(car.x) - 45;

    car.vx = 0;
    car.vy = 0;
    car.angle = 0;

    cameraX = 0;

    terrain = [];
    objects = [];

    generateTerrainUntil(6000);

    document.getElementById("pauseMenu").classList.add("hidden");
    document.getElementById("gameOver").classList.add("hidden");

    updateWorldName();

    requestAnimationFrame(gameLoop);
}

/* =========================
   WORLD NAME
========================= */

function updateWorldName() {
    document.getElementById("worldName").textContent =
        worlds[save.world].name;
}

/* =========================
   UPDATE
========================= */

function update(dt) {

    if (!playing || paused) return;

    const acceleration = 0.00045 * dt;
    const gravity = 0.0012 * dt;

    if (keys.right) {
        car.vx += acceleration * 3;
    }

    if (keys.left) {
        car.vx -= acceleration * 1.5;
        car.angle -= 0.003 * dt;
    }

    if (keys.brake) {
        car.vx *= 0.97;
    }

    car.vx *= 0.995;

    car.vy += gravity;

    car.x += car.vx * dt;
    car.y += car.vy * dt;

    /* terreno */

    const ground = getGroundY(car.x);

    if (car.y + 38 >= ground) {

        car.y = ground - 38;

        car.vy = 0;

        car.angle =
            Math.atan2(
                getGroundY(car.x + 10) -
                getGroundY(car.x - 10),
                20
            );

        if (car.vx > 0) {
            car.vx += 0.0001 * dt;
        }
    }

    if (car.x < 100) {
        car.x = 100;
        car.vx = 0;
    }

    /* carburante */

    fuel -= Math.abs(car.vx) * dt * 0.002;

    fuel = Math.max(0, fuel);

    /* distanza */

    distance = Math.max(
        distance,
        Math.floor((car.x - 180) / 10)
    );

    /* genera nuovo mondo */

    generateTerrainUntil(car.x + 3000);

    /* oggetti */

    objects.forEach(obj => {

        if (obj.collected) return;

        const dx = obj.x - car.x;
        const dy = obj.y - car.y;

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 50) {

            obj.collected = true;

            if (obj.type === "coin") {
                save.coins++;
            }

            if (obj.type === "fuel") {
                fuel = Math.min(100, fuel + 30);
            }

            saveGame();
        }
    });

    /* elimina roba vecchia */

    objects = objects.filter(
        obj => obj.x > car.x - 1000
    );

    terrain = terrain.filter(
        point => point.x > car.x - 1200
    );

    /* HUD */

    document.getElementById("coins").textContent =
        save.coins;

    document.getElementById("fuel").textContent =
        Math.floor(fuel);

    document.getElementById("distance").textContent =
        distance;

    /* carburante finito */

    if (fuel <= 0) {
        endGame();
    }
}

/* =========================
   DRAW
========================= */

function draw() {

    const world = worlds[save.world];

    ctx.clearRect(0, 0, W, H);

    /* cielo */

    ctx.fillStyle = world.sky;
    ctx.fillRect(0, 0, W, H);

    drawBackground(world);

    cameraX = car.x - W * .3;

    drawTerrain(world);
    drawObjects();

    drawCar();

    if (save.particles) {
        drawParticles();
    }
}

/* =========================
   BACKGROUND
========================= */

function drawBackground(world) {

    ctx.fillStyle = world.hill;

    for (let i = 0; i < 8; i++) {

        const x =
            -((cameraX * .15) % 500) +
            i * 500;

        ctx.beginPath();

        ctx.moveTo(x, H * .7);

        ctx.quadraticCurveTo(
            x + 180,
            H * .45,
            x + 350,
            H * .7
        );

        ctx.lineTo(x + 500, H);
        ctx.lineTo(x, H);

        ctx.fill();
    }

    if (save.world === "night") {

        ctx.fillStyle = "#fff";

        for (let i = 0; i < 80; i++) {

            const x =
                (i * 137) % W;

            const y =
                (i * 71) % (H * .5);

            ctx.fillRect(x, y, 2, 2);
        }
    }
}

/* =========================
   TERRAIN DRAW
========================= */

function drawTerrain(world) {

    if (terrain.length < 2) return;

    ctx.beginPath();

    ctx.moveTo(
        terrain[0].x - cameraX,
        terrain[0].y
    );

    for (let i = 1; i < terrain.length; i++) {

        ctx.lineTo(
            terrain[i].x - cameraX,
            terrain[i].y
        );
    }

    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();

    ctx.fillStyle = world.ground;
    ctx.fill();

    /* linea superiore */

    ctx.beginPath();

    ctx.moveTo(
        terrain[0].x - cameraX,
        terrain[0].y
    );

    for (let i = 1; i < terrain.length; i++) {

        ctx.lineTo(
            terrain[i].x - cameraX,
            terrain[i].y
        );
    }

    ctx.strokeStyle =
        save.world === "winter"
            ? "#ffffff"
            : "#28551f";

    ctx.lineWidth = 6;
    ctx.stroke();
}

/* =========================
   OGGETTI
========================= */

function drawObjects() {

    objects.forEach(obj => {

        if (obj.collected) return;

        const x = obj.x - cameraX;
        const y = obj.y;

        if (x < -100 || x > W + 100) return;

        if (obj.type === "coin") {

            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);

            ctx.fillStyle = "#ffd700";
            ctx.fill();

            ctx.strokeStyle = "#ff9d00";
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = "#fff3a0";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.fillText("$", x, y + 5);
        }

        if (obj.type === "fuel") {

            ctx.fillStyle = "#e53935";
            ctx.fillRect(x - 13, y - 18, 26, 36);

            ctx.fillStyle = "white";
            ctx.font = "bold 15px Arial";
            ctx.textAlign = "center";
            ctx.fillText("F", x, y + 5);
        }
    });
}

/* =========================
   MACCHINA
========================= */

function drawCar() {

    const x = car.x - cameraX;
    const y = car.y;

    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(car.angle);

    /* ombra */

    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath();
    ctx.ellipse(0, 40, 48, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    /* corpo */

    ctx.fillStyle = "#e53935";

    ctx.beginPath();

    ctx.roundRect(
        -48,
        -28,
        96,
        42,
        12
    );

    ctx.fill();

    /* cofano */

    ctx.fillStyle = "#c62828";

    ctx.beginPath();
    ctx.moveTo(25, -28);
    ctx.lineTo(52, -15);
    ctx.lineTo(52, 5);
    ctx.lineTo(25, 5);
    ctx.closePath();
    ctx.fill();

    /* finestrino */

    ctx.fillStyle = "#70d6ff";

    ctx.beginPath();

    ctx.moveTo(-25, -27);
    ctx.lineTo(5, -27);
    ctx.lineTo(18, -8);
    ctx.lineTo(-20, -8);
    ctx.closePath();

    ctx.fill();

    /* ruote */

    drawWheel(-30, 17);
    drawWheel(30, 17);

    ctx.restore();
}

function drawWheel(x, y) {

    ctx.fillStyle = "#171717";

    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#aaa";

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
}

/* =========================
   PARTICELLE
========================= */

function drawParticles() {

    if (Math.random() > .15) return;

    const x = car.x - cameraX - 45;
    const y = car.y + 25;

    ctx.fillStyle = "rgba(100,70,40,.4)";

    ctx.beginPath();
    ctx.arc(
        x,
        y,
        Math.random() * 4,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

/* =========================
   GAME LOOP
========================= */

function gameLoop(time) {

    if (!playing) return;

    const dt = Math.min(
        time - lastTime || 16,
        40
    );

    lastTime = time;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

/* =========================
   PAUSA
========================= */

document.getElementById("pauseBtn").onclick = () => {

    paused = true;

    document
        .getElementById("pauseMenu")
        .classList.remove("hidden");
};

document.getElementById("resumeBtn").onclick = () => {

    paused = false;

    document
        .getElementById("pauseMenu")
        .classList.add("hidden");
};

document.getElementById("menuBtn").onclick = () => {

    playing = false;

    document
        .getElementById("pauseMenu")
        .classList.add("hidden");

    game.classList.add("hidden");
    menu.classList.remove("hidden");

    updateMenuCoins();
};

/* =========================
   GAME OVER
========================= */

function endGame() {

    playing = false;

    document.getElementById("finalDistance").textContent =
        distance;

    document
        .getElementById("gameOver")
        .classList.remove("hidden");

    save.totalDistance += distance;

    saveGame();
}

document.getElementById("retryBtn").onclick = () => {

    document
        .getElementById("gameOver")
        .classList.add("hidden");

    startGame();
};

document.getElementById("gameOverMenu").onclick = () => {

    document
        .getElementById("gameOver")
        .classList.add("hidden");

    game.classList.add("hidden");
    menu.classList.remove("hidden");

    updateMenuCoins();
};

/* =========================
   TASTIERA
========================= */

window.addEventListener("keydown", e => {

    if (
        e.key === "ArrowRight" ||
        e.key.toLowerCase() === "d"
    ) {
        keys.right = true;
    }

    if (
        e.key === "ArrowLeft" ||
        e.key.toLowerCase() === "a"
    ) {
        keys.left = true;
    }

    if (
        e.key === "ArrowDown" ||
        e.key === " "
    ) {
        keys.brake = true;
    }
});

window.addEventListener("keyup", e => {

    if (
        e.key === "ArrowRight" ||
        e.key.toLowerCase() === "d"
    ) {
        keys.right = false;
    }

    if (
        e.key === "ArrowLeft" ||
        e.key.toLowerCase() === "a"
    ) {
        keys.left = false;
    }

    if (
        e.key === "ArrowDown" ||
        e.key === " "
    ) {
        keys.brake = false;
    }
});

/* =========================
   CONTROLLI TOUCH
========================= */

function touchButton(id, key) {

    const button = document.getElementById(id);

    button.addEventListener("pointerdown", e => {
        e.preventDefault();
        keys[key] = true;
    });

    button.addEventListener("pointerup", e => {
        e.preventDefault();
        keys[key] = false;
    });

    button.addEventListener("pointerleave", () => {
        keys[key] = false;
    });
}

touchButton("leftBtn", "left");
touchButton("rightBtn", "right");
touchButton("brakeBtn", "brake");

/* =========================
   AUTOSAVE
========================= */

setInterval(() => {

    if (playing) {
        saveGame();
    }

}, 3000);

updateWorldName();
