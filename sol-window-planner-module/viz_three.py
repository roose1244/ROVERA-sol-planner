"""Three.js interactive 3D scene — the hero visual for the pitch.

Produces one self-contained HTML file with:
  - Real terrain mesh from the elevation raster (Mars-red material)
  - Animated rover that traverses the planned route in real time
  - Dust-storm sky that darkens during high-tau sols
  - Deposit markers with hover labels
  - Orbit + fly camera controls
  - Time slider to scrub through sols
  - HUD showing sol / tau / drive status

Runs offline. No install beyond a modern browser.
"""
from __future__ import annotations
import json
import numpy as np
from pathlib import Path


def render_three(elev, tclass, tau, route, deposits, start,
                 save: str | Path = "demo/plan_three.html",
                 title: str = "Sol-Window Planner"):
    H, W = elev.shape
    # Downsample terrain if huge (keep pitch snappy)
    step = max(1, max(H, W) // 200)
    e = elev[::step, ::step].astype(float)
    tc = tclass[::step, ::step].astype(int)
    h, w = e.shape

    # Normalise elevation to a sensible visual range
    e_min, e_max = float(e.min()), float(e.max())
    e_range = max(e_max - e_min, 1.0)

    payload = {
        "title": title,
        "w": w, "h": h, "step": step,
        "elev": e.flatten().tolist(),
        "eMin": e_min, "eMax": e_max,
        "terrainClass": tc.flatten().tolist(),
        "route": [[int(r // step), int(c // step)] for r, c in route.path],
        "routeSols": list(map(int, route.sols)),
        "eta": float(route.eta_sols),
        "totalKm": float(route.total_m) / 1000.0,
        "idleSols": int(route.idle_sols),
        "tau": [float(x) for x in tau],
        "deposits": [
            {"row": int(row // step), "col": int(col // step),
             "name": name, "depth": float(depth), "yield": float(y)}
            for row, col, depth, y, name in
            zip(deposits.row, deposits.col, deposits.depth_m,
                deposits.yield_kg_m2, deposits["name"])
        ],
        "start": [int(start[0] // step), int(start[1] // step)],
    }

    html = _HTML_TEMPLATE.replace("__PAYLOAD__", json.dumps(payload))
    Path(save).parent.mkdir(parents=True, exist_ok=True)
    Path(save).write_text(html)
    return save


_HTML_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Sol-Window Planner · 3D mission view</title>
<style>
  html, body { margin:0; padding:0; height:100%; background:#000;
               color:#e8d7b7; font-family:-apple-system, BlinkMacSystemFont,
               "Segoe UI", Helvetica, Arial, sans-serif; overflow:hidden; }
  #app { position:absolute; inset:0; }
  #hud { position:absolute; top:14px; left:14px; padding:14px 18px;
         background:rgba(20,10,5,0.72); border:1px solid #6b3f22;
         border-radius:10px; backdrop-filter:blur(6px); min-width:280px; }
  #hud h1 { margin:0 0 4px 0; font-size:15px; font-weight:600;
            letter-spacing:0.02em; color:#ffd7a8; }
  #hud .sub { font-size:11px; color:#c9a37c; margin-bottom:10px; }
  #hud .stats { display:grid; grid-template-columns:1fr 1fr;
                gap:6px 14px; font-size:12px; }
  #hud .stats b { color:#ffd7a8; font-variant-numeric:tabular-nums; }
  #hud .status { margin-top:10px; padding:6px 10px; border-radius:6px;
                 font-weight:600; text-align:center; font-size:12px;
                 letter-spacing:0.05em; text-transform:uppercase; }
  .status.drive { background:#1f4d2e; color:#8ff0b2; }
  .status.hold  { background:#5c2317; color:#ff9b83; animation:pulse 1.4s ease-in-out infinite; }
  .status.arrive{ background:#3d3d1f; color:#f3ec8f; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.55} }

  #controls { position:absolute; bottom:20px; left:50%;
              transform:translateX(-50%); background:rgba(20,10,5,0.75);
              border:1px solid #6b3f22; border-radius:10px;
              padding:12px 20px; display:flex; align-items:center;
              gap:14px; backdrop-filter:blur(6px); }
  #controls button { background:#3d1f11; color:#ffd7a8;
                     border:1px solid #6b3f22; border-radius:6px;
                     padding:6px 12px; font-size:12px; cursor:pointer;
                     font-weight:600; letter-spacing:0.03em; }
  #controls button:hover { background:#5c2c17; }
  #controls input[type="range"] { width:280px; accent-color:#ffb060; }
  #controls .sol-label { font-size:12px; color:#c9a37c; min-width:70px;
                         font-variant-numeric:tabular-nums; }

  #legend { position:absolute; top:14px; right:14px; padding:12px 14px;
            background:rgba(20,10,5,0.72); border:1px solid #6b3f22;
            border-radius:10px; font-size:11px; line-height:1.7;
            backdrop-filter:blur(6px); max-width:220px; }
  #legend .dot { display:inline-block; width:10px; height:10px;
                 border-radius:50%; margin-right:8px; vertical-align:middle; }
  #tooltip { position:absolute; padding:6px 10px;
             background:rgba(20,10,5,0.9); border:1px solid #6b3f22;
             border-radius:6px; font-size:11px; pointer-events:none;
             display:none; z-index:100; white-space:nowrap; }
</style>
</head>
<body>
<div id="app"></div>

<div id="hud">
  <h1 id="title">Sol-Window Planner</h1>
  <div class="sub" id="subtitle">Interactive mission view · Mars</div>
  <div class="stats">
    <span>Sol</span><b id="s-sol">0.0</b>
    <span>τ opacity</span><b id="s-tau">—</b>
    <span>Distance</span><b id="s-dist">— km</b>
    <span>ETA</span><b id="s-eta">— sols</b>
  </div>
  <div class="status drive" id="s-status">READY</div>
</div>

<div id="legend">
  <div><span class="dot" style="background:#ff5040"></span>Planned route</div>
  <div><span class="dot" style="background:#40e0ff"></span>Water deposits</div>
  <div><span class="dot" style="background:#40ff80"></span>Rover start</div>
  <div><span class="dot" style="background:#ffb060"></span>Rover position</div>
  <div style="margin-top:6px; color:#a07a55;">Drag: orbit · scroll: zoom · right-drag: pan</div>
</div>

<div id="controls">
  <button id="btn-play">▶ Play</button>
  <button id="btn-reset">↻</button>
  <input id="scrub" type="range" min="0" max="1000" value="0">
  <span class="sol-label" id="sol-label">Sol 0.0</span>
  <button id="btn-cam">📷 Fly</button>
</div>

<div id="tooltip"></div>

<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }
}
</script>

