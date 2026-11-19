import * as THREE from
"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

/* =========================================
   HRTC BUS SIMULATOR
   GAME ENGINE
========================================= */

const $ = id => document.getElementById(id);

const loadingScreen = $("loadingScreen");
const startScreen = $("startScreen");
const gameContainer = $("gameContainer");
const loadingStatus = $("loadingStatus");

let scene, camera, renderer, clock;
let roadCurve;
let roadLength = 0;

let running = false;
let paused = false;
let finished = false;

let speed = 0;
let distance = 0;
let fuel = 100;
let money = 0;
let passengers = 0;

let currentGear = "N";
let lateralPosition = 0;
let steering = 0;

let acceleratorPressed = false;
let brakePressed = false;
let clutchPressed = false;

let doorsOpen = false;
let lightsOn = false;

let notificationTimer = null;

const roadWidth = 13;

const gearLimits = {
    R: 15,
    N: 0,
    1: 18,
    2: 32,
    3: 48,
    4: 67,
    5: 85
};

const gearAcceleration = {
    R: 1.8,
    N: 0,
    1: 5.0,
    2: 3.8,
    3: 2.8,
    4: 2.0,
    5: 1.5
};

const stops = [
    {
        name: "Kufri",
        location: "Kufri",
        fraction: 0.19,
        passengers: 5,
        completed: false
    },
    {
        name: "Narkanda",
        location: "Narkanda",
        fraction: 0.40,
        passengers: 4,
        completed: false
    },
    {
        name: "Kullu",
        location: "Kullu",
        fraction: 0.69,
        passengers: 6,
        completed: false
    },
    {
        name: "Manali",
        location: "Manali",
        fraction: 0.91,
        passengers: 7,
        completed: false
    }
];

let currentStop = null;

/* =========================================
   INITIALIZATION
========================================= */

async function initializeGame() {

    loadingStatus.textContent = "Creating 3D environment...";

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x91c9ed);

    scene.fog = new THREE.Fog(
        0x91c9ed,
        180,
        1000
    );

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        2500
    );

    renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "low-power"
    });

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 1.25)
    );

    renderer.shadowMap.enabled = false;

    renderer.outputColorSpace = THREE.SRGBColorSpace;

    $("gameCanvas").appendChild(renderer.domElement);

    clock = new THREE.Clock();

    createLighting();
    createRoad();
    createTerrain();
    createScenery();
    createBusCockpit();
    createBusStops();

    scene.add(camera);

    updateCameraPosition();

    loadingStatus.textContent = "Almost ready...";

    loadingScreen.style.display = "none";

    startScreen.style.display = "flex";

    animate();
}

/* =========================================
   LIGHTING
========================================= */

function createLighting() {

    const ambient = new THREE.HemisphereLight(
        0xffffff,
        0x526b49,
        2.0
    );

    scene.add(ambient);

    const sunlight = new THREE.DirectionalLight(
        0xffffff,
        2.2
    );

    sunlight.position.set(100, 200, 100);

    scene.add(sunlight);
}

/* =========================================
   MOUNTAIN ROAD
========================================= */

function createRoad() {

    const points = [

        new THREE.Vector3(0, 2, 0),

        new THREE.Vector3(0, 4, -180),

        new THREE.Vector3(65, 10, -380),

        new THREE.Vector3(130, 22, -560),

        new THREE.Vector3(40, 40, -760),

        new THREE.Vector3(-90, 55, -980),

        new THREE.Vector3(-150, 45, -1200),

        new THREE.Vector3(-40, 30, -1450),

        new THREE.Vector3(100, 18, -1680),

        new THREE.Vector3(180, 35, -1900),

        new THREE.Vector3(80, 55, -2150),

        new THREE.Vector3(-80, 65, -2400),

        new THREE.Vector3(-130, 75, -2650)

    ];

    roadCurve = new THREE.CatmullRomCurve3(
        points,
        false,
        "catmullrom",
        0.35
    );

    roadLength = roadCurve.getLength();

    const segments = 700;

    const vertices = [];
    const indices = [];
    const uvs = [];

    for (let i = 0; i <= segments; i++) {

        const t = i / segments;

        const point = roadCurve.getPointAt(t);

        const tangent = roadCurve.getTangentAt(t);

        const right = new THREE.Vector3(
            -tangent.z,
            0,
            tangent.x
        ).normalize();

        const leftPoint = point.clone().addScaledVector(
            right,
            -roadWidth / 2
        );

        const rightPoint = point.clone().addScaledVector(
            right,
            roadWidth / 2
        );

        vertices.push(
            leftPoint.x,
            leftPoint.y + 0.15,
            leftPoint.z
        );

        vertices.push(
            rightPoint.x,
            rightPoint.y + 0.15,
            rightPoint.z
        );

        uvs.push(0, t * 50);
        uvs.push(1, t * 50);

        if (i < segments) {

            const a = i * 2;
            const b = a + 1;
            const c = a + 2;
            const d = a + 3;

            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }

    const roadGeometry = new THREE.BufferGeometry();

    roadGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
    );

    roadGeometry.setAttribute(
        "uv",
        new THREE.Float32BufferAttribute(uvs, 2)
    );

    roadGeometry.setIndex(indices);

    roadGeometry.computeVertexNormals();

    const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x35383c,
        roughness: 1
    });

    const road = new THREE.Mesh(
        roadGeometry,
        roadMaterial
    );

    scene.add(road);

    createRoadMarkings();
    createGuardrails();
}

