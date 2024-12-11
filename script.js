const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

let markers = [];
let routeLayer = null;

function addMarker(lat, lon, label) {
    const marker = L.marker([lat, lon]).addTo(map).bindPopup(label);
    markers.push(marker);
}

function clearMap() {
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }

    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}


async function getCoordinates(location) {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&countrycodes=br`;

    try {
        const response = await fetch(nominatimUrl);
        const data = await response.json();

        if (data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                display_name: data[0].display_name, // Informação adicional para debugging
            };
        } else {
            throw new Error(`Localização não encontrada para: ${location}`);
        }
    } catch (error) {
        console.error("Erro ao buscar coordenadas:", error);
        alert("Erro ao buscar coordenadas. Verifique o nome da localidade e tente novamente.");
        return null;
    }
}



async function calculateRoute(lat1, lon1, lat2, lon2) {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const distance = route.distance / 1000; // km
            const duration = route.duration / 60; // minutos

            return { distance, duration, route };
        } else {
            throw new Error("Nenhuma rota encontrada.");
        }
    } catch (error) {
        console.error("Erro ao calcular a rota:", error);
        alert("Erro ao calcular a rota.");
        return null;
    }
}

document.getElementById("calculate-btn").addEventListener("click", async () => {
    const location1 = document.getElementById("location1").value;
    const location2 = document.getElementById("location2").value;

    if (!location1 || !location2) {
        alert("Por favor, insira os nomes das localidades.");
        return;
    }

    clearMap(); // Limpa marcadores e rotas anteriores

    const coords1 = await getCoordinates(location1);
    const coords2 = await getCoordinates(location2);

    if (!coords1 || !coords2) {
        return;
    }

    // Adicionar marcadores para os locais
    addMarker(coords1.lat, coords1.lon, location1);
    addMarker(coords2.lat, coords2.lon, location2);

    const result = await calculateRoute(coords1.lat, coords1.lon, coords2.lat, coords2.lon);

    if (result) {
        const { distance, duration, route } = result;

        // Exibir informações na interface
        document.getElementById("result").innerHTML = `Distância: ${distance.toFixed(2)} km | Duração: ${Math.round(duration)} min`;

        // Adicionar a rota no mapa
        routeLayer = L.geoJSON(route.geometry, {
            style: {
                color: "blue",
                weight: 5,
            },
        }).addTo(map);

        // Ajustar o zoom para a rota
        map.fitBounds(routeLayer.getBounds());
    }
});