<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const D = __PAYLOAD__;
document.getElementById('title').textContent = D.title;
document.getElementById('subtitle').textContent =
  `${D.route.length} waypoints · target: ${D.deposits[0].name.split(' · ')[0] || D.deposits[0].name}`;
document.getElementById('s-eta').textContent = D.eta.toFixed(1) + ' sols';
document.getElementById('s-dist').textContent = D.totalKm.toFixed(1) + ' km';

// ---------- scene setup ----------
const app = document.getElementById('app');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0a05);
scene.fog = new THREE.FogExp2(0x2a1508, 0.005);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 4000);
camera.position.set(D.w * 0.9, D.h * 0.9, Math.max(D.w, D.h) * 0.6);
camera.lookAt(D.w/2, D.h/2, 0);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(D.w/2, D.h/2, 0);

// ---------- lights ----------
const sun = new THREE.DirectionalLight(0xffd8a0, 1.2);
sun.position.set(D.w * 1.5, D.h * 1.5, 300);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -D.w; sun.shadow.camera.right = D.w;
sun.shadow.camera.top = D.h; sun.shadow.camera.bottom = -D.h;
scene.add(sun);
scene.add(new THREE.AmbientLight(0x604030, 0.5));
const rim = new THREE.DirectionalLight(0x8060ff, 0.25);
rim.position.set(-D.w, -D.h, 400); scene.add(rim);