/* =========================================
   ROAD MARKINGS
========================================= */

function createRoadMarkings() {

    const markingMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd54f
    });

    for (let i = 0; i < 300; i++) {

        const t = i / 300;

        const point = roadCurve.getPointAt(t);

        const tangent = roadCurve.getTangentAt(t);

        const stripe = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.05, 3),
            markingMaterial
        );

        stripe.position.set(
            point.x,
            point.y + 0.25,
            point.z
        );

        stripe.rotation.y = Math.atan2(
            tangent.x,
            -tangent.z
        );

        scene.add(stripe);
    }
}

/* =========================================
   GUARDRAILS
========================================= */

function createGuardrails() {

    const railMaterial = new THREE.MeshStandardMaterial({
        color: 0xb9c2c9,
        metalness: 0.7,
        roughness: 0.4
    });

    const postMaterial = new THREE.MeshStandardMaterial({
        color: 0x777777
    });

    for (let i = 0; i <= 250; i++) {

        const t = i / 250;

        const point = roadCurve.getPointAt(t);

        const tangent = roadCurve.getTangentAt(t);

        const right = new THREE.Vector3(
            -tangent.z,
            0,
            tangent.x
        ).normalize();

        for (const side of [-1, 1]) {

            const position = point.clone().addScaledVector(
                right,
                side * (roadWidth / 2 + 0.6)
            );

            const post = new THREE.Mesh(
                new THREE.BoxGeometry(0.18, 1.2, 0.18),
                postMaterial
            );

            post.position.copy(position);

            post.position.y += 0.8;

            scene.add(post);

            if (i % 2 === 0) {

                const rail = new THREE.Mesh(
                    new THREE.BoxGeometry(0.15, 0.15, 4),
                    railMaterial
                );

                rail.position.copy(position);

                rail.position.y += 1.2;

                rail.rotation.y = Math.atan2(
                    tangent.x,
                    -tangent.z
                );

                scene.add(rail);
            }
        }
    }
}

/* =========================================
   TERRAIN
========================================= */

function createTerrain() {

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(6000, 6000),
        new THREE.MeshStandardMaterial({
            color: 0x527b43,
            roughness: 1
        })
    );

    ground.rotation.x = -Math.PI / 2;

    ground.position.set(0, -8, -1300);

    scene.add(ground);

    const mountainMaterial = new THREE.MeshStandardMaterial({
        color: 0x687e85,
        roughness: 1
    });

    for (let i = 0; i < 45; i++) {

        const mountain = new THREE.Mesh(
            new THREE.ConeGeometry(
                80 + Math.random() * 100,
                180 + Math.random() * 180,
                6
            ),
            mountainMaterial
        );

        mountain.position.set(
            (Math.random() - 0.5) * 1800,
            35 + Math.random() * 100,
            -Math.random() * 3000
        );

        mountain.rotation.y = Math.random() * Math.PI;

        scene.add(mountain);
    }
}

/* =========================================
   PINE TREES AND SCENERY
========================================= */

