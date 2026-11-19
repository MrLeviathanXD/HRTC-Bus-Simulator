import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// =====================================
// HRTC BUS SIMULATOR 3D
// =====================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91c8ed);
scene.fog = new THREE.Fog(0x91c8ed, 100, 650);

const camera = new THREE.PerspectiveCamera(
75,
window.innerWidth / window.innerHeight,
0.1,
1000
);

camera.position.set(0, 1.65, 0);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({
antialias: false,
powerPreference: 'high-performance'
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = false;
document.body.appendChild(renderer.domElement);

// =====================================
// LIGHTING
// =====================================

scene.add(new THREE.HemisphereLight(0xffffff, 0x536b42, 2));

const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(100, 150, -100);
scene.add(sunlight);

// =====================================
// MATERIALS
// =====================================

const green = new THREE.MeshLambertMaterial({ color: 0x477c42 });
const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x30343a });
const yellow = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
const black = new THREE.MeshLambertMaterial({ color: 0x151719 });
const grey = new THREE.MeshLambertMaterial({ color: 0x777777 });
const glass = new THREE.MeshBasicMaterial({
color: 0x9bcbe0,
transparent: true,
opacity: 0.25
});

// =====================================
// WORLD
// =====================================

// Ground
const ground = new THREE.Mesh(
new THREE.PlaneGeometry(1000, 1500),
green
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.15, -650);
scene.add(ground);

// Main road
const road = new THREE.Mesh(
new THREE.PlaneGeometry(12, 1500),
roadMaterial
);
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0, -650);
scene.add(road);

// Road edges
for (const x of [-6, 6]) {
const edge = new THREE.Mesh(
new THREE.BoxGeometry(0.18, 0.12, 1500),
yellow
);
edge.position.set(x, 0.05, -650);
scene.add(edge);
}

// Road lane markings
const lines = [];

for (let i = 0; i < 70; i++) {
const line = new THREE.Mesh(
new THREE.BoxGeometry(0.16, 0.025, 6),
new THREE.MeshBasicMaterial({ color: 0xffffff })
);

line.position.set(0, 0.04, -i * 20);
scene.add(line);
lines.push(line);

}

// =====================================
// HIMACHAL MOUNTAINS
// =====================================

for (let i = 0; i < 35; i++) {
const height = 35 + Math.random() * 85;

const mountain = new THREE.Mesh(
    new THREE.ConeGeometry(25 + Math.random() * 35, height, 5),
    new THREE.MeshLambertMaterial({
        color: i % 3 === 0 ? 0x647e75 : 0x526e55
    })
);

const side = i % 2 === 0 ? -1 : 1;

mountain.position.set(
    side * (45 + Math.random() * 100),
    height / 2 - 3,
    -Math.random() * 1200
);

scene.add(mountain);

}

// =====================================
// TREES
// =====================================

const treeTrunk = new THREE.MeshLambertMaterial({
color: 0x60412a
});

const treeLeaves = new THREE.MeshLambertMaterial({
color: 0x185c35
});

function createTree(x, z) {
const tree = new THREE.Group();

const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.4, 3),
    treeTrunk
);
trunk.position.y = 1.5;
tree.add(trunk);

const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(2, 6, 6),
    treeLeaves
);
leaves.position.y = 5;
tree.add(leaves);

tree.position.set(x, 0, z);
scene.add(tree);

}

for (let i = 0; i < 110; i++) {
const side = i % 2 === 0 ? -1 : 1;

createTree(
    side * (9 + Math.random() * 25),
    -Math.random() * 1300
);

}

// =====================================
// BUS INTERIOR
// =====================================

const cabin = new THREE.Group();
camera.add(cabin);
scene.add(camera);

// Dashboard
const dashboard = new THREE.Mesh(
new THREE.BoxGeometry(2.6, 0.35, 0.8),
black
);

dashboard.position.set(0, -0.65, -1.3);
cabin.add(dashboard);