// ---------- terrain ----------
const zScale = 0.25;
const geo = new THREE.PlaneGeometry(D.w, D.h, D.w - 1, D.h - 1);
geo.rotateX(-Math.PI / 2);
geo.translate(D.w/2, D.h/2, 0);
// Height-map: apply elevation as Y (up)
const pos = geo.attributes.position;
const eArr = D.elev;
for (let i = 0; i < pos.count; i++) {
  const x = i % D.w;
  const z = Math.floor(i / D.w);
  const eVal = eArr[z * D.w + x];
  pos.setY(i, (eVal - D.eMin) * zScale);
}
geo.computeVertexNormals();

// Vertex colours from terrain class + elevation
const colors = new Float32Array(pos.count * 3);
const c = new THREE.Color();
for (let i = 0; i < pos.count; i++) {
  const x = i % D.w;
  const z = Math.floor(i / D.w);
  const eVal = eArr[z * D.w + x];
  const tclass = D.terrainClass[z * D.w + x];
  const norm = (eVal - D.eMin) / Math.max(D.eMax - D.eMin, 1);
  // base Martian red-orange
  c.setHSL(0.05 + norm * 0.03, 0.55, 0.28 + norm * 0.20);
  if (tclass === 2) c.setRGB(c.r * 1.1, c.g * 1.0, c.b * 0.7); // sand
  if (tclass === 1) c.setRGB(c.r * 0.85, c.g * 0.85, c.b * 0.85); // bedrock
  if (tclass === 3) c.setRGB(0.15, 0.10, 0.08); // rock
  colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
}
geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const mat = new THREE.MeshStandardMaterial({
  vertexColors: true, roughness: 0.95, metalness: 0.02,
  flatShading: false,
});
const terrain = new THREE.Mesh(geo, mat);
terrain.receiveShadow = true;
scene.add(terrain);

// Helper: convert (row, col) → world (x, y up, z)
function toWorld(row, col, lift = 1) {
  const x = col;
  const z = row;
  const idx = Math.max(0, Math.min(D.h - 1, row)) * D.w
            + Math.max(0, Math.min(D.w - 1, col));
  const y = (eArr[idx] - D.eMin) * zScale + lift;
  return new THREE.Vector3(x, y, z);
}

// ---------- route polyline ----------
const routePts = D.route.map(([r, c]) => toWorld(r, c, 0.6));
const routeGeo = new THREE.BufferGeometry().setFromPoints(routePts);
const routeMat = new THREE.LineBasicMaterial({ color: 0xff5040, linewidth: 3, transparent: true, opacity: 0.9 });
const routeLine = new THREE.Line(routeGeo, routeMat);
scene.add(routeLine);

// Draw a glowing "already-driven" segment
const drivenGeo = new THREE.BufferGeometry();
drivenGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(routePts.length * 3), 3));
drivenGeo.setDrawRange(0, 0);
const drivenMat = new THREE.LineBasicMaterial({ color: 0xffb060, linewidth: 4 });
const drivenLine = new THREE.Line(drivenGeo, drivenMat);
scene.add(drivenLine);

// ---------- deposit markers ----------
const depMeshes = [];
D.deposits.forEach(d => {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(1.6, 5, 12),
    new THREE.MeshStandardMaterial({
      color: 0x40e0ff, emissive: 0x1090b0, emissiveIntensity: 0.7,
      roughness: 0.3, metalness: 0.5,
    })
  );
  cone.rotation.x = Math.PI;
  cone.position.y = 4;
  g.add(cone);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.15, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0x40e0ff, transparent: true, opacity: 0.8 })
  );
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  const pos = toWorld(d.row, d.col, 0.5);
  g.position.copy(pos);
  g.userData = d;
  scene.add(g);
  depMeshes.push(g);
});