function createScenery() {

    const trunkGeometry = new THREE.CylinderGeometry(
        0.3,
        0.45,
        4,
        5
    );

    const leafGeometry = new THREE.ConeGeometry(
        3,
        9,
        6
    );

    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x68442a
    });

    const leafMaterial = new THREE.MeshStandardMaterial({
        color: 0x164d32
    });

    const trunkGroup = new THREE.Group();
    const leafGroup = new THREE.Group();

    for (let i = 0; i < 300; i++) {

        const t = Math.random();

        const point = roadCurve.getPointAt(t);

        const tangent = roadCurve.getTangentAt(t);

        const right = new THREE.Vector3(
            -tangent.z,
            0,
            tangent.x
        ).normalize();

        const side = Math.random() > 0.5 ? 1 : -1;

        const offset = 18 + Math.random() * 100;

        const position = point.clone().addScaledVector(
            right,
            side * offset
        );

        const trunk = new THREE.Mesh(
            trunkGeometry,
            trunkMaterial
        );

        trunk.position.set(
            position.x,
            position.y + 2,
            position.z
        );

        const leaves = new THREE.Mesh(
            leafGeometry,
            leafMaterial
        );

        leaves.position.set(
            position.x,
            position.y + 8,
            position.z
        );

        const scale = 0.7 + Math.random() * 1.3;

        trunk.scale.setScalar(scale);
        leaves.scale.setScalar(scale);

        trunkGroup.add(trunk);
        leafGroup.add(leaves);
    }

    scene.add(trunkGroup);
    scene.add(leafGroup);
}

/* =========================================
   BUS COCKPIT
========================================= */

function createBusCockpit() {

    const dashboardMaterial = new THREE.MeshStandardMaterial({
        color: 0x20252a,
        roughness: 0.8
    });

    const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x555e64,
        metalness: 0.7
    });

    const glassMaterial = new THREE.MeshBasicMaterial({
        color: 0x263c4c,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
    });

    // Dashboard

    const dashboard = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.35, 0.9),
        dashboardMaterial
    );

    dashboard.position.set(
        0,
        -0.65,
        -1.35
    );

    camera.add(dashboard);

    // Dashboard front

    const front = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.18, 0.2),
        metalMaterial
    );

    front.position.set(
        0,
        -0.48,
        -1.78
    );

    camera.add(front);

    // Steering wheel

    const steeringWheel = new THREE.Mesh(
        new THREE.TorusGeometry(
            0.34,
            0.055,
            8,
            32
        ),
        new THREE.MeshStandardMaterial({
            color: 0x111111
        })
    );

    steeringWheel.position.set(
        0,
        -0.45,
        -0.92
    );

    camera.add(steeringWheel);

    // Steering wheel center

    const center = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.09,
            0.09,
            0.12,
            16
        ),
        metalMaterial
    );

    center.rotation.x = Math.PI / 2;

    center.position.set(
        0,
        -0.45,
        -0.92
    );

    camera.add(center);

    // Steering spokes

    for (let i = 0; i < 3; i++) {

        const spoke = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.34, 0.05),
            metalMaterial
        );

        spoke.position.set(
            0,
            -0.45,
            -0.92
        );

        spoke.rotation.z = i * Math.PI / 3;

        camera.add(spoke);
    }

    // Windshield pillars

    for (const side of [-1, 1]) {

        const pillar = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 1.9, 0.15),
            dashboardMaterial
        );

        pillar.position.set(
            side * 1.2,
            0.45,
            -1.7
        );

        camera.add(pillar);
    }

    // Windshield upper frame

    const upperFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.12, 0.15),
        dashboardMaterial
    );

    upperFrame.position.set(
        0,
        1.25,
        -1.7
    );

    camera.add(upperFrame);

    // Small instrument panel

    const instrument = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.25, 0.08),
        new THREE.MeshBasicMaterial({
            color: 0x071c24
        })
    );

    instrument.position.set(
        0,
        -0.25,
        -1.8
    );

    camera.add(instrument);

    // Dashboard lights

    for (let i = 0; i < 3; i++) {

        const light = new THREE.Mesh(
            new THREE.CircleGeometry(0.045, 12),
            new THREE.MeshBasicMaterial({
                color: [0x00ff88, 0xffca28, 0xff3333][i]
            })
        );

        light.position.set(
            -0.25 + i * 0.25,
            -0.25,
            -1.75
        );

        camera.add(light);
    }
}

/* =========================================
   BUS STOP SIGNS
========================================= */