// Dashboard upper panel
const panel = new THREE.Mesh(
new THREE.BoxGeometry(2.5, 0.16, 0.15),
grey
);

panel.position.set(0, -0.48, -1.5);
cabin.add(panel);

// Windshield pillars
for (const x of [-1.35, 1.35]) {
const pillar = new THREE.Mesh(
new THREE.BoxGeometry(0.12, 1.7, 0.15),
black
);

pillar.position.set(x, 0.35, -1.5);
cabin.add(pillar);

}

// Roof frame
const roof = new THREE.Mesh(
new THREE.BoxGeometry(2.8, 0.15, 0.25),
black
);

roof.position.set(0, 1.15, -1.5);
cabin.add(roof);

// Steering wheel
const steeringWheel = new THREE.Mesh(
new THREE.TorusGeometry(0.32, 0.045, 8, 24),
black
);

steeringWheel.position.set(-0.55, -0.35, -0.95);
steeringWheel.rotation.x = 0.35;
cabin.add(steeringWheel);

// Steering centre
const steeringCenter = new THREE.Mesh(
new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16),
grey
);

steeringCenter.rotation.x = Math.PI / 2;
steeringCenter.position.set(-0.55, -0.35, -0.95);
cabin.add(steeringCenter);

// Interior mirrors
for (const x of [-1.15, 1.15]) {
const mirror = new THREE.Mesh(
new THREE.BoxGeometry(0.45, 0.18, 0.08),
black
);

mirror.position.set(x, 0.65, -1.35);
cabin.add(mirror);

}

// Dashboard meters
const meter = new THREE.Mesh(
new THREE.BoxGeometry(0.8, 0.25, 0.08),
new THREE.MeshBasicMaterial({ color: 0x152e29 })
);

meter.position.set(0.35, -0.5, -1.0);
cabin.add(meter);

// =====================================
// PASSENGER STOPS
// =====================================

const stops = [];
const passengers = [];

function createPassenger(x, z) {
const person = new THREE.Group();

const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.25, 1, 8),
    new THREE.MeshLambertMaterial({
        color: Math.random() * 0xffffff
    })
);

body.position.y = 0.9;
person.add(body);

const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0xc58b60 })
);

head.position.y = 1.55;
person.add(head);

person.position.set(x, 0, z);
scene.add(person);

return person;

}

for (let i = 1; i <= 12; i++) {
const z = -i * 85;

const stop = {
    z: z,
    passengers: 2 + Math.floor(Math.random() * 4),
    collected: false
};

stops.push(stop);

// Bus stop sign
const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 3),
    grey
);

pole.position.set(8, 1.5, z);
scene.add(pole);

const sign = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.7, 0.12),
    yellow
);

sign.position.set(8, 3.2, z);
scene.add(sign);

// Waiting passengers
for (let j = 0; j < stop.passengers; j++) {
    passengers.push({
        object: createPassenger(
            7 + (j % 2) * 0.8,
            z + Math.floor(j / 2) * 1.0
        ),
        stop: stop
    });
}

}

// =====================================
// GAME VARIABLES
// =====================================

let speed = 0;
let money = 0;
let fuel = 100;
let gear = 0;
let steering = 0;
let throttle = false;
let braking = false;
let clutch = false;

let busPosition = 0;
let engineRPM = 750;

const maxSpeed = 85;

// =====================================
// MOBILE CONTROLS
// =====================================

function holdButton(id, down, up) {
const button = document.getElementById(id);

if (!button) return;

button.addEventListener('pointerdown', e => {
    e.preventDefault();
    down();
});

button.addEventListener('pointerup', e => {
    e.preventDefault();
    up();
});

button.addEventListener('pointerleave', up);
button.addEventListener('pointercancel', up);

}

holdButton('left',
() => steering = -1,
() => steering = 0
);

holdButton('right',
() => steering = 1,
() => steering = 0
);