// ---------- start marker ----------
const startMarker = new THREE.Mesh(
  new THREE.ConeGeometry(1.4, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0x40ff80, emissive: 0x109050, emissiveIntensity: 0.7 })
);
const sp = toWorld(D.start[0], D.start[1], 3);
startMarker.position.copy(sp);
startMarker.rotation.x = Math.PI;
scene.add(startMarker);

// ---------- rover ----------
const rover = new THREE.Group();
const roverBody = new THREE.Mesh(
  new THREE.BoxGeometry(2.4, 1.2, 3.2),
  new THREE.MeshStandardMaterial({ color: 0xd8d0c0, metalness: 0.6, roughness: 0.4 })
);
roverBody.castShadow = true;
rover.add(roverBody);
const roverPanel = new THREE.Mesh(
  new THREE.BoxGeometry(2.6, 0.1, 3.4),
  new THREE.MeshStandardMaterial({ color: 0x1a2a5a, metalness: 0.4, roughness: 0.2 })
);
roverPanel.position.y = 0.75;
rover.add(roverPanel);
// glowing beacon
const beacon = new THREE.Mesh(
  new THREE.SphereGeometry(0.4, 12, 12),
  new THREE.MeshBasicMaterial({ color: 0xffb060 })
);
beacon.position.y = 1.4;
rover.add(beacon);
rover.position.copy(routePts[0]);
scene.add(rover);

// ---------- dust particles for storm ----------
const dustGeo = new THREE.BufferGeometry();
const N_DUST = 3000;
const dustPos = new Float32Array(N_DUST * 3);
for (let i = 0; i < N_DUST; i++) {
  dustPos[i*3]   = Math.random() * D.w;
  dustPos[i*3+1] = Math.random() * 80;
  dustPos[i*3+2] = Math.random() * D.h;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustMat = new THREE.PointsMaterial({
  color: 0xc08050, size: 0.8, transparent: true, opacity: 0.0,
  sizeAttenuation: true,
});
const dust = new THREE.Points(dustGeo, dustMat);
scene.add(dust);

// ---------- animation / time ----------
const totalSols = D.tau.length;
let progress = 0;      // 0..1 across the route
let playing = false;
const scrub = document.getElementById('scrub');
const solLabel = document.getElementById('sol-label');
const btnPlay = document.getElementById('btn-play');
const btnReset = document.getElementById('btn-reset');
const btnCam = document.getElementById('btn-cam');
let flying = false;

btnPlay.onclick = () => {
  playing = !playing;
  btnPlay.textContent = playing ? '❚❚ Pause' : '▶ Play';
};
btnReset.onclick = () => { progress = 0; scrub.value = 0; };
btnCam.onclick = () => {
  flying = !flying;
  btnCam.textContent = flying ? '📷 Orbit' : '📷 Fly';
};
scrub.oninput = () => { progress = scrub.value / 1000; playing = false; btnPlay.textContent = '▶ Play'; };

// Tooltip
const tooltip = document.getElementById('tooltip');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
renderer.domElement.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(depMeshes, true);
  if (hits.length) {
    let g = hits[0].object;
    while (g.parent && !g.userData.name) g = g.parent;
    const d = g.userData;
    tooltip.innerHTML = `<b>${d.name}</b><br>Depth ${d.depth.toFixed(1)} m · Yield ${Math.round(d['yield'])} kg/m²`;
    tooltip.style.left = (e.clientX + 12) + 'px';
    tooltip.style.top = (e.clientY + 12) + 'px';
    tooltip.style.display = 'block';
  } else tooltip.style.display = 'none';
});

