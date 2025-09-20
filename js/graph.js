import { Node, haversineDistance } from './pathfinder.js';

// Fetches raw road data from the Overpass API
async function fetchRoadData(bbox) {
    const [minLat, minLng, maxLat, maxLng] = [bbox.getSouth(), bbox.getWest(), bbox.getNorth(), bbox.getEast()];
    const overpassUrl = "https://overpass-api.de/api/interpreter";
    const query = `
        [out:json][timeout:25];
        (
          way["highway"](${minLat},${minLng},${maxLat},${maxLng});
          >;
        );
        out body;
    `;
    
    try {
        console.log("Fetching road data from Overpass API...");
        const response = await fetch(overpassUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("OSM data fetched successfully.");
        return data;
    } catch (error) {
        console.error("Failed to fetch OSM data:", error);
        return null;
    }
}

// Builds the graph data structure from the fetched OSM data
function buildGraphFromOSMData(osmData, source, dest) {
    const nodes = new Map();
    
    for (const element of osmData.elements) {
        if (element.type === 'node') {
            const latLng = L.latLng(element.lat, element.lon);
            nodes.set(element.id, new Node(latLng, element.id));
        }
    }

    for (const element of osmData.elements) {
        if (element.type === 'way' && element.nodes) {
            for (let i = 0; i < element.nodes.length - 1; i++) {
                const node1 = nodes.get(element.nodes[i]);
                const node2 = nodes.get(element.nodes[i + 1]);
                if (node1 && node2) {
                    node1.neighbors.push(node2);
                    node2.neighbors.push(node1);
                }
            }
        }
    }

    let startNode = null;
    let endNode = null;
    let minStartDist = Infinity;
    let minEndDist = Infinity;

    for (const node of nodes.values()) {
        if (node.neighbors.length > 0) {
            const startDist = haversineDistance(node.latLng.lat, node.latLng.lng, source.lat, source.lng);
            if (startDist < minStartDist) {
                minStartDist = startDist;
                startNode = node;
            }

            const endDist = haversineDistance(node.latLng.lat, node.latLng.lng, dest.lat, dest.lng);
            if (endDist < minEndDist) {
                minEndDist = endDist;
                endNode = node;
            }
        }
    }

    console.log("Graph built with", nodes.size, "nodes.");
    return { start: startNode, end: endNode, allNodes: Array.from(nodes.values()) };
}

export { fetchRoadData, buildGraphFromOSMData };