function createBusStops() {

    stops.forEach(stop => {

        const point = roadCurve.getPointAt(stop.fraction);

        const tangent = roadCurve.getTangentAt(stop.fraction);

        const right = new THREE.Vector3(
            -tangent.z,
            0,
            tangent.x
        ).normalize();

        const position = point.clone().addScaledVector(
            right,
            roadWidth / 2 + 4
        );

        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.12,
                0.12,
                4,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x555555
            })
        );

        pole.position.set(
            position.x,
            position.y + 2,
            position.z
        );

        scene.add(pole);

        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 1.2, 0.12),
            new THREE.MeshStandardMaterial({
                color: 0x087f45
            })
        );

        sign.position.set(
            position.x,
            position.y + 4,
            position.z
        );

        scene.add(sign);

        const label = createTextSprite(stop.name);

        label.position.set(
            position.x,
            position.y + 4,
            position.z + 0.1
        );

        scene.add(label);

        // Simple waiting passengers

        for (let i = 0; i < stop.passengers; i++) {

            const person = createPerson();

            person.position.set(
                position.x + (Math.random() - 0.5) * 4,
                position.y,
                position.z - 3 - Math.random() * 3
            );

            scene.add(person);

            stop.personObjects = stop.personObjects || [];

            stop.personObjects.push(person);
        }
    });
}

/* =========================================
   TEXT SPRITE
========================================= */

function createTextSprite(text) {

    const canvas = document.createElement("canvas");

    canvas.width = 512;
    canvas.height = 128;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#087f45";

    ctx.fillRect(0, 0, 512, 128);

    ctx.fillStyle = "white";

    ctx.font = "bold 58px Arial";

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";

    ctx.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.SpriteMaterial({
        map: texture
    });

    const sprite = new THREE.Sprite(material);

    sprite.scale.set(6, 1.5, 1);

    return sprite;
}

/* =========================================
   SIMPLE PASSENGER MODEL
========================================= */

function createPerson() {

    const person = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1, 0.35),
        new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff
        })
    );

    body.position.y = 1;

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshStandardMaterial({
            color: 0xc58c65
        })
    );

    head.position.y = 1.75;

    person.add(body);
    person.add(head);

    return person;
}

/* =========================================
   CAMERA POSITION
========================================= */

function updateCameraPosition() {

    if (!roadCurve) return;

    const t = THREE.MathUtils.clamp(
        distance / roadLength,
        0,
        1
    );

    const point = roadCurve.getPointAt(t);

    const tangent = roadCurve.getTangentAt(t);

    const right = new THREE.Vector3(
        -tangent.z,
        0,
        tangent.x
    ).normalize();

    const position = point.clone();

    position.addScaledVector(
        right,
        lateralPosition
    );

    camera.position.set(
        position.x,
        position.y + 2.3,
        position.z
    );

    const lookPoint = position.clone().addScaledVector(
        tangent,
        25
    );

    lookPoint.y += 1.0;

    camera.lookAt(lookPoint);

    // Gentle bus movement

    camera.rotateZ(-steering * 0.035);
}

/* =========================================
   START GAME
========================================= */

$("startButton").addEventListener("click", () => {

    startScreen.style.display = "none";

    gameContainer.style.display = "block";

    running = true;

    paused = false;

    clock.start();

    showNotification("Welcome aboard HRTC!");

});

/* =========================================
   STEERING CONTROLS
========================================= */

function holdButton(id, callback) {

    const button = $(id);

    if (!button) return;

    button.addEventListener("pointerdown", event => {

        event.preventDefault();

        callback(true);

        button.setPointerCapture(event.pointerId);

    });

    button.addEventListener("pointerup", event => {

        event.preventDefault();

        callback(false);

    });

    button.addEventListener("pointercancel", () => {
        callback(false);
    });

    button.addEventListener("lostpointercapture", () => {
        callback(false);
    });
}

holdButton("leftButton", value => {
    steering = value ? -1 : 0;
});

holdButton("rightButton", value => {
    steering = value ? 1 : 0;
});

holdButton("accelerator", value => {
    acceleratorPressed = value;
});

holdButton("brake", value => {
    brakePressed = value;
});

holdButton("clutch", value => {
    clutchPressed = value;
});

/* =========================================
   MANUAL GEARBOX
========================================= */

document.querySelectorAll(".gear-button").forEach(button => {

    button.addEventListener("click", () => {

        const selected = button.dataset.gear;

        if (Math.abs(speed) > 5) {

            showNotification(
                "Slow down before changing gear!"
            );

            return;
        }

        if (!clutchPressed && Math.abs(speed) > 0.5) {

            showNotification(
                "Press clutch to change gear!"
            );

            return;
        }

        currentGear = selected;

        document.querySelectorAll(".gear-button")
            .forEach(b => b.classList.remove("active"));

        button.classList.add("active");

        $("gear").textContent = currentGear;

        showNotification("Gear changed to " + selected);
    });
});

