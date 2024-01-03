// Event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the Leaflet map
    const map = L.map('map', {
        attributionControl: true,
        zoomControl: false,
        minZoom: 9,
        maxZoom: 14
    }).setView([-37.8136, 144.9631], 10);

    // Move the attribution control to the top left corner
    map.attributionControl.setPosition('bottomright');

    // About popup functionality
    var aboutButton = document.getElementById('aboutButton');
    var aboutPopup = document.getElementById('aboutPopup');
    var closeButton = document.querySelector('.close');

    // Show the popup when the About button is clicked
    aboutButton.onclick = function() {
        aboutPopup.style.display = 'block';
    };

    // Close the popup when the Close button (x) is clicked
    closeButton.onclick = function() {
        aboutPopup.style.display = 'none';
    };

    // Close the popup when clicking outside of it
    window.onclick = function(event) {
        if (event.target === aboutPopup) {
            aboutPopup.style.display = 'none';
        }
    };

    // Fetch and process suburb data from CSV
    let suburbData = {};
    fetch('data/Final.csv')
        .then(response => response.text())
        .then(text => {
            const data = parseCSV(text);
            data.forEach(row => {
                suburbData[row.Suburb] = row;
            });
            loadRandomSuburb(suburbData);
        });

    // Function to parse CSV text
    function parseCSV(csvText) {
        return Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true }).data;
    }

    // Tooltip configuration
    const tooltip = L.tooltip({
        permanent: false,
        direction: 'top',
        className: 'suburb-label'
    });

    // Define actions for each feature (suburb) in the GeoJSON layer
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: function(e) {
                highlightFeature(e);
                const suburbName = e.target.feature.properties.SSC_NAME;
                layer.bindTooltip(suburbName, tooltip).openTooltip(e.latlng);
            },
            mouseout: function(e) {
                resetHighlight(e);
                layer.closeTooltip();
            },
            click: showSuburbData
        });
    }

    // Default style for suburb boundaries
    const defaultStyle = { weight: 2, color: "#33ccff", dashArray: '', fillOpacity: 0.1 };

    // Highlight feature on mouseover
    function highlightFeature(e) {
        var layer = e.target;
        layer.setStyle({ weight: 5, color: '#33ccff', dashArray: '', fillOpacity: 0.2 });
    }

    // Reset highlight style
    function resetHighlight(e) {
        var layer = e.target;
        layer.setStyle(defaultStyle);
    }

    // Show suburb data on click
    function showSuburbData(e) {
        const suburbName = e.target.feature.properties.SSC_NAME;
        const data = suburbData[suburbName];
        if (data) {
            const image = document.getElementById('backgroundImage');
            image.onload = () => { image.classList.add('visible'); };
            if (image.src) { image.classList.remove('visible'); }
            image.src = 'images/' + suburbName + '.jpg';

            // Update text elements
            const infoDiv = document.getElementById('info');
            infoDiv.innerHTML = '';
            createTextElement('suburbName', suburbName, 'fadeInSlide 2s ease forwards', infoDiv);
            createTextElement('personQuote', data.Blurb, 'fadeInSlide 2.5s 0.5s ease forwards', infoDiv);
            createTextElement('personDetails', `${data.Name}, ${data.Age}`, 'fadeInSlide 3s 1s ease forwards', infoDiv);
            createTextElement('personOccupation', data.Occupation, 'fadeInSlide 3.5s 1.5s ease forwards', infoDiv);
        }
    }

    // Create and append text elements
    function createTextElement(id, text, animation, container) {
        const elem = document.createElement('div');
        elem.id = id;
        elem.textContent = text;
        elem.style.animation = animation;
        container.appendChild(elem);
    }

    // Function to load a random suburb
    function loadRandomSuburb(suburbData) {
        const suburbs = Object.keys(suburbData);
        const randomSuburb = suburbs[Math.floor(Math.random() * suburbs.length)];
        showSuburbData({ target: { feature: { properties: { SSC_NAME: randomSuburb } } } });
    }

    // Style for GeoJSON layer
    function style(feature) {
        return {
            weight: 3,
            color: "#33ccff",
            dashArray: '',
            fillOpacity: 0.0,
            fillColor: '#33ccff',
            className: 'suburb-boundary'
        };
    }

// Timeout for map fade out
let activityTimeout;
let canChangeOpacity = true;

function resetActivity() {
    if (activityTimeout) clearTimeout(activityTimeout);
    if (canChangeOpacity) {
        map.getContainer().style.opacity = 1;
    }
    activityTimeout = setTimeout(() => {
        if (canChangeOpacity) {
            map.getContainer().style.opacity = 0;
        }
    }, 3000); // Fade out after 3 seconds of inactivity
}

map.on('mousemove', resetActivity);
resetActivity();

map.on('click', () => {
    canChangeOpacity = false;
    map.getContainer().style.opacity = 0;
    setTimeout(() => {
        canChangeOpacity = true;
    }, 1000);
});

    // Fetch and add the GeoJSON data to the map
    fetch('data/Suburbs.geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, { style: style, onEachFeature: onEachFeature }).addTo(map);
        });
});
