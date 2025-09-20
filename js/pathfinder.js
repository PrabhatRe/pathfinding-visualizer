// Node class represents a point on the graph
class Node {
    constructor(latLng, osmId = null) {
        this.latLng = latLng;
        this.neighbors = [];
        this.osmId = osmId;
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.parent = null;
    }
}

// Haversine distance for calculating distance between two lat/lng points
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.min(1, Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Reconstructs the path by tracing back from the end node
function reconstructPath(cameFrom, current) {
    const path = [];
    const visitedOsmIds = new Set();
    while (current) {
        if (visitedOsmIds.has(current.osmId)) {
            console.error("Cycle detected in cameFrom map. Aborting path reconstruction.");
            return [];
        }
        visitedOsmIds.add(current.osmId);
        path.push([current.latLng.lat, current.latLng.lng]);
        current = cameFrom.get(current);
    }
    return path.reverse();
}

// Dijkstra's Algorithm implementation
function findPathDijkstra(start, end, onStep, onFinish) {
    const openSet = [start];
    const cameFrom = new Map();
    const gScore = new Map([[start, 0]]);
    const closedSet = new Set();

    function step() {
        if (openSet.length > 0) {
            let lowestIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if ((gScore.get(openSet[i]) || Infinity) < (gScore.get(openSet[lowestIndex]) || Infinity)) {
                    lowestIndex = i;
                }
            }
            const current = openSet.splice(lowestIndex, 1)[0];

            if (current.osmId === end.osmId) {
                onFinish(cameFrom, current, 'Dijkstra');
                return;
            }

            closedSet.add(current);

            for (const neighbor of current.neighbors) {
                if (closedSet.has(neighbor)) {
                    continue;
                }
                const tentativeG = gScore.get(current) + haversineDistance(current.latLng.lat, current.latLng.lng, neighbor.latLng.lat, neighbor.latLng.lng);

                if (tentativeG < (gScore.get(neighbor) || Infinity)) {
                    cameFrom.set(neighbor, current);
                    gScore.set(neighbor, tentativeG);
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
            // Pass the animation ID to the onStep function
            const animationId = requestAnimationFrame(step);
            onStep(cameFrom, current, animationId); 
            return;
        } else {
            onFinish(null, null, 'Dijkstra');
        }
    }
    const initialAnimationId = requestAnimationFrame(step);
    // onStep is called after the first frame is requested to avoid race condition
    onStep(cameFrom, start, initialAnimationId);
}

// A* Algorithm implementation
function findPathAStar(start, end, onStep, onFinish) {
    const openSet = [start];
    const cameFrom = new Map();
    const gScore = new Map([[start, 0]]);
    const fScore = new Map([[start, haversineDistance(start.latLng.lat, start.latLng.lng, end.latLng.lat, end.latLng.lng)]]);
    const closedSet = new Set();
    
    function step() {
        if (openSet.length > 0) {
            let lowestIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if ((fScore.get(openSet[i]) || Infinity) < (fScore.get(openSet[lowestIndex]) || Infinity)) {
                    lowestIndex = i;
                }
            }
            const current = openSet.splice(lowestIndex, 1)[0];
            
            if (current.osmId === end.osmId) {
                onFinish(cameFrom, current, 'A*');
                return;
            }
            
            closedSet.add(current);

            for (const neighbor of current.neighbors) {
                if (closedSet.has(neighbor)) {
                    continue;
                }
                const tentativeG = gScore.get(current) + haversineDistance(current.latLng.lat, current.latLng.lng, neighbor.latLng.lat, neighbor.latLng.lng);

                if (tentativeG < (gScore.get(neighbor) || Infinity)) {
                    cameFrom.set(neighbor, current); 
                    gScore.set(neighbor, tentativeG);
                    const newFScore = tentativeG + haversineDistance(neighbor.latLng.lat, neighbor.latLng.lng, end.latLng.lat, end.latLng.lng);
                    fScore.set(neighbor, newFScore);
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
            // Pass the animation ID to the onStep function
            const animationId = requestAnimationFrame(step);
            onStep(cameFrom, current, animationId);
            return;
        } else {
            onFinish(null, null, 'A*');
        }
    }
    const initialAnimationId = requestAnimationFrame(step);
    // onStep is called after the first frame is requested to avoid race condition
    onStep(cameFrom, start, initialAnimationId);
}

// Export functions for use in other files
export { haversineDistance, reconstructPath, Node, findPathDijkstra, findPathAStar };