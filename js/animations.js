

let animationFrameId = null;
let currentHeadLine = null;
let visitedLines = [];

const HEAD_COLOR = '#00FF00';
const HEAD_WEIGHT = 5;
const VISITED_COLOR = '#006400';
const VISITED_WEIGHT = 3;
const VISITED_OPACITY = 0.5;
const FADE_DURATION_MS = 2000;

function animateFadingLines(map) {
    const now = performance.now();
    
    for (let i = visitedLines.length - 1; i >= 0; i--) {
        const { line, timestamp } = visitedLines[i];
        const age = now - timestamp;
        
        if (age > FADE_DURATION_MS) {
            map.removeLayer(line);
            visitedLines.splice(i, 1);
        } else {
            const opacity = VISITED_OPACITY * (1 - (age / FADE_DURATION_MS));
            line.setStyle({ opacity: Math.max(0.1, opacity) });
        }
    }

    if (visitedLines.length > 0 || currentHeadLine) {
        animationFrameId = requestAnimationFrame(() => animateFadingLines(map));
    } else {
        animationFrameId = null;
    }
}

function onStep(cameFrom, current, map) {
    if (currentHeadLine) {
        currentHeadLine.setStyle({
            color: VISITED_COLOR,
            weight: VISITED_WEIGHT,
            opacity: VISITED_OPACITY,
            className: 'visited-line'
        });
        visitedLines.push({ line: currentHeadLine, timestamp: performance.now() });
    }

    if (cameFrom.has(current)) {
        const prev = cameFrom.get(current);
        const newLine = L.polyline(
            [[prev.latLng.lat, prev.latLng.lng], [current.latLng.lat, current.latLng.lng]],
            {
                color: HEAD_COLOR,
                weight: HEAD_WEIGHT,
                opacity: 1,
                className: 'head-line'
            }
        ).addTo(map);
        currentHeadLine = newLine;
    }

    if (!animationFrameId) {
        animateFadingLines(map);
    }
}

function onFinish(cameFrom, current, algo, map, reconstructPath) {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    visitedLines.forEach(item => map.removeLayer(item.line));
    visitedLines.length = 0;
    if (currentHeadLine) {
        map.removeLayer(currentHeadLine);
        currentHeadLine = null;
    }

    if (current) {
        console.log(`${algo}: Path found!`);
        const finalPath = reconstructPath(cameFrom, current);
        if (finalPath.length > 0) {
            L.polyline(finalPath, { color: '#00FF00', weight: 5, className: 'final-path' }).addTo(map);
            console.log("Final path drawn.");
        } else {
            console.error("Final path not drawn due to reconstruction failure.");
        }
    } else {
        console.log(`${algo}: OpenSet is empty, no path found.`);
    }
}

function clearAllLines(map) {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    visitedLines.forEach(item => map.removeLayer(item.line));
    visitedLines.length = 0;
    if (currentHeadLine) {
        map.removeLayer(currentHeadLine);
        currentHeadLine = null;
    }
    // Remove all final paths too, for a complete clear
    map.eachLayer(function (layer) {
        if (layer instanceof L.Polyline && layer.options.className === 'final-path') {
            map.removeLayer(layer);
        }
    });
}

export { onStep, onFinish, clearAllLines };