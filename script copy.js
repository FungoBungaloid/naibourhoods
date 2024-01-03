document.addEventListener('DOMContentLoaded', function() {
    const map = L.map('map', {
        attributionControl: true,
        zoomControl: false,
        minZoom: 9,  // Set minimum zoom level
        maxZoom: 14  // Set maximum zoom level
    }).setView([-37.8136, 144.9631], 10);

    map.attributionControl.setPosition('topleft');

    let suburbData = {};
    fetch('data/Final.csv')
        .then(response => response.text())
        .then(text => {
            const data = parseCSV(text);
            data.forEach(row => {
                suburbData[row.Suburb] = row;
            });
        });

    function parseCSV(csvText) {
        return Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        }).data;
    }

    const tooltip = L.tooltip({
        permanent: false,
        direction: 'top',
        className: 'suburb-label'
    });

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

    const defaultStyle = {
        weight: 2,
        color: "#33ccff",
        dashArray: '',
        fillOpacity: 0.1
    };

    function highlightFeature(e) {
        var layer = e.target;
        layer.setStyle({
            weight: 5,
            color: '#33ccff',
            dashArray: '',
            fillOpacity: 0.2
        });
    }

    function resetHighlight(e) {
        var layer = e.target;
        layer.setStyle(defaultStyle);
    }

    function showSuburbData(e) {
        const suburbName = e.target.feature.properties.SSC_NAME;
        const data = suburbData[suburbName];
        if (data) {
            const image = document.getElementById('backgroundImage');
            image.onload = () => {
                image.classList.add('visible');
            };
            if (image.src) {
                image.classList.remove('visible');
            }
            image.src = 'images/' + suburbName + '.jpg';
            const infoDiv = document.getElementById('info');
            infoDiv.innerHTML = ''; // Clear existing content
            const nameElem = document.createElement('div');
            nameElem.id = 'suburbName';
            nameElem.textContent = suburbName;
            nameElem.style.animation = 'fadeInSlide 2s ease forwards';
            infoDiv.appendChild(nameElem);
    
            const quoteElem = document.createElement('div');
            quoteElem.id = 'personQuote';
            quoteElem.textContent = data.Blurb;
            quoteElem.style.animation = 'fadeInSlide 2.5s 0.5s ease forwards';
            infoDiv.appendChild(quoteElem);
    
            const detailsElem = document.createElement('div');
            detailsElem.id = 'personDetails';
            detailsElem.textContent = `${data.Name}, ${data.Age}`;
            detailsElem.style.animation = 'fadeInSlide 3s 1s ease forwards';
            infoDiv.appendChild(detailsElem);
    
            const occupationElem = document.createElement('div');
            occupationElem.id = 'personOccupation';
            occupationElem.textContent = data.Occupation;
            occupationElem.style.animation = 'fadeInSlide 3.5s 1.5s ease forwards';
            infoDiv.appendChild(occupationElem);
        }
    }

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

    let activityTimeout;
    function resetActivity() {
        if (activityTimeout) clearTimeout(activityTimeout);
        map.getContainer().style.opacity = 1;
        activityTimeout = setTimeout(() => {
            map.getContainer().style.opacity = 0;
        }, 1000); // 3 seconds of inactivity
    }
    
    map.on('mousemove', resetActivity);
    resetActivity(); // Initialize on load

    fetch('data/Suburbs.geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map);
        });
});
