export type WebCorePresetId =
  | "vanilla-landing"
  | "react-ui"
  | "three-scene"
  | "chart-dashboard"
  | "supabase-shell";

export type WebCorePresetPackage = {
  name: string;
  specifier: string;
};

export type WebCorePresetDefinition = {
  description: string;
  id: WebCorePresetId;
  label: string;
  markup: string;
  packages: WebCorePresetPackage[];
  script: string;
  styles: string;
};

export type WebCoreSuggestedPackage = {
  description: string;
  label: string;
  specifier: string;
};

const webCorePresetDefinitions: WebCorePresetDefinition[] = [
  {
    id: "vanilla-landing",
    label: "Landing Page",
    description: "A polished hero layout for product pages, waitlists, and frontend mockups.",
    packages: [],
    markup: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeOrbit Launch</title>
  </head>
  <body>
    <main class="page-shell">
      <section class="hero-card">
        <div class="hero-copy">
          <span class="eyebrow">CodeOrbit WebCore</span>
          <h1>Build frontend ideas without leaving the browser.</h1>
          <p>
            Ship demos, landing pages, and UI experiments with live preview, browser packages,
            and a smooth editing loop.
          </p>
          <div class="actions">
            <button id="primaryAction" type="button">Launch Preview</button>
            <button class="ghost" type="button">See Features</button>
          </div>
        </div>
        <div class="metrics-grid">
          <article>
            <span>Preview latency</span>
            <strong>Instant</strong>
          </article>
          <article>
            <span>Package flow</span>
            <strong>Browser-ready</strong>
          </article>
          <article>
            <span>Best for</span>
            <strong>Frontend projects</strong>
          </article>
        </div>
      </section>
    </main>
  </body>
</html>`,
    styles: `* {
  box-sizing: border-box;
}

:root {
  color-scheme: dark;
  --bg-top: #111827;
  --bg-bottom: #020617;
  --card: rgba(10, 15, 30, 0.72);
  --line: rgba(148, 163, 184, 0.18);
  --copy: #e5eefc;
  --muted: #94a3b8;
  --accent-a: #38bdf8;
  --accent-b: #22c55e;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: "Sora", "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 28%),
    radial-gradient(circle at bottom right, rgba(34, 197, 94, 0.16), transparent 26%),
    linear-gradient(160deg, var(--bg-top), var(--bg-bottom) 72%);
  color: var(--copy);
}

.page-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: clamp(24px, 4vw, 48px);
}

.hero-card {
  width: min(1100px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
  gap: 24px;
  padding: clamp(28px, 4vw, 48px);
  border: 1px solid var(--line);
  border-radius: 32px;
  background: var(--card);
  backdrop-filter: blur(22px);
  box-shadow: 0 30px 120px rgba(0, 0, 0, 0.38);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.12);
  color: #bae6fd;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 18px 0 16px;
  font-size: clamp(2.6rem, 7vw, 5.3rem);
  line-height: 0.92;
  letter-spacing: -0.06em;
}

.hero-copy p {
  max-width: 640px;
  margin: 0;
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.75;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

button {
  border: 0;
  border-radius: 999px;
  padding: 14px 20px;
  font: inherit;
  font-weight: 700;
  color: #03111c;
  background: linear-gradient(135deg, var(--accent-a), #7dd3fc);
  cursor: pointer;
}

button.ghost {
  color: var(--copy);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--line);
}

.metrics-grid {
  display: grid;
  gap: 14px;
}

.metrics-grid article {
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 20px;
  background: rgba(15, 23, 42, 0.72);
}

.metrics-grid span {
  display: block;
  color: var(--muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

.metrics-grid strong {
  display: block;
  margin-top: 10px;
  font-size: 1.55rem;
}

@media (max-width: 860px) {
  .hero-card {
    grid-template-columns: 1fr;
  }
}`,
    script: `const primaryAction = document.getElementById("primaryAction");

if (primaryAction) {
  primaryAction.addEventListener("click", () => {
    primaryAction.textContent = "Preview Live";
  });
}`,
  },
  {
    id: "react-ui",
    label: "React UI",
    description: "A browser-ready React starter that keeps component authoring clean without a local bundler.",
    packages: [
      { name: "react", specifier: "react@19.2.4" },
      { name: "react-dom", specifier: "react-dom@19.2.4" },
    ],
    markup: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeOrbit React UI</title>
  </head>
  <body>
    <main id="root"></main>
  </body>
</html>`,
    styles: `* {
  box-sizing: border-box;
}

:root {
  color-scheme: dark;
  --surface: rgba(12, 18, 32, 0.84);
  --line: rgba(148, 163, 184, 0.18);
  --text: #eff6ff;
  --muted: #94a3b8;
  --accent-a: #f97316;
  --accent-b: #22d3ee;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
  color: var(--text);
  background:
    radial-gradient(circle at 15% 20%, rgba(249, 115, 22, 0.18), transparent 26%),
    radial-gradient(circle at 85% 15%, rgba(34, 211, 238, 0.18), transparent 22%),
    linear-gradient(145deg, #0b1120, #020617 70%);
}

#root {
  min-height: 100vh;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
}

.board {
  width: min(1080px, 100%);
  display: grid;
  gap: 18px;
}

.hero {
  padding: clamp(28px, 5vw, 44px);
  border: 1px solid var(--line);
  border-radius: 30px;
  background: var(--surface);
  backdrop-filter: blur(18px);
  box-shadow: 0 34px 120px rgba(0, 0, 0, 0.34);
}

.hero-tag {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.16);
  color: #fed7aa;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero h1 {
  margin: 18px 0 14px;
  font-size: clamp(2.4rem, 7vw, 4.8rem);
  line-height: 0.92;
  letter-spacing: -0.06em;
}

.hero p {
  max-width: 620px;
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.cta {
  border: 0;
  border-radius: 999px;
  padding: 14px 18px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.cta-primary {
  color: #111827;
  background: linear-gradient(135deg, var(--accent-a), #fdba74);
}

.cta-secondary {
  color: var(--text);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--line);
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.metric {
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 18px;
  background: rgba(8, 15, 28, 0.74);
}

.metric-label {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.metric-value {
  margin-top: 12px;
  font-size: 1.7rem;
  font-weight: 700;
}

@media (max-width: 720px) {
  .metrics {
    grid-template-columns: 1fr;
  }
}`,
    script: `import React from "react";
import { createRoot } from "react-dom/client";

const h = React.createElement;

const metricCards = [
  { label: "Preview Loop", value: "Instant" },
  { label: "Package Flow", value: "Browser-first" },
  { label: "Best Use", value: "Frontend builds" },
];

function MetricCard({ label, value }) {
  return h(
    "article",
    { className: "metric" },
    h("span", { className: "metric-label" }, label),
    h("strong", { className: "metric-value" }, value),
  );
}

function App() {
  return h(
    "main",
    { className: "app-shell" },
    h(
      "div",
      { className: "board" },
      h(
        "section",
        { className: "hero" },
        h("span", { className: "hero-tag" }, "React Starter"),
        h("h1", null, "Ship UI ideas straight from WebCore."),
        h(
          "p",
          null,
          "This preset uses real React in the browser, so you can shape components, layout, and interactions without a local build step.",
        ),
        h(
          "div",
          { className: "hero-actions" },
          h("button", { className: "cta cta-primary", type: "button" }, "Open Command Center"),
          h("button", { className: "cta cta-secondary", type: "button" }, "View Components"),
        ),
      ),
      h(
        "section",
        { className: "metrics" },
        ...metricCards.map((card) => h(MetricCard, { key: card.label, ...card })),
      ),
    ),
  );
}

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(h(App));
}`,
  },
  {
    id: "three-scene",
    label: "Three Scene",
    description: "A cinematic 3D starter for hero sections, product showcases, and interactive demos.",
    packages: [{ name: "three", specifier: "three@0.179.1" }],
    markup: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeOrbit Three Scene</title>
  </head>
  <body>
    <div id="sceneMount"></div>
    <aside class="scene-overlay">
      <span>Three.js starter</span>
      <h1>Build frontend visuals that feel alive.</h1>
      <p>Orbit around the model, tweak materials, and turn WebCore into a fast concept lab.</p>
    </aside>
  </body>
</html>`,
    styles: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  overflow: hidden;
  font-family: "Outfit", "Segoe UI", sans-serif;
  background: radial-gradient(circle at top, #111827, #020617 72%);
  color: #e2e8f0;
}

#sceneMount {
  position: fixed;
  inset: 0;
}

.scene-overlay {
  position: fixed;
  top: 24px;
  left: 24px;
  width: min(420px, calc(100vw - 48px));
  padding: 22px 24px;
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.68);
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

.scene-overlay span {
  display: inline-flex;
  color: #67e8f9;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.scene-overlay h1 {
  margin: 16px 0 14px;
  font-size: clamp(2.2rem, 5vw, 3.6rem);
  line-height: 0.94;
}

.scene-overlay p {
  margin: 0;
  color: #94a3b8;
  line-height: 1.7;
}`,
    script: `import * as THREE from "three";

const mount = document.getElementById("sceneMount");

if (!mount) {
  throw new Error("Missing #sceneMount container");
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.4, 4.8);

const ambient = new THREE.AmbientLight(0xffffff, 1.3);
scene.add(ambient);

const keyLight = new THREE.PointLight(0x38bdf8, 28, 100);
keyLight.position.set(3, 2, 4);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0xf97316, 20, 100);
rimLight.position.set(-3, -1, -3);
scene.add(rimLight);

const geometry = new THREE.TorusKnotGeometry(1, 0.28, 220, 32);
const material = new THREE.MeshPhysicalMaterial({
  color: 0x67e8f9,
  emissive: 0x0f172a,
  metalness: 0.45,
  roughness: 0.18,
  clearcoat: 1,
});
const knot = new THREE.Mesh(geometry, material);
scene.add(knot);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(5, 64),
  new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.55 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.8;
scene.add(floor);

function animate() {
  knot.rotation.x += 0.004;
  knot.rotation.y += 0.006;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onResize);
animate();`,
  },
  {
    id: "chart-dashboard",
    label: "Charts Dashboard",
    description: "A dashboard preset with a polished stats header and a live Chart.js canvas.",
    packages: [{ name: "chart.js", specifier: "chart.js@4.5.1" }],
    markup: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeOrbit Charts</title>
  </head>
  <body>
    <main class="dashboard-shell">
      <section class="headline-card">
        <div>
          <span class="eyebrow">Chart.js starter</span>
          <h1>Preview analytics dashboards in one tab.</h1>
          <p>Swap labels, connect APIs later, and shape the product feel before the backend is ready.</p>
        </div>
        <div class="stat-grid">
          <article><span>Conversion</span><strong>12.4%</strong></article>
          <article><span>MRR</span><strong>$48K</strong></article>
          <article><span>Churn</span><strong>1.8%</strong></article>
        </div>
      </section>
      <section class="chart-card">
        <canvas id="growthChart"></canvas>
      </section>
    </main>
  </body>
</html>`,
    styles: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: "Manrope", "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 24%),
    linear-gradient(160deg, #0f172a, #020617 72%);
  color: #e2e8f0;
}

.dashboard-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 28px;
  display: grid;
  gap: 18px;
}

.headline-card,
.chart-card {
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.76);
  backdrop-filter: blur(16px);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
}

.headline-card {
  padding: 28px;
  display: grid;
  gap: 22px;
}

.eyebrow {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.15);
  color: #bfdbfe;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.headline-card h1 {
  margin: 16px 0 14px;
  font-size: clamp(2.3rem, 5vw, 4.2rem);
  line-height: 0.94;
  letter-spacing: -0.05em;
}

.headline-card p {
  max-width: 640px;
  margin: 0;
  color: #94a3b8;
  line-height: 1.75;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.stat-grid article {
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
}

.stat-grid span {
  display: block;
  color: #94a3b8;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.stat-grid strong {
  display: block;
  margin-top: 12px;
  font-size: 1.8rem;
}

.chart-card {
  padding: 20px;
}

#growthChart {
  width: 100%;
  height: min(420px, 60vh);
}

@media (max-width: 760px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}`,
    script: `import Chart from "chart.js/auto";

const canvas = document.getElementById("growthChart");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Missing chart canvas");
}

const gradient = canvas.getContext("2d")?.createLinearGradient(0, 0, 0, 360);

if (gradient) {
  gradient.addColorStop(0, "rgba(59, 130, 246, 0.42)");
  gradient.addColorStop(1, "rgba(59, 130, 246, 0.02)");
}

new Chart(canvas, {
  type: "line",
  data: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Active users",
        data: [2400, 3100, 4200, 3900, 5100, 6800, 7400],
        fill: true,
        backgroundColor: gradient ?? "rgba(59, 130, 246, 0.12)",
        borderColor: "#60a5fa",
        tension: 0.34,
        borderWidth: 3,
        pointRadius: 0,
      },
    ],
  },
  options: {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#e2e8f0",
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(148, 163, 184, 0.08)" },
        ticks: { color: "#94a3b8" },
      },
      y: {
        grid: { color: "rgba(148, 163, 184, 0.08)" },
        ticks: { color: "#94a3b8" },
      },
    },
  },
});`,
  },
  {
    id: "supabase-shell",
    label: "Supabase Shell",
    description: "A browser-safe starter for auth and data experiments that need Supabase on the frontend.",
    packages: [{ name: "@supabase/supabase-js", specifier: "@supabase/supabase-js@2" }],
    markup: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeOrbit Supabase Shell</title>
  </head>
  <body>
    <main class="shell">
      <section class="config-card">
        <div class="copy">
          <span class="eyebrow">Supabase starter</span>
          <h1>Connect browser flows without leaving WebCore.</h1>
          <p>Paste a project URL and anon key, then start wiring login, queries, or realtime UI from this shell.</p>
        </div>
        <label>
          <span>Supabase URL</span>
          <input id="supabaseUrl" placeholder="https://your-project.supabase.co" />
        </label>
        <label>
          <span>Anon Key</span>
          <input id="supabaseAnonKey" placeholder="Paste your public anon key" />
        </label>
        <button id="connectButton" type="button">Create Client</button>
        <div id="statusCard" class="status-card">Waiting for credentials.</div>
      </section>
    </main>
  </body>
</html>`,
    styles: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: "General Sans", "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top right, rgba(16, 185, 129, 0.16), transparent 24%),
    linear-gradient(160deg, #04130f, #020617 72%);
  color: #ecfeff;
}

.shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.config-card {
  width: min(640px, 100%);
  display: grid;
  gap: 16px;
  padding: clamp(24px, 5vw, 34px);
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(8, 19, 17, 0.78);
  backdrop-filter: blur(18px);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.34);
}

.eyebrow {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.14);
  color: #a7f3d0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.copy h1 {
  margin: 16px 0 14px;
  font-size: clamp(2.1rem, 5vw, 4rem);
  line-height: 0.96;
}

.copy p {
  margin: 0;
  color: #99f6e4;
  line-height: 1.75;
}

label {
  display: grid;
  gap: 8px;
}

label span {
  color: #99f6e4;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.03);
  color: #f0fdfa;
  font: inherit;
}

button {
  border: 0;
  border-radius: 18px;
  padding: 14px 18px;
  font: inherit;
  font-weight: 700;
  color: #022c22;
  background: linear-gradient(135deg, #34d399, #99f6e4);
  cursor: pointer;
}

.status-card {
  min-height: 68px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(148, 163, 184, 0.14);
  color: #ccfbf1;
  line-height: 1.7;
}`,
    script: `import { createClient } from "@supabase/supabase-js";

const connectButton = document.getElementById("connectButton");
const statusCard = document.getElementById("statusCard");
const supabaseUrlInput = document.getElementById("supabaseUrl");
const supabaseAnonKeyInput = document.getElementById("supabaseAnonKey");

function writeStatus(message) {
  if (statusCard) {
    statusCard.textContent = message;
  }
}

connectButton?.addEventListener("click", () => {
  const supabaseUrl = supabaseUrlInput instanceof HTMLInputElement ? supabaseUrlInput.value.trim() : "";
  const supabaseAnonKey = supabaseAnonKeyInput instanceof HTMLInputElement ? supabaseAnonKeyInput.value.trim() : "";

  if (!supabaseUrl || !supabaseAnonKey) {
    writeStatus("Add both the Supabase URL and anon key to create a client.");
    return;
  }

  createClient(supabaseUrl, supabaseAnonKey);
  writeStatus("Supabase client created. You can now add auth, select queries, or realtime listeners in script.js.");
});`,
  },
];

const webCoreSuggestedPackages: WebCoreSuggestedPackage[] = [
  {
    label: "React",
    specifier: "react@19.2.4",
    description: "Browser React components and stateful UI",
  },
  {
    label: "React DOM",
    specifier: "react-dom@19.2.4",
    description: "Client rendering for React starters",
  },
  {
    label: "htm",
    specifier: "htm@3.1.1",
    description: "JSX-free templating for browser React setups",
  },
  {
    label: "Three.js",
    specifier: "three@0.179.1",
    description: "3D scenes, shaders, and visual demos",
  },
  {
    label: "Chart.js",
    specifier: "chart.js@4.5.1",
    description: "Frontend-ready charts and dashboards",
  },
  {
    label: "Supabase",
    specifier: "@supabase/supabase-js@2",
    description: "Auth and browser database workflows",
  },
  {
    label: "GSAP",
    specifier: "gsap@3.14.2",
    description: "Product motion and animation timelines",
  },
  {
    label: "Zod",
    specifier: "zod@4.3.6",
    description: "Runtime validation for frontend forms and APIs",
  },
];

export function getWebCorePresetDefinitions() {
  return webCorePresetDefinitions;
}

export function getWebCorePreset(presetId: WebCorePresetId) {
  return webCorePresetDefinitions.find((preset) => preset.id === presetId) ?? webCorePresetDefinitions[0];
}

export function getWebCoreSuggestedPackages() {
  return webCoreSuggestedPackages;
}