holdButton('accelerator',
() => throttle = true,
() => throttle = false
);

holdButton('brake',
() => braking = true,
() => braking = false
);

holdButton('clutch',
() => clutch = true,
() => clutch = false
);

// Gear selector
document.querySelectorAll('[data-gear]').forEach(button => {
button.addEventListener('click', () => {
const selected = Number(button.dataset.gear);

    if (selected === -1 && speed > 2) return;

    gear = selected;

    document.getElementById('gear').textContent =
        gear === -1 ? 'R' :
        gear === 0 ? 'N' : gear;
});

});

// =====================================
// PASSENGER COLLECTION
// =====================================

function checkPassengerStops() {
for (const stop of stops) {
const distance = Math.abs(busPosition - Math.abs(stop.z));

    if (
        distance < 5 &&
        speed < 2 &&
        !stop.collected
    ) {
        stop.collected = true;

        const count = stop.passengers;
        const fare = 25;

        money += count * fare;

        document.getElementById('money').textContent = money;

        passengers.forEach(p => {
            if (p.stop === stop) {
                scene.remove(p.object);
            }
        });

        alert(
            count + ' passengers boarded!\nFare collected: ₹' +
            (count * fare)
        );
    }
}

}

// =====================================
// GAME PHYSICS
// =====================================

function updatePhysics(delta) {
const acceleration = 13;
const brakes = 25;

if (throttle && !clutch && gear !== 0 && fuel > 0) {
    let ratio = gear === -1 ? 0.65 : 1 / gear;

    const direction = gear === -1 ? -1 : 1;

    const limit = gear === -1 ? 18 : maxSpeed;

    if (Math.abs(speed) < limit) {
        speed += direction * acceleration * ratio * delta;
    }

    fuel -= 0.012 * delta;
} else {
    speed *= Math.pow(0.985, delta * 60);
}

if (braking) {
    speed = THREE.MathUtils.damp(speed, 0, 5, delta);
}

speed = THREE.MathUtils.clamp(speed, -18, maxSpeed);

busPosition += speed * delta / 3.6;

engineRPM = clutch || gear === 0
    ? 750 + (throttle ? 1600 : 0)
    : 750 + Math.abs(speed) * 25;

if (fuel <= 0) {
    fuel = 0;
    speed = THREE.MathUtils.damp(speed, 0, 2, delta);
}

// Road and scenery movement
for (const line of lines) {
    line.position.z += speed * delta / 3.6;

    if (line.position.z > 10) {
        line.position.z -= 1400;
    }
}

// Steering camera
camera.position.x = THREE.MathUtils.damp(
    camera.position.x,
    steering * 0.22,
    2,
    delta
);

camera.rotation.z = THREE.MathUtils.damp(
    camera.rotation.z,
    -steering * 0.035,
    2,
    delta
);

steeringWheel.rotation.z = -steering * 0.65;

// Move world relative to bus
scene.position.z = busPosition;

}

// =====================================
// DASHBOARD
// =====================================

function updateDashboard() {
document.getElementById('speed').textContent =
Math.round(Math.abs(speed));

document.getElementById('fuel').textContent =
    Math.round(fuel);

document.getElementById('money').textContent = money;

}

// =====================================
// GAME LOOP
// =====================================

let previousTime = performance.now();

function animate() {
requestAnimationFrame(animate);

const now = performance.now();

const delta = Math.min((now - previousTime) / 1000, 0.05);

previousTime = now;

updatePhysics(delta);
updateDashboard();
checkPassengerStops();

renderer.render(scene, camera);

}

animate();

// =====================================
// RESIZE
// =====================================

window.addEventListener('resize', () => {
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

});

// =====================================
// LOADING SCREEN
// =====================================

const loading = document.getElementById('loading');

if (loading) {
loading.style.display = 'none';
}

console.log('HRTC Bus Simulator started!');
