document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map and set its view to Melbourne's coordinates
    const map = L.map('map').setView([-37.8136, 144.9631], 10);

    // Add an OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Store suburb data fetched from CSV
    let suburbData = {};

    // Fetch and process CSV data
    fetch('data/Final.csv')
        .then(response => response.text())
        .then(text => {
            const data = parseCSV(text);
            data.forEach(row => {
                suburbData[row.Suburb] = row;
            });
        });

    // Function to parse CSV text
    function parseCSV(csvText) {
        return Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        }).data;
    }
    

    // Function to define actions for each feature (suburb) in the GeoJSON layer
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: showSuburbData
        });
    }


    const defaultStyle = {
        weight: 2,
        color: "#ff7800",
        dashArray: '',
        fillOpacity: 0.5
    };
    


    // Function to highlight feature on mouseover
    function highlightFeature(e) {
        var layer = e.target;
        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });
    }

    function resetHighlight(e) {
        var layer = e.target;
        layer.setStyle(defaultStyle);
    }
    

    // Function to show suburb data on click
    function showSuburbData(e) {
        const suburbName = e.target.feature.properties.SSC_NAME; // Adjust based on your GeoJSON
        const data = suburbData[suburbName];
        if (data) {
            document.getElementById('suburbImage').src = 'images/' + suburbName + '.jpg';
            document.getElementById('suburbName').textContent = suburbName;
            document.getElementById('personName').textContent = data.Name;
            document.getElementById('personAge').textContent = data.Age;
            document.getElementById('personOccupation').textContent = data.Occupation;
            document.getElementById('personQuote').textContent = data.Blurb;
            // Add more fields as necessary
        }
    }
    

    // Fetch and add the GeoJSON data to the map
    fetch('data/Suburbs.geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function(feature) {
                    return defaultStyle;
                },
                onEachFeature: onEachFeature
            }).addTo(map);
           
        });

});
