import { reconstructPath, findPathDijkstra, findPathAStar } from './pathfinder.js';
import { fetchRoadData, buildGraphFromOSMData } from './graph.js';
import { onStep, onFinish, clearAllLines } from './animations.js';

let map = null;
let currentAnimationId = null; // This variable will store the ID of the active animation

async function startPathfinding(source, dest, algorithm) {
    // This is the critical part: Stop any running animation
    if (currentAnimationId) {
        cancelAnimationFrame(currentAnimationId);
        currentAnimationId = null; // Reset the ID
    }
    clearAllLines(map);

    console.log(`Starting ${algorithm} pathfinding...`);

    const bounds = L.latLngBounds(source, dest).pad(0.5);
    const osmData = await fetchRoadData(bounds);

    if (!osmData) {
        console.error("Pathfinding aborted: Could not get OSM data.");
        return;
    }

    const { start, end } = buildGraphFromOSMData(osmData, source, dest);
    if (!start || !end) {
        console.error("Start or End node could not be found in the OSM graph. They may be in an isolated area.");
        return;
    }

    // Pass a step callback that updates the animation ID
    const stepCallback = (cameFrom, current, animationId) => {
        onStep(cameFrom, current, map);
        currentAnimationId = animationId;
    };
    
    // Pass a finish callback that also clears the animation ID
    const finishCallback = (cameFrom, current, algo) => {
        currentAnimationId = null;
        onFinish(cameFrom, current, algo, map, reconstructPath);
    };

    if (algorithm === 'A*') {
        findPathAStar(start, end, stepCallback, finishCallback);
    } else if (algorithm === 'Dijkstra') {
        findPathDijkstra(start, end, stepCallback, finishCallback);
    }
}

// ... (The rest of your script.js file remains the same) ...

const params = new URLSearchParams(window.location.search);
const src = params.get("source")?.split(",").map(x => parseFloat(x.trim()));
const dest = params.get("dest")?.split(",").map(x => parseFloat(x.trim()));

if (src && dest && src.length === 2 && dest.length === 2 && !src.some(isNaN) && !dest.some(isNaN)) {
    const center = [(src[0] + dest[0]) / 2, (src[1] + dest[1]) / 2];
    map = L.map("map").setView(center, 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
    }).addTo(map);

    L.marker(src).addTo(map).bindPopup("Source").openPopup();
    L.marker(dest).addTo(map).bindPopup("Destination").openPopup();

    map.fitBounds([src, dest]);
} else {
    alert("Invalid or a missing coordinates. Please go back and try again.");
}

const dijkstraBtn = document.getElementById("dijkstra-btn");
const astarBtn = document.getElementById("astar-btn");

if (dijkstraBtn) {
    dijkstraBtn.addEventListener("click", () => {
        if (!src || !dest) return;
        startPathfinding(L.latLng(src[0], src[1]), L.latLng(dest[0], dest[1]), 'Dijkstra');
    });
}

if (astarBtn) {
    astarBtn.addEventListener("click", () => {
        if (!src || !dest) return;
        startPathfinding(L.latLng(src[0], src[1]), L.latLng(dest[0], dest[1]), 'A*');
    });
}