function updateHUD(sol) {
  const tauIdx = Math.min(totalSols - 1, Math.max(0, Math.floor(sol)));
  const tauVal = D.tau[tauIdx];
  document.getElementById('s-sol').textContent = sol.toFixed(1);
  document.getElementById('s-tau').textContent = tauVal.toFixed(2);
  const status = document.getElementById('s-status');
  if (progress >= 1) {
    status.className = 'status arrive';
    status.textContent = 'ARRIVED · SAMPLING ICE';
  } else if (tauVal > 1.0) {
    status.className = 'status hold';
    status.textContent = 'SAFETY HOLD · τ > 1.0';
  } else {
    status.className = 'status drive';
    status.textContent = 'DRIVING';
  }
  solLabel.textContent = `Sol ${sol.toFixed(1)}`;
  // storm dust visible when tau > 0.8
  dustMat.opacity = Math.max(0, Math.min(0.55, (tauVal - 0.7) * 1.1));
  // sky darkens with tau
  const skyBase = 0x1a0a05;
  const dark = Math.max(0, Math.min(1, (tauVal - 0.5) * 0.9));
  scene.background = new THREE.Color().setRGB(
    0.10 * (1 - dark * 0.6),
    0.04 * (1 - dark * 0.4),
    0.02
  );
  // sun dims with tau
  sun.intensity = Math.max(0.15, 1.2 * Math.exp(-1.2 * tauVal));
}

const clock = new THREE.Clock();
function animate() {
  const dt = clock.getDelta();
  // advance progress
  if (playing) {
    progress += dt / (totalSols * 0.6); // ~0.6s per sol on stage
    if (progress > 1) { progress = 1; playing = false; btnPlay.textContent = '▶ Play'; }
    scrub.value = progress * 1000;
  }
  // rover position along route
  const idxF = progress * (routePts.length - 1);
  const i0 = Math.floor(idxF);
  const i1 = Math.min(routePts.length - 1, i0 + 1);
  const t = idxF - i0;
  rover.position.lerpVectors(routePts[i0], routePts[i1], t);
  rover.position.y += 1.2;
  // face along the route
  if (i1 > i0) {
    const dir = new THREE.Vector3().subVectors(routePts[i1], routePts[i0]);
    rover.rotation.y = Math.atan2(dir.x, dir.z);
  }
  // driven-line update
  drivenGeo.setDrawRange(0, i0 + 1);
  const dp = drivenGeo.attributes.position.array;
  for (let k = 0; k <= i0; k++) {
    dp[k*3]   = routePts[k].x;
    dp[k*3+1] = routePts[k].y + 0.15;
    dp[k*3+2] = routePts[k].z;
  }
  drivenGeo.attributes.position.needsUpdate = true;

  // sol from route index
  const sol = D.routeSols.length ? D.routeSols[Math.min(i0, D.routeSols.length - 1)] +
                                    (i0 < D.routeSols.length - 1 ? t * 0.2 : 0)
                                  : progress * totalSols;
  updateHUD(sol);

  // dust drift
  const dparr = dustGeo.attributes.position.array;
  for (let i = 0; i < N_DUST; i++) {
    dparr[i*3] += dt * 5.0;
    if (dparr[i*3] > D.w) dparr[i*3] = 0;
  }
  dustGeo.attributes.position.needsUpdate = true;

  // beacon pulse
  beacon.scale.setScalar(1 + 0.35 * Math.sin(clock.elapsedTime * 4));

  // fly camera
  if (flying) {
    controls.enabled = false;
    const look = rover.position.clone();
    const offset = new THREE.Vector3(
      Math.cos(clock.elapsedTime * 0.2) * 25,
      18,
      Math.sin(clock.elapsedTime * 0.2) * 25,
    );
    camera.position.copy(look.clone().add(offset));
    camera.lookAt(look);
  } else {
    controls.enabled = true;
    controls.update();
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
</script>
</body>
</html>
"""