/* =========================================
   DRIVING PHYSICS
========================================= */

function updateDriving(dt) {

    if (!running || paused || finished) return;

    const oldSpeed = speed;

    if (acceleratorPressed && !clutchPressed && currentGear !== "N") {

        const direction = currentGear === "R" ? -1 : 1;

        const maxSpeed = gearLimits[currentGear];

        const acceleration = gearAcceleration[currentGear];

        speed += direction * acceleration * dt;

        if (direction > 0) {

            speed = Math.min(speed, maxSpeed);

        } else {

            speed = Math.max(speed, -maxSpeed);
        }
    }

    if (brakePressed) {

        if (speed > 0) {
            speed = Math.max(0, speed - 18 * dt);
        }

        if (speed < 0) {
            speed = Math.min(0, speed + 18 * dt);
        }
    }

    // Natural rolling resistance

    if (!acceleratorPressed && !brakePressed) {

        if (speed > 0) {
            speed = Math.max(0, speed - 1.2 * dt);
        }

        if (speed < 0) {
            speed = Math.min(0, speed + 1.2 * dt);
        }
    }

    // Simple uphill / downhill effect

    const t = THREE.MathUtils.clamp(
        distance / roadLength,
        0,
        1
    );

    const tangent = roadCurve.getTangentAt(t);

    const slopeEffect = tangent.y * 4;

    if (speed > 0) {
        speed -= slopeEffect * dt;
    }

    speed = THREE.MathUtils.clamp(speed, -15, 85);

    // Steering movement

    if (Math.abs(speed) > 1) {

        lateralPosition +=
            steering * Math.min(Math.abs(speed) / 30, 1) * 8 * dt;
    }

    lateralPosition = THREE.MathUtils.clamp(
        lateralPosition,
        -9,
        9
    );

    // Return steering to centre when released

    if (steering === 0) {

        lateralPosition *= Math.pow(0.92, dt * 60);
    }

    // Update route distance

    distance += speed * dt / 3.6;

    distance = THREE.MathUtils.clamp(
        distance,
        0,
        roadLength
    );

    // Fuel consumption

    if (acceleratorPressed && speed > 0) {

        fuel -= 0.015 * dt;
    }

    fuel = Math.max(0, fuel);

    if (fuel <= 0) {

        speed = Math.max(0, speed - 5 * dt);

        showNotification("Fuel empty! Journey stopped.");
    }

    updateCameraPosition();

    checkStops();

    updateDashboard();

    if (distance >= roadLength - 5 && speed >= 0) {

        finishJourney();
    }
}

/* =========================================
   BUS STOP DETECTION
========================================= */

function checkStops() {

    currentStop = null;

    for (const stop of stops) {

        if (stop.completed) continue;

        const stopDistance = stop.fraction * roadLength;

        const difference = stopDistance - distance;

        if (Math.abs(difference) < 25) {

            currentStop = stop;

            if (Math.abs(speed) < 2) {

                $("stopPanel").style.display = "block";

                $("stopName").textContent =
                    stop.name + " Bus Stop";

                $("boardButton").disabled = false;

            } else {

                $("stopPanel").style.display = "none";
            }

            break;
        }
    }

    if (!currentStop) {

        $("stopPanel").style.display = "none";
    }
}

/* =========================================
   PASSENGER PICKUP
========================================= */

$("boardButton").addEventListener("click", () => {

    if (!currentStop) return;

    if (Math.abs(speed) > 2) {

        showNotification("Stop the bus first!");

        return;
    }

    if (!doorsOpen) {

        showNotification("Open the bus door first!");

        return;
    }

    const stop = currentStop;

    if (stop.completed) return;

    stop.completed = true;

    const pickedUp = stop.passengers;

    passengers += pickedUp;

    const fare = pickedUp * 20;

    money += fare;

    if (stop.personObjects) {

        stop.personObjects.forEach(person => {
            scene.remove(person);
        });
    }

    $("stopPanel").style.display = "none";

    showNotification(
        pickedUp + " passengers boarded! Fare: ₹" + fare
    );

    currentStop = null;

    updateDashboard();
});

/* =========================================
   DOORS
========================================= */

$("doorButton").addEventListener("click", () => {

    if (Math.abs(speed) > 1) {

        showNotification("Stop the bus before opening doors!");

        return;
    }

    doorsOpen = !doorsOpen;

    $("doorButton").textContent = doorsOpen
        ? "🚪 CLOSE DOOR"
        : "🚪 OPEN DOOR";

    showNotification(
        doorsOpen ? "Doors opened" : "Doors closed"
    );
});

