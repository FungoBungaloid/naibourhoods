// Event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the Leaflet map
    const map = L.map('map', {
        attributionControl: true,
        zoomControl: false,
        minZoom: 9,
        maxZoom: 14
    }).setView([-37.8136, 144.9631], 11);

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

    // Function to parse CSV text
    function parseCSV(csvText) {
        return Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true }).data;
    }

    // Initialize timeout variables
    let mouseMoveTimeout;
    let canChangeOpacity = false;

    // Reference to the map container for manipulating opacity
    const mapContainer = map.getContainer();
    mapContainer.style.opacity = 0; // Initially set opacity to 0

    // Function to handle mouse movement
    function handleMouseMove() {
        if (canChangeOpacity) {
            clearTimeout(mouseMoveTimeout);
            mapContainer.style.opacity = 1;
            mouseMoveTimeout = setTimeout(() => {
                mapContainer.style.opacity = 0;
            }, 3000);
        }
    }

    // Function to handle map clicks
    function handleMapClick() {
        if (canChangeOpacity) {
            mapContainer.style.opacity = 0;
            // Additional logic for click behavior
        }
    }

    // Enable interactions with the map after 3 seconds
    setTimeout(() => {
        canChangeOpacity = true; // Allow opacity changes after 3 seconds
        mapContainer.style.opacity = 1; // Make map visible
    }, 3000);

    // Attach event listeners to the map for mouse movement and clicks
    map.on('mousemove', handleMouseMove);
    map.on('click', handleMapClick);

    // Style function for GeoJSON layer
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

    // Define actions for each feature (suburb) in the GeoJSON layer
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: function(e) {
                highlightFeature(e);
            },
            mouseout: function(e) {
                resetHighlight(e);
            },
            click: showSuburbData
        });

        if (feature.properties && feature.properties.name) {
            layer.bindTooltip(feature.properties.name, {
                permanent: true,
                direction: 'center',
                className: 'label'
            });
        }
    }

    // Highlight feature on mouseover
    function highlightFeature(e) {
        var layer = e.target;
        layer.setStyle({
            weight: 5,
            color: '#33ccff',
            dashArray: '',
            fillOpacity: 0.2
        });
    }

    // Reset highlight style on mouseout
    function resetHighlight(e) {
        var layer = e.target;
        layer.setStyle(defaultStyle);
    }

    // Default style for suburb boundaries
    const defaultStyle = {
        weight: 2,
        color: "#33ccff",
        dashArray: '',
        fillOpacity: 0.1
    };

    // Function to create and append text elements
    function createTextElement(id, text, animation, container) {
        const elem = document.createElement('div');
        elem.id = id;
        elem.textContent = text;
        elem.style.animation = animation;
        container.appendChild(elem);
    }

    let currentImage = 1;

    function showSuburbData(e) {
        const suburbName = e.target.feature.properties.SSC_NAME;
        const data = suburbData[suburbName];
        if (data) {
            const image1 = document.getElementById('backgroundImage1');
            const image2 = document.getElementById('backgroundImage2');
    
            // Determine which image to show and which to hide
            const showImage = currentImage === 1 ? image1 : image2;
            const hideImage = currentImage === 1 ? image2 : image1;
    
            // Set new image source
            showImage.src = 'images/' + suburbName + '.jpg';
    
            // Wait for the new image to load before starting the crossfade
            showImage.onload = () => {
                showImage.style.opacity = 1;
                hideImage.style.opacity = 0;
            };
    
            // Update text elements
            updateTextElement('suburbName', suburbName);
            updateTextElement('personQuote', data.Blurb, true); // true for slide-in effect
            updateTextElement('personDetails', `${data.Name}, ${data.Age}`);
            updateTextElement('personOccupation', data.Occupation);
    
            // Switch the current image for the next click
            currentImage = currentImage === 1 ? 2 : 1;
        }
    }
    

    function updateTextElement(elementId, newText, isQuote = false) {
        const element = document.getElementById(elementId);
        element.style.opacity = 0;
    
        // Wait for the fade-out to complete
        setTimeout(() => {
            element.textContent = newText;
    
            // Immediately reset the position of the quote without transition
            if (isQuote) {
                element.style.transition = 'none';
                element.style.transform = 'translateX(50px)';
            }
    
            // Introduce a brief delay to allow the browser to render the starting position
            setTimeout(() => {
                // Re-enable the transition and start the slide-in effect
                if (isQuote) {
                    element.style.transition = 'transform 1s ease, opacity 1s ease';
                    element.style.transform = 'translateX(0)';
                }
    
                // Fade in the new text
                element.style.opacity = 1;
            }, 50); // Adjust this delay as needed
        }, 1000); // Match the duration of the CSS opacity transition
    }

    // Function to load a random suburb
    function loadRandomSuburb(suburbData) {
        const suburbs = Object.keys(suburbData);
        const randomSuburb = suburbs[Math.floor(Math.random() * suburbs.length)];
        showSuburbData({ target: { feature: { properties: { SSC_NAME: randomSuburb } } } });
    }

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

    // Fetch and add the GeoJSON data to the map
    fetch('data/Suburbs.geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, { style: style, onEachFeature: onEachFeature }).addTo(map);
        });
});