/* =========================================
   HORN
========================================= */

$("hornButton").addEventListener("click", () => {

    showNotification("📢 HORN!");
});

/* =========================================
   LIGHTS
========================================= */

$("lightButton").addEventListener("click", () => {

    lightsOn = !lightsOn;

    $("lightButton").textContent = lightsOn
        ? "💡 LIGHTS ON"
        : "💡 LIGHTS";

    showNotification(
        lightsOn ? "Headlights switched on" : "Headlights switched off"
    );
});

/* =========================================
   CAMERA BUTTON
========================================= */

$("cameraButton").addEventListener("click", () => {

    showNotification("Interior camera is active");
});

/* =========================================
   PAUSE SYSTEM
========================================= */

$("pauseButton").addEventListener("click", pauseGame);

$("resumeButton").addEventListener("click", resumeGame);

function pauseGame() {

    if (!running || finished) return;

    paused = true;

    $("pauseMenu").style.display = "flex";
}

function resumeGame() {

    paused = false;

    $("pauseMenu").style.display = "none";

    clock.getDelta();
}

/* =========================================
   RESTART JOURNEY
========================================= */

$("restartButton").addEventListener("click", () => {

    location.reload();
});

$("playAgainButton").addEventListener("click", () => {

    location.reload();
});

/* =========================================
   FINISH JOURNEY
========================================= */

function finishJourney() {

    finished = true;

    running = false;

    $("finalMoney").textContent = money;

    $("finishScreen").style.display = "flex";
}

/* =========================================
   DASHBOARD UPDATE
========================================= */

function updateDashboard() {

    $("speed").textContent = Math.round(
        Math.abs(speed)
    );

    $("gear").textContent = currentGear;

    $("money").textContent = money;

    $("fuel").textContent = Math.round(fuel);

    $("passengers").textContent = passengers;

    $("distance").textContent = (
        distance / 1000
    ).toFixed(1);

    const t = Math.min(distance / roadLength, 1);

    let location = "Shimla";

    if (t > 0.19) location = "Kufri";

    if (t > 0.40) location = "Narkanda";

    if (t > 0.69) location = "Kullu";

    if (t > 0.91) location = "Manali";

    $("location").textContent = location;

    const nextStop = stops.find(
        stop => !stop.completed
    );

    $("destination").textContent =
        nextStop ? nextStop.name : "Manali";
}

/* =========================================
   NOTIFICATION SYSTEM
========================================= */

function showNotification(message) {

    const box = $("notification");

    box.textContent = message;

    box.classList.add("show");

    clearTimeout(notificationTimer);

    notificationTimer = setTimeout(() => {

        box.classList.remove("show");

    }, 2500);
}

/* =========================================
   KEYBOARD SUPPORT
========================================= */

window.addEventListener("keydown", event => {

    if (event.repeat) return;

    switch (event.key.toLowerCase()) {

        case "w":
        case "arrowup":
            acceleratorPressed = true;
            break;

        case "s":
        case "arrowdown":
            brakePressed = true;
            break;

        case "a":
        case "arrowleft":
            steering = -1;
            break;

        case "d":
        case "arrowright":
            steering = 1;
            break;

        case " ":
            clutchPressed = true;
            break;

        case "p":
            paused ? resumeGame() : pauseGame();
            break;
    }
});

window.addEventListener("keyup", event => {

    switch (event.key.toLowerCase()) {

        case "w":
        case "arrowup":
            acceleratorPressed = false;
            break;

        case "s":
        case "arrowdown":
            brakePressed = false;
            break;

        case "a":
        case "arrowleft":
        case "d":
        case "arrowright":
            steering = 0;
            break;

        case " ":
            clutchPressed = false;
            break;
    }
});

/* =========================================
   ANIMATION LOOP
========================================= */

function animate() {

    requestAnimationFrame(animate);

    const dt = Math.min(
        clock.getDelta(),
        0.05
    );

    if (running && !paused && !finished) {

        updateDriving(dt);
    }

    renderer.render(scene, camera);
}

/* =========================================
   RESIZE
========================================= */

window.addEventListener("resize", () => {

    if (!camera || !renderer) return;

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 1.25)
    );
});

/* =========================================
   START INITIALIZATION
========================================= */

initializeGame().catch(error => {

    console.error(error);

    loadingStatus.textContent =
        "Game could not load. Check your internet connection and refresh.";

});
