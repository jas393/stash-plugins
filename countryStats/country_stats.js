// country_stats.js - Performer distribution by country with world map and independent gender filters

(function() {
    // ==================== STRICT PAGE DETECTION ====================
    
    function isStatsPage() {
        const path = window.location.pathname;
        
        const exactMatches = [
            '/stats',
            '/stats/',
            '/statistics',
            '/statistics/'
        ];
        
        if (exactMatches.includes(path)) {
            return true;
        }
        
        if (path.endsWith('/stats') || path.endsWith('/stats/')) {
            return true;
        }
        
        if (path.includes('/stats') && 
            !path.includes('/performers/') && 
            !path.includes('/scenes/') && 
            !path.includes('/galleries/') && 
            !path.includes('/movies/') && 
            !path.includes('/studios/') && 
            !path.includes('/tags/')) {
            return true;
        }
        
        return false;
    }

    if (!isStatsPage()) {
        console.log("CountryStats: Not stats page, exiting");
        return;
    }

    console.log("CountryStats: Loading on stats page");

    // ==================== GENDER FILTER STATE ====================
    
    let currentGenderFilter = 'all'; // 'all', 'female', 'male', 'other'

    // ==================== GLOBAL TOOLTIP ====================
    
    if (!document.getElementById('country-stats-tooltip')) {
        const tooltipContainer = document.createElement('div');
        tooltipContainer.id = 'country-stats-tooltip';
        tooltipContainer.style.cssText = `
            position: fixed;
            display: none;
            z-index: 999999;
            pointer-events: none;
            background: var(--card-bg, #1a1a1a);
            border: 2px solid var(--border-color, #444);
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.8);
            width: 180px;
            transition: opacity 0.1s;
        `;
        document.body.appendChild(tooltipContainer);

        // Image container for performer tooltips
        const imageContainer = document.createElement('div');
        imageContainer.id = 'country-stats-tooltip-image-container';
        imageContainer.style.cssText = `
            width: 160px;
            height: 160px;
            margin-bottom: 8px;
        `;
        tooltipContainer.appendChild(imageContainer);

        const tooltipImage = document.createElement('img');
        tooltipImage.id = 'country-stats-tooltip-image';
        tooltipImage.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 4px;
        `;
        imageContainer.appendChild(tooltipImage);

        const tooltipFallback = document.createElement('div');
        tooltipFallback.id = 'country-stats-tooltip-fallback';
        tooltipFallback.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #888;
            font-size: 14px;
            text-align: center;
            background: var(--card-bg-alt, #3d3d3d);
            border-radius: 4px;
            display: none;
        `;
        tooltipFallback.textContent = 'No image';
        imageContainer.appendChild(tooltipFallback);

        // Performer name
        const tooltipName = document.createElement('div');
        tooltipName.id = 'country-stats-tooltip-name';
        tooltipName.style.cssText = `
            text-align: center;
            color: #ffd700;
            font-weight: bold;
            font-size: 0.95em;
            margin-bottom: 4px;
            word-wrap: break-word;
        `;
        tooltipContainer.appendChild(tooltipName);

        // Country info
        const tooltipCountry = document.createElement('div');
        tooltipCountry.id = 'country-stats-tooltip-country';
        tooltipCountry.style.cssText = `
            text-align: center;
            color: #4a9eff;
            font-size: 0.85em;
            margin-bottom: 4px;
        `;
        tooltipContainer.appendChild(tooltipCountry);
    }

    // ==================== COUNTRY COORDINATES ====================

    const countryCoordinates = {
       // North America
    'US': { lat: 39.5, lon: -98.0, name: 'United States' },
    'CA': { lat: 56.0, lon: -106.0, name: 'Canada' },
    'MX': { lat: 23.6, lon: -102.0, name: 'Mexico' },
    'GT': { lat: 15.8, lon: -90.2, name: 'Guatemala' },
    'BZ': { lat: 17.2, lon: -88.5, name: 'Belize' },
    'SV': { lat: 13.7, lon: -88.9, name: 'El Salvador' },
    'HN': { lat: 15.2, lon: -86.5, name: 'Honduras' },
    'NI': { lat: 12.9, lon: -85.0, name: 'Nicaragua' },
    'CR': { lat: 9.9, lon: -84.0, name: 'Costa Rica' },
    'PA': { lat: 8.5, lon: -80.0, name: 'Panama' },
    'CU': { lat: 21.5, lon: -78.0, name: 'Cuba' },
    'JM': { lat: 18.1, lon: -77.3, name: 'Jamaica' },
    'HT': { lat: 19.0, lon: -72.3, name: 'Haiti' },
    'DO': { lat: 19.0, lon: -70.7, name: 'Dominican Republic' },
    'PR': { lat: 18.2, lon: -66.5, name: 'Puerto Rico' },
    'BS': { lat: 25.0, lon: -77.4, name: 'Bahamas' },
    'TT': { lat: 10.5, lon: -61.2, name: 'Trinidad and Tobago' },
    'BB': { lat: 13.2, lon: -59.5, name: 'Barbados' },

    // South America
    'BR': { lat: -15.0, lon: -55.0, name: 'Brazil' },
    'AR': { lat: -45.0, lon: -77.0, name: 'Argentina' },
    'CL': { lat: -35.0, lon: -71.0, name: 'Chile' },
    'CO': { lat: -3, lon: -87.0, name: 'Colombia' },
    'VE': { lat: 7.0, lon: -66.0, name: 'Venezuela' },
    'PE': { lat: -9.0, lon: -75.0, name: 'Peru' },
    'BO': { lat: -17.0, lon: -65.0, name: 'Bolivia' },
    'PY': { lat: -23.0, lon: -58.0, name: 'Paraguay' },
    'UY': { lat: -32.0, lon: -56.0, name: 'Uruguay' },
    'GY': { lat: 5.0, lon: -59.0, name: 'Guyana' },
    'SR': { lat: 4.0, lon: -56.0, name: 'Suriname' },
    'GF': { lat: 4.0, lon: -53.0, name: 'French Guiana' },
    'EC': { lat: -1.0, lon: -78.0, name: 'Ecuador' },

    // Europe
    'GB': { lat: 54.0, lon: -2.0, name: 'United Kingdom' },
    'IE': { lat: 53.0, lon: -8.0, name: 'Ireland' },
    'FR': { lat: 46.0, lon: -5.0, name: 'France' },
    'DE': { lat: 51.0, lon: 9.0, name: 'Germany' },
    'IT': { lat: 40.0, lon: 3.0, name: 'Italy' },
    'ES': { lat: 35.0, lon: -10.0, name: 'Spain' },
    'PT': { lat: 39.0, lon: -8.0, name: 'Portugal' },
    'NL': { lat: 52.0, lon: 5.0, name: 'Netherlands' },
    'BE': { lat: 50.5, lon: 4.5, name: 'Belgium' },
    'LU': { lat: 49.8, lon: 6.1, name: 'Luxembourg' },
    'CH': { lat: 46.8, lon: 8.2, name: 'Switzerland' },
    'AT': { lat: 47.5, lon: 14.0, name: 'Austria' },
    'LI': { lat: 47.1, lon: 9.5, name: 'Liechtenstein' },
    'MC': { lat: 43.7, lon: 7.4, name: 'Monaco' },
    'SE': { lat: 62.0, lon: 15.0, name: 'Sweden' },
    'NO': { lat: 62.0, lon: 10.0, name: 'Norway' },
    'DK': { lat: 56.0, lon: 10.0, name: 'Denmark' },
    'FI': { lat: 64.0, lon: 26.0, name: 'Finland' },
    'IS': { lat: 65.0, lon: -18.0, name: 'Iceland' },
    'PL': { lat: 52.0, lon: 12.0, name: 'Poland' },
    'CZ': { lat: 49.8, lon: 15.5, name: 'Czechia' },
    'SK': { lat: 48.7, lon: 19.5, name: 'Slovakia' },
    'HU': { lat: 47.0, lon: 19.0, name: 'Hungary' },
    'RO': { lat: 46.0, lon: 25.0, name: 'Romania' },
    'BG': { lat: 38.7, lon: 19.0, name: 'Bulgaria' },
    'GR': { lat: 39.0, lon: 22.0, name: 'Greece' },
    'AL': { lat: 41.0, lon: 20.0, name: 'Albania' },
    'MK': { lat: 41.6, lon: 21.7, name: 'North Macedonia' },
    'RS': { lat: 44.0, lon: 21.0, name: 'Serbia' },
    'ME': { lat: 42.5, lon: 19.0, name: 'Montenegro' },
    'BA': { lat: 44.0, lon: 18.0, name: 'Bosnia and Herzegovina' },
    'HR': { lat: 45.1, lon: 15.2, name: 'Croatia' },
    'SI': { lat: 46.1, lon: 14.5, name: 'Slovenia' },
    'EE': { lat: 58.6, lon: 25.0, name: 'Estonia' },
    'LV': { lat: 56.9, lon: 24.6, name: 'Latvia' },
    'LT': { lat: 55.3, lon: 23.9, name: 'Lithuania' },
    'BY': { lat: 53.5, lon: 28.0, name: 'Belarus' },
    'UA': { lat: 49.0, lon: 32.0, name: 'Ukraine' },
    'MD': { lat: 47.0, lon: 20.0, name: 'Moldova' },
    'RU': { lat: 70.0, lon: 80.0, name: 'Russia' },
    'GE': { lat: 42.0, lon: 43.5, name: 'Georgia' },
    'AM': { lat: 40.5, lon: 45.0, name: 'Armenia' },
    'AZ': { lat: 40.5, lon: 47.5, name: 'Azerbaijan' },

    // Asia
    'CN': { lat: 35.0, lon: 105.0, name: 'China' },
    'JP': { lat: 36.0, lon: 138.0, name: 'Japan' },
    'KR': { lat: 36.5, lon: 128.0, name: 'South Korea' },
    'KP': { lat: 40.0, lon: 127.0, name: 'North Korea' },
    'MN': { lat: 46.0, lon: 105.0, name: 'Mongolia' },
    'TW': { lat: 23.5, lon: 121.0, name: 'Taiwan' },
    'HK': { lat: 22.3, lon: 114.2, name: 'Hong Kong' },
    'MO': { lat: 22.2, lon: 113.5, name: 'Macau' },
    'IN': { lat: 22.0, lon: 79.0, name: 'India' },
    'PK': { lat: 30.0, lon: 70.0, name: 'Pakistan' },
    'BD': { lat: 24.0, lon: 90.0, name: 'Bangladesh' },
    'LK': { lat: 7.0, lon: 81.0, name: 'Sri Lanka' },
    'NP': { lat: 28.0, lon: 84.0, name: 'Nepal' },
    'BT': { lat: 27.5, lon: 90.5, name: 'Bhutan' },
    'MM': { lat: 21.0, lon: 96.0, name: 'Myanmar' },
    'TH': { lat: 15.0, lon: 101.0, name: 'Thailand' },
    'LA': { lat: 18.0, lon: 105.0, name: 'Laos' },
    'KH': { lat: 13.0, lon: 105.0, name: 'Cambodia' },
    'VN': { lat: 16.0, lon: 108.0, name: 'Vietnam' },
    'MY': { lat: 3.0, lon: 102.0, name: 'Malaysia' },
    'SG': { lat: 1.4, lon: 103.8, name: 'Singapore' },
    'ID': { lat: -2.0, lon: 118.0, name: 'Indonesia' },
    'PH': { lat: 12.0, lon: 122.0, name: 'Philippines' },
    'BN': { lat: 4.5, lon: 114.7, name: 'Brunei' },
    'TL': { lat: -8.8, lon: 125.9, name: 'Timor-Leste' },

    // Middle East
    'IR': { lat: 32.0, lon: 53.0, name: 'Iran' },
    'IQ': { lat: 33.0, lon: 44.0, name: 'Iraq' },
    'SA': { lat: 24.0, lon: 45.0, name: 'Saudi Arabia' },
    'YE': { lat: 15.5, lon: 47.5, name: 'Yemen' },
    'OM': { lat: 21.0, lon: 57.0, name: 'Oman' },
    'AE': { lat: 24.0, lon: 54.0, name: 'United Arab Emirates' },
    'QA': { lat: 25.5, lon: 51.2, name: 'Qatar' },
    'KW': { lat: 29.3, lon: 47.5, name: 'Kuwait' },
    'BH': { lat: 26.0, lon: 50.5, name: 'Bahrain' },
    'SY': { lat: 35.0, lon: 38.0, name: 'Syria' },
    'LB': { lat: 33.8, lon: 35.9, name: 'Lebanon' },
    'JO': { lat: 31.0, lon: 36.0, name: 'Jordan' },
    'IL': { lat: 31.0, lon: 35.0, name: 'Israel' },
    'PS': { lat: 31.9, lon: 35.2, name: 'Palestine' },
    'CY': { lat: 35.0, lon: 33.0, name: 'Cyprus' },
    'TR': { lat: 39.0, lon: 35.0, name: 'Turkey' },

    // Africa
    'EG': { lat: 26.0, lon: 30.0, name: 'Egypt' },
    'LY': { lat: 27.0, lon: 17.0, name: 'Libya' },
    'TN': { lat: 28.0, lon: 3.0, name: 'Tunisia' },
    'DZ': { lat: 22.0, lon: -5.0, name: 'Algeria' },
    'MA': { lat: 25.0, lon: -14.0, name: 'Morocco' },
    'EH': { lat: 24.5, lon: -13.0, name: 'Western Sahara' },
    'MR': { lat: 20.0, lon: -12.0, name: 'Mauritania' },
    'SN': { lat: 14.5, lon: -14.5, name: 'Senegal' },
    'GM': { lat: 13.5, lon: -15.5, name: 'Gambia' },
    'GW': { lat: 12.0, lon: -15.0, name: 'Guinea-Bissau' },
    'GN': { lat: 10.0, lon: -11.0, name: 'Guinea' },
    'SL': { lat: 8.5, lon: -11.5, name: 'Sierra Leone' },
    'LR': { lat: 6.5, lon: -9.5, name: 'Liberia' },
    'CI': { lat: 7.5, lon: -5.5, name: 'Côte d\'Ivoire' },
    'GH': { lat: 7.5, lon: -1.0, name: 'Ghana' },
    'TG': { lat: 8.0, lon: 1.0, name: 'Togo' },
    'BJ': { lat: 9.5, lon: 2.3, name: 'Benin' },
    'BF': { lat: 12.0, lon: -1.5, name: 'Burkina Faso' },
    'ML': { lat: 17.0, lon: -4.0, name: 'Mali' },
    'NE': { lat: 17.0, lon: 8.0, name: 'Niger' },
    'NG': { lat: 9.0, lon: 8.0, name: 'Nigeria' },
    'CM': { lat: 6.0, lon: 12.0, name: 'Cameroon' },
    'CF': { lat: 7.0, lon: 21.0, name: 'Central African Republic' },
    'TD': { lat: 15.0, lon: 19.0, name: 'Chad' },
    'SD': { lat: 16.0, lon: 30.0, name: 'Sudan' },
    'SS': { lat: 7.0, lon: 30.0, name: 'South Sudan' },
    'ER': { lat: 15.0, lon: 39.0, name: 'Eritrea' },
    'ET': { lat: 9.0, lon: 40.0, name: 'Ethiopia' },
    'DJ': { lat: 11.5, lon: 43.0, name: 'Djibouti' },
    'SO': { lat: 5.0, lon: 46.0, name: 'Somalia' },
    'KE': { lat: 1.0, lon: 38.0, name: 'Kenya' },
    'UG': { lat: 1.0, lon: 33.0, name: 'Uganda' },
    'TZ': { lat: -6.0, lon: 35.0, name: 'Tanzania' },
    'RW': { lat: -2.0, lon: 30.0, name: 'Rwanda' },
    'BI': { lat: -3.5, lon: 30.0, name: 'Burundi' },
    'CD': { lat: -2.0, lon: 23.0, name: 'DR Congo' },
    'CG': { lat: -1.0, lon: 15.0, name: 'Republic of Congo' },
    'GA': { lat: -1.0, lon: 11.8, name: 'Gabon' },
    'GQ': { lat: 1.5, lon: 10.0, name: 'Equatorial Guinea' },
    'AO': { lat: -21.0, lon: 10.0, name: 'Angola' },
    'ZM': { lat: -15.0, lon: 27.0, name: 'Zambia' },
    'ZW': { lat: -19.0, lon: 30.0, name: 'Zimbabwe' },
    'MW': { lat: -13.5, lon: 34.0, name: 'Malawi' },
    'MZ': { lat: -18.0, lon: 35.0, name: 'Mozambique' },
    'MG': { lat: -20.0, lon: 47.0, name: 'Madagascar' },
    'KM': { lat: -12.0, lon: 44.0, name: 'Comoros' },
    'SC': { lat: -4.5, lon: 55.5, name: 'Seychelles' },
    'MU': { lat: -20.2, lon: 57.5, name: 'Mauritius' },
    'RE': { lat: -21.1, lon: 55.6, name: 'Réunion' },
    'YT': { lat: -12.8, lon: 45.2, name: 'Mayotte' },
    'BW': { lat: -22.0, lon: 24.0, name: 'Botswana' },
    'NA': { lat: -22.0, lon: 17.0, name: 'Namibia' },
    'ZA': { lat: -29.0, lon: 24.0, name: 'South Africa' },
    'SZ': { lat: -26.5, lon: 31.5, name: 'Eswatini' },
    'LS': { lat: -29.5, lon: 28.5, name: 'Lesotho' },

    // Oceania
    'AU': { lat: -25.0, lon: 135.0, name: 'Australia' },
    'NZ': { lat: -41.0, lon: 174.0, name: 'New Zealand' },
    'PG': { lat: -6.0, lon: 147.0, name: 'Papua New Guinea' },
    'FJ': { lat: -18.0, lon: 179.0, name: 'Fiji' },
    'SB': { lat: -8.0, lon: 159.0, name: 'Solomon Islands' },
    'VU': { lat: -16.0, lon: 167.0, name: 'Vanuatu' },
    'NC': { lat: -21.0, lon: 165.5, name: 'New Caledonia' },
    'PF': { lat: -15.0, lon: -140.0, name: 'French Polynesia' },
    'WS': { lat: -13.8, lon: -172.0, name: 'Samoa' },
    'TO': { lat: -20.0, lon: -175.0, name: 'Tonga' },
    'KI': { lat: -3.0, lon: -168.0, name: 'Kiribati' },
    'FM': { lat: 6.9, lon: 158.2, name: 'Micronesia' },
    'MH': { lat: 7.1, lon: 171.1, name: 'Marshall Islands' },
    'PW': { lat: 7.5, lon: 134.5, name: 'Palau' },
    'NR': { lat: -0.5, lon: 166.9, name: 'Nauru' },
    'TV': { lat: -8.5, lon: 179.2, name: 'Tuvalu' }
    };

    // ==================== MAP ZOOM STATE ====================
    
    let zoomLevel = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let mapContainer = null;
    let mapSvg = null;
    let mapImage = null;

    function initZoomControls(container) {
        mapContainer = container;
        mapSvg = container.querySelector('svg');
        mapImage = container.querySelector('.world-map-image');
        
        if (!mapSvg || !mapImage) return;
        
        // Add zoom controls
        const controlsDiv = document.createElement('div');
        controlsDiv.style.cssText = `
            position: absolute;
            top: 60px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            z-index: 100;
        `;
        
        const zoomInBtn = document.createElement('button');
        zoomInBtn.innerHTML = '+';
        zoomInBtn.style.cssText = `
            width: 30px;
            height: 30px;
            background: var(--card-bg, #2d2d2d);
            border: 1px solid var(--border-color, #4d4d4d);
            color: #ffd700;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: bold;
            transition: all 0.2s;
        `;
        zoomInBtn.onmouseover = () => zoomInBtn.style.background = '#4a9eff';
        zoomInBtn.onmouseout = () => zoomInBtn.style.background = 'var(--card-bg, #2d2d2d)';
        zoomInBtn.onclick = (e) => {
            e.stopPropagation();
            zoom(0.2);
        };
        
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.innerHTML = '−'; // Minus sign
        zoomOutBtn.style.cssText = `
            width: 30px;
            height: 30px;
            background: var(--card-bg, #2d2d2d);
            border: 1px solid var(--border-color, #4d4d4d);
            color: #ffd700;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: bold;
            transition: all 0.2s;
        `;
        zoomOutBtn.onmouseover = () => zoomOutBtn.style.background = '#4a9eff';
        zoomOutBtn.onmouseout = () => zoomOutBtn.style.background = 'var(--card-bg, #2d2d2d)';
        zoomOutBtn.onclick = (e) => {
            e.stopPropagation();
            zoom(-0.2);
        };
        
        const resetBtn = document.createElement('button');
        resetBtn.innerHTML = '0';
        resetBtn.style.cssText = `
            width: 30px;
            height: 30px;
            background: var(--card-bg, #2d2d2d);
            border: 1px solid var(--border-color, #4d4d4d);
            color: #ffd700;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.2s;
        `;
        resetBtn.onmouseover = () => resetBtn.style.background = '#4a9eff';
        resetBtn.onmouseout = () => resetBtn.style.background = 'var(--card-bg, #2d2d2d)';
        resetBtn.onclick = (e) => {
            e.stopPropagation();
            resetZoom();
        };
        
        controlsDiv.appendChild(zoomInBtn);
        controlsDiv.appendChild(zoomOutBtn);
        controlsDiv.appendChild(resetBtn);
        
        container.style.position = 'relative';
        container.appendChild(controlsDiv);
        
        // Add mouse drag for panning
        const mapWrapper = container.querySelector('.map-wrapper') || container;
        
        mapWrapper.onmousedown = (e) => {
            if (zoomLevel > 1) {
                isDragging = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                mapWrapper.style.cursor = 'grabbing';
                e.preventDefault();
            }
        };
        
        window.onmousemove = (e) => {
            if (isDragging && zoomLevel > 1) {
                const deltaX = e.clientX - lastMouseX;
                const deltaY = e.clientY - lastMouseY;
                
                panX += deltaX;
                panY += deltaY;
                
                updateTransform();
                
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
            }
        };
        
        window.onmouseup = () => {
            if (isDragging) {
                isDragging = false;
                mapWrapper.style.cursor = zoomLevel > 1 ? 'grab' : 'default';
            }
        };
        
        // Add wheel zoom
        mapWrapper.onwheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            zoom(delta, e.clientX, e.clientY);
        };
        
        // Set cursor
        mapWrapper.style.cursor = zoomLevel > 1 ? 'grab' : 'default';
    }

    function zoom(delta, clientX, clientY) {
        const oldZoom = zoomLevel;
        zoomLevel = Math.max(1, Math.min(5, zoomLevel + delta));
        
        if (clientX && mapContainer) {
            // Zoom towards mouse position
            const rect = mapContainer.getBoundingClientRect();
            const mouseX = clientX - rect.left;
            const mouseY = clientY - rect.top;
            
            const scale = zoomLevel / oldZoom;
            
            panX = mouseX - (mouseX - panX) * scale;
            panY = mouseY - (mouseY - panY) * scale;
        }
        
        updateTransform();
        
        // Update cursor
        const mapWrapper = mapContainer.querySelector('.map-wrapper') || mapContainer;
        mapWrapper.style.cursor = zoomLevel > 1 ? 'grab' : 'default';
    }

    function resetZoom() {
        zoomLevel = 1;
        panX = 0;
        panY = 0;
        updateTransform();
        
        const mapWrapper = mapContainer.querySelector('.map-wrapper') || mapContainer;
        mapWrapper.style.cursor = 'default';
    }

    function updateTransform() {
        if (!mapSvg || !mapImage) return;
        
        const transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
        mapSvg.style.transform = transform;
        mapImage.style.transform = transform;
        
        // Update transform origin
        mapSvg.style.transformOrigin = '0 0';
        mapImage.style.transformOrigin = '0 0';
    }

    // ==================== MAP BACKGROUND ====================

    let mapImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg'; // Default map

    function createMapFileInput() {
        const input = document.createElement('input');
        input.type = 'file';
        input.id = 'map-file-input';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    mapImageUrl = event.target.result;
                    const mapContainer = document.getElementById('world-map-container');
                    if (mapContainer) {
                        const mapImg = mapContainer.querySelector('.world-map-image');
                        if (mapImg) {
                            mapImg.src = mapImageUrl;
                        }
                    }
                };
                reader.readAsDataURL(file);
            }
        });
        
        document.body.appendChild(input);
        return input;
    }

    function createCountryWindow(countryCode, countryName, performers) {
        const windowId = `country-window-${countryCode}`;
        
        // Close any existing window for this country
        const existingWindow = document.getElementById(windowId);
        if (existingWindow) {
            existingWindow.remove();
            return null;
        }
        
        // Create new window
        const windowDiv = document.createElement('div');
        windowDiv.id = windowId;
        windowDiv.style.cssText = `
            position: absolute;
            background: var(--card-bg, #2d2d2d);
            border: 2px solid #4a9eff;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.8);
            min-width: 300px;
            max-width: 500px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 10000;
            pointer-events: auto;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        `;
        
        // Window header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border-color, #4d4d4d);
            position: sticky;
            top: 0;
            background: var(--card-bg, #2d2d2d);
            z-index: 1;
        `;
        
        const title = document.createElement('div');
        title.style.cssText = `
            color: #ffd700;
            font-weight: bold;
            font-size: 1.2em;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        title.innerHTML = `${getFlagEmoji(countryCode)} ${countryName} (${performers.length})`;
        
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            cursor: pointer;
            color: #888;
            font-size: 1.2em;
            padding: 0 8px;
            transition: color 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.color = '#ff6b6b';
        closeBtn.onmouseout = () => closeBtn.style.color = '#888';
        closeBtn.onclick = () => windowDiv.remove();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        windowDiv.appendChild(header);
        
        // Performer grid
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 10px;
            padding: 5px;
        `;
        
        performers.forEach(p => {
            const card = document.createElement('div');
            
            // Set background color based on favorite status
            const bgColor = p.favorite ? '#ff69b4' : 'var(--card-bg-alt, #3d3d3d)';
            const hoverColor = p.favorite ? '#ff1493' : '#4a9eff';
            
            card.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                cursor: pointer;
                padding: 8px;
                border-radius: 6px;
                background: ${bgColor};
                transition: all 0.2s;
                position: relative;
            `;
            card.onmouseover = () => {
                card.style.background = hoverColor;
                card.style.transform = 'scale(1.05)';
            };
            card.onmouseout = () => {
                card.style.background = bgColor;
                card.style.transform = 'scale(1)';
            };
            card.onclick = (e) => {
                e.stopPropagation();
                openCountryPerformer(p.id);
            };
            
            // Add heart icon for favorites
            if (p.favorite) {
                const heartIcon = document.createElement('span');
                heartIcon.innerHTML = '❤️';
                heartIcon.style.cssText = `
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    font-size: 0.8em;
                    z-index: 1;
                `;
                card.appendChild(heartIcon);
            }
            
            // Image container
            const imgContainer = document.createElement('div');
            imgContainer.style.cssText = `
                width: 60px;
                height: 60px;
                border-radius: 50%;
                overflow: hidden;
                border: 2px solid ${p.favorite ? '#ff1493' : '#4a9eff'};
            `;
            
            const img = document.createElement('img');
            if (p.image_path) {
                img.src = p.image_path;
                img.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                `;
            } else {
                img.style.cssText = `
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #2d2d2d;
                    color: #888;
                    font-size: 0.8em;
                `;
                img.alt = 'No image';
                img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%232d2d2d"/><text x="30" y="35" font-size="12" text-anchor="middle" fill="%23888" font-family="Arial">No img</text></svg>';
            }
            
            imgContainer.appendChild(img);
            card.appendChild(imgContainer);
            
            // Performer name
            const name = document.createElement('div');
            name.style.cssText = `
                font-size: 0.75em;
                color: ${p.favorite ? '#fff' : '#ffd700'};
                text-align: center;
                word-break: break-word;
                max-width: 70px;
                font-weight: ${p.favorite ? 'bold' : 'normal'};
            `;
            name.textContent = p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name;
            card.appendChild(name);
            
            // Country flag (small)
            if (p.countryFlag) {
                const flag = document.createElement('span');
                flag.style.cssText = `
                    font-size: 0.9em;
                `;
                flag.textContent = p.countryFlag;
                card.appendChild(flag);
            }
            
            grid.appendChild(card);
        });
        
        windowDiv.appendChild(grid);
        
        return windowDiv;
    }

    function generateWorldMapWithDots(countryData, allPerformers, totalPerformers) {
        const fileInput = document.getElementById('map-file-input') || createMapFileInput();
        
        // Create a map of country counts and performers
        const countryMap = {};
        const countryPerformers = {};
        countryData.forEach(c => {
            if (c.code) {
                countryMap[c.code] = c.count;
                countryPerformers[c.code] = c.performers;
            }
        });

        // Find max count for dot sizing
        const maxCount = Math.max(...Object.values(countryMap), 0);

        // Generate dots for countries with data, sorted by size (largest first for Z-axis)
        const dots = [];
        const dotElements = [];
        
        Object.keys(countryCoordinates).forEach(code => {
            const coords = countryCoordinates[code];
            const count = countryMap[code] || 0;
            const performers = countryPerformers[code] || [];
            
            // Convert lat/lon to SVG coordinates
            const x = (coords.lon + 180) * (1000 / 360);
            const y = (90 - coords.lat) * (500 / 180);
            
            if (x >= 0 && x <= 1000 && y >= 0 && y <= 500) {
                const dotSize = count > 0 ? Math.max(8, Math.min(24, 8 + (count / maxCount) * 16)) : 0;
                const percentage = totalPerformers > 0 ? ((count / totalPerformers) * 100).toFixed(1) : '0';
                
                if (count > 0) {
                    dotElements.push({
                        code,
                        coords,
                        count,
                        percentage,
                        performers,
                        x,
                        y,
                        dotSize
                    });
                }
            }
        });
        
        // Sort dots by size (largest first) so larger dots appear on top
        dotElements.sort((a, b) => b.dotSize - a.dotSize);
        
        dotElements.forEach(({code, coords, count, percentage, performers, x, y, dotSize}) => {
            dots.push(`
                <circle 
                    cx="${x}" 
                    cy="${y}" 
                    r="${dotSize}" 
                    fill="#4a9eff" 
                    fill-opacity="0.8"
                    stroke="#ffd700" 
                    stroke-width="2"
                    data-country="${code}"
                    data-count="${count}"
                    data-name="${coords.name}"
                    data-flag="${getFlagEmoji(code)}"
                    data-percentage="${percentage}"
                    style="cursor: pointer; transition: all 0.2s;"
                    onmouseover="this.setAttribute('fill', '#ffd700'); this.setAttribute('r', '${dotSize + 2}'); showCountryDotTooltip('${code}', '${coords.name}', '${getFlagEmoji(code)}', ${count}, ${percentage}, ${x}, ${y})"
                    onmouseout="this.setAttribute('fill', '#4a9eff'); this.setAttribute('r', '${dotSize}'); hideCountryTooltip()"
                    onclick="toggleCountryWindow('${code}', '${coords.name}', ${JSON.stringify(performers).replace(/"/g, '&quot;')})"
                />
            `);
        });

        // Create the map HTML with zoom wrapper
        const mapHtml = `
            <div id="world-map-container" style="position: relative; background: var(--card-bg-alt, #1a1a1a); border-radius: 6px; padding: 10px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="color: #ffd700; font-size: 0.9rem;">
                        <i class="fa fa-globe"></i> Click on any dot to see performers
                    </div>
                    <button id="change-map-btn" class="btn btn-mini btn-primary" style="padding: 4px 12px; font-size: 0.8em;" onclick="document.getElementById('map-file-input').click()">
                        <i class="fa fa-image"></i> Choose Map
                    </button>
                </div>
                
                <!-- Map container with background image and SVG overlay -->
                <div class="map-wrapper" style="position: relative; width: 100%; background: #1a4d8c; border-radius: 4px; overflow: hidden; cursor: default;">
                    <!-- Background map image -->
                    <img src="${mapImageUrl}" class="world-map-image" style="width: 100%; height: auto; display: block; opacity: 0.9; transition: transform 0.1s;" alt="World Map" />
                    
                    <!-- SVG overlay with dots -->
                    <svg viewBox="0 0 1000 500" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; transition: transform 0.1s;">
                        <!-- This group allows pointer events on dots -->
                        <g pointer-events="visiblePainted">
                            ${dots.join('\n')}
                        </g>
                    </svg>
                </div>
                
                <!-- Legend -->
                <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px; font-size: 0.8em;">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 8px; height: 8px; background: #4a9eff; border-radius: 50%;"></div>
                        <span style="color: #888;">1-3</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 14px; height: 14px; background: #4a9eff; border-radius: 50%;"></div>
                        <span style="color: #888;">4-10</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 22px; height: 22px; background: #4a9eff; border-radius: 50%;"></div>
                        <span style="color: #888;">11+</span>
                    </div>
                </div>
            </div>
        `;

        // Return the HTML and initialize zoom after it's added to DOM
        setTimeout(() => {
            const container = document.getElementById('world-map-container');
            if (container) {
                initZoomControls(container);
            }
        }, 100);

        return mapHtml;
    }

    // ==================== HELPER FUNCTIONS ====================

    // Function to filter performers by gender
    function filterByGender(performers, genderFilter) {
        if (genderFilter === 'all') return performers;
        
        return performers.filter(p => {
            const performerGender = (p.gender || '').toLowerCase().trim();
            
            if (genderFilter === 'female') {
                return performerGender === 'female' || performerGender === 'f' || performerGender === 'woman';
            } else if (genderFilter === 'male') {
                return performerGender === 'male' || performerGender === 'm' || performerGender === 'man';
            } else if (genderFilter === 'other') {
                return performerGender && 
                       performerGender !== 'female' && 
                       performerGender !== 'f' && 
                       performerGender !== 'woman' &&
                       performerGender !== 'male' && 
                       performerGender !== 'm' && 
                       performerGender !== 'man';
            }
            return true;
        });
    }

    function getCountryFlag(countryName) {
        if (!countryName) return null;
        
        const countryMap = {
            // North America
    'USA': 'US',
    'United States': 'US',
    'United States of America': 'US',
    'America': 'US',
    'US': 'US',
    'Canada': 'CA',
    'CA': 'CA',
    'Mexico': 'MX',
    'MX': 'MX',
    
    // UK and Ireland
    'UK': 'GB',
    'United Kingdom': 'GB',
    'England': 'GB',
    'Scotland': 'GB',
    'Wales': 'GB',
    'Northern Ireland': 'GB',
    'Great Britain': 'GB',
    'GB': 'GB',
    'Ireland': 'IE',
    'IE': 'IE',
    
    // Western Europe
    'France': 'FR',
    'FR': 'FR',
    'Germany': 'DE',
    'DE': 'DE',
    'Italy': 'IT',
    'IT': 'IT',
    'Spain': 'ES',
    'ES': 'ES',
    'Portugal': 'PT',
    'PT': 'PT',
    'Netherlands': 'NL',
    'NL': 'NL',
    'Belgium': 'BE',
    'BE': 'BE',
    'Switzerland': 'CH',
    'CH': 'CH',
    'Austria': 'AT',
    'AT': 'AT',
    'Luxembourg': 'LU',
    'LU': 'LU',
    'Monaco': 'MC',
    'MC': 'MC',
    
    // Northern Europe
    'Sweden': 'SE',
    'SE': 'SE',
    'Norway': 'NO',
    'NO': 'NO',
    'Denmark': 'DK',
    'DK': 'DK',
    'Finland': 'FI',
    'FI': 'FI',
    'Iceland': 'IS',
    'IS': 'IS',
    
    // Eastern Europe
    'Poland': 'PL',
    'PL': 'PL',
    'Czech Republic': 'CZ',
    'Czechia': 'CZ',
    'CZ': 'CZ',
    'Slovakia': 'SK',
    'SK': 'SK',
    'Hungary': 'HU',
    'HU': 'HU',
    'Romania': 'RO',
    'RO': 'RO',
    'Bulgaria': 'BG',
    'BG': 'BG',
    'Russia': 'RU',
    'RU': 'RU',
    'Ukraine': 'UA',
    'UA': 'UA',
	'Moldova': 'MD',
    'MD': 'MD',
    'Belarus': 'BY',
    'BY': 'BY',
    
    // Southern Europe
    'Greece': 'GR',
    'GR': 'GR',
    'Turkey': 'TR',
    'TR': 'TR',
    'Cyprus': 'CY',
    'CY': 'CY',
    'Malta': 'MT',
    'MT': 'MT',
    'Albania': 'AL',
    'AL': 'AL',
    'North Macedonia': 'MK',
    'MK': 'MK',
    'Serbia': 'RS',
    'RS': 'RS',
    'Montenegro': 'ME',
    'ME': 'ME',
    'Bosnia and Herzegovina': 'BA',
    'Bosnia': 'BA',
    'BA': 'BA',
    'Croatia': 'HR',
    'HR': 'HR',
    'Slovenia': 'SI',
    'SI': 'SI',
    
    // Asia
    'Japan': 'JP',
    'JP': 'JP',
    'China': 'CN',
    'CN': 'CN',
    'Taiwan': 'TW',
    'TW': 'TW',
    'Hong Kong': 'HK',
    'HK': 'HK',
    'Macau': 'MO',
    'MO': 'MO',
    'South Korea': 'KR',
    'Korea': 'KR',
    'KR': 'KR',
    'North Korea': 'KP',
    'KP': 'KP',
    'Mongolia': 'MN',
    'MN': 'MN',
    'India': 'IN',
    'IN': 'IN',
    'Pakistan': 'PK',
    'PK': 'PK',
    'Bangladesh': 'BD',
    'BD': 'BD',
    'Sri Lanka': 'LK',
    'LK': 'LK',
    'Nepal': 'NP',
    'NP': 'NP',
    'Bhutan': 'BT',
    'BT': 'BT',
    'Myanmar': 'MM',
    'MM': 'MM',
    'Thailand': 'TH',
    'TH': 'TH',
    'Laos': 'LA',
    'LA': 'LA',
    'Cambodia': 'KH',
    'KH': 'KH',
    'Vietnam': 'VN',
    'VN': 'VN',
    'Malaysia': 'MY',
    'MY': 'MY',
    'Singapore': 'SG',
    'SG': 'SG',
    'Indonesia': 'ID',
    'ID': 'ID',
    'Philippines': 'PH',
    'PH': 'PH',
    'Brunei': 'BN',
    'BN': 'BN',
    'Timor-Leste': 'TL',
    'TL': 'TL',
    
    // Middle East
    'Israel': 'IL',
    'IL': 'IL',
    'Palestine': 'PS',
    'PS': 'PS',
    'Jordan': 'JO',
    'JO': 'JO',
    'Lebanon': 'LB',
    'LB': 'LB',
    'Syria': 'SY',
    'SY': 'SY',
    'Iraq': 'IQ',
    'IQ': 'IQ',
    'Iran': 'IR',
    'IR': 'IR',
    'Saudi Arabia': 'SA',
    'SA': 'SA',
    'Yemen': 'YE',
    'YE': 'YE',
    'Oman': 'OM',
    'OM': 'OM',
    'UAE': 'AE',
    'United Arab Emirates': 'AE',
    'AE': 'AE',
    'Qatar': 'QA',
    'QA': 'QA',
    'Kuwait': 'KW',
    'KW': 'KW',
    'Bahrain': 'BH',
    'BH': 'BH',
    
    // Africa
    'South Africa': 'ZA',
    'ZA': 'ZA',
    'Egypt': 'EG',
    'EG': 'EG',
    'Morocco': 'MA',
    'MA': 'MA',
    'Algeria': 'DZ',
    'DZ': 'DZ',
    'Tunisia': 'TN',
    'TN': 'TN',
    'Libya': 'LY',
    'LY': 'LY',
    'Sudan': 'SD',
    'SD': 'SD',
    'South Sudan': 'SS',
    'SS': 'SS',
    'Eritrea': 'ER',
    'ER': 'ER',
    'Ethiopia': 'ET',
    'ET': 'ET',
    'Djibouti': 'DJ',
    'DJ': 'DJ',
    'Somalia': 'SO',
    'SO': 'SO',
    'Kenya': 'KE',
    'KE': 'KE',
    'Uganda': 'UG',
    'UG': 'UG',
    'Tanzania': 'TZ',
    'TZ': 'TZ',
    'Rwanda': 'RW',
    'RW': 'RW',
    'Burundi': 'BI',
    'BI': 'BI',
    'DR Congo': 'CD',
    'Democratic Republic of the Congo': 'CD',
    'CD': 'CD',
    'Republic of Congo': 'CG',
    'Congo': 'CG',
    'CG': 'CG',
    'Gabon': 'GA',
    'GA': 'GA',
    'Equatorial Guinea': 'GQ',
    'GQ': 'GQ',
    'Cameroon': 'CM',
    'CM': 'CM',
    'Central African Republic': 'CF',
    'CF': 'CF',
    'Chad': 'TD',
    'TD': 'TD',
    'Nigeria': 'NG',
    'NG': 'NG',
    'Niger': 'NE',
    'NE': 'NE',
    'Mali': 'ML',
    'ML': 'ML',
    'Burkina Faso': 'BF',
    'BF': 'BF',
    'Senegal': 'SN',
    'SN': 'SN',
    'Gambia': 'GM',
    'GM': 'GM',
    'Guinea-Bissau': 'GW',
    'GW': 'GW',
    'Guinea': 'GN',
    'GN': 'GN',
    'Sierra Leone': 'SL',
    'SL': 'SL',
    'Liberia': 'LR',
    'LR': 'LR',
    'Côte d\'Ivoire': 'CI',
    'Ivory Coast': 'CI',
    'CI': 'CI',
    'Ghana': 'GH',
    'GH': 'GH',
    'Togo': 'TG',
    'TG': 'TG',
    'Benin': 'BJ',
    'BJ': 'BJ',
    'Angola': 'AO',
    'AO': 'AO',
    'Zambia': 'ZM',
    'ZM': 'ZM',
    'Zimbabwe': 'ZW',
    'ZW': 'ZW',
    'Malawi': 'MW',
    'MW': 'MW',
    'Mozambique': 'MZ',
    'MZ': 'MZ',
    'Madagascar': 'MG',
    'MG': 'MG',
    'Comoros': 'KM',
    'KM': 'KM',
    'Seychelles': 'SC',
    'SC': 'SC',
    'Mauritius': 'MU',
    'MU': 'MU',
    'Réunion': 'RE',
    'RE': 'RE',
    'Mayotte': 'YT',
    'YT': 'YT',
    'Botswana': 'BW',
    'BW': 'BW',
    'Namibia': 'NA',
    'NA': 'NA',
    'Eswatini': 'SZ',
    'Swaziland': 'SZ',
    'SZ': 'SZ',
    'Lesotho': 'LS',
    'LS': 'LS',
    
    // South America
    'Brazil': 'BR',
    'BR': 'BR',
    'Argentina': 'AR',
    'AR': 'AR',
    'Chile': 'CL',
    'CL': 'CL',
    'Uruguay': 'UY',
    'UY': 'UY',
    'Paraguay': 'PY',
    'PY': 'PY',
    'Bolivia': 'BO',
    'BO': 'BO',
    'Peru': 'PE',
    'PE': 'PE',
    'Ecuador': 'EC',
    'EC': 'EC',
    'Colombia': 'CO',
    'CO': 'CO',
    'Venezuela': 'VE',
    'VE': 'VE',
    'Guyana': 'GY',
    'GY': 'GY',
    'Suriname': 'SR',
    'SR': 'SR',
    'French Guiana': 'GF',
    'GF': 'GF',
    
    // Central America & Caribbean
    'Mexico': 'MX',
    'MX': 'MX',
    'Guatemala': 'GT',
    'GT': 'GT',
    'Belize': 'BZ',
    'BZ': 'BZ',
    'El Salvador': 'SV',
    'SV': 'SV',
    'Honduras': 'HN',
    'HN': 'HN',
    'Nicaragua': 'NI',
    'NI': 'NI',
    'Costa Rica': 'CR',
    'CR': 'CR',
    'Panama': 'PA',
    'PA': 'PA',
    'Cuba': 'CU',
    'CU': 'CU',
    'Jamaica': 'JM',
    'JM': 'JM',
    'Haiti': 'HT',
    'HT': 'HT',
    'Dominican Republic': 'DO',
    'DO': 'DO',
    'Puerto Rico': 'PR',
    'PR': 'PR',
    'Bahamas': 'BS',
    'BS': 'BS',
    'Trinidad and Tobago': 'TT',
    'TT': 'TT',
    'Barbados': 'BB',
    'BB': 'BB',
    
    // Oceania
    'Australia': 'AU',
    'AU': 'AU',
    'New Zealand': 'NZ',
    'NZ': 'NZ',
    'Papua New Guinea': 'PG',
    'PG': 'PG',
    'Fiji': 'FJ',
    'FJ': 'FJ',
    'Solomon Islands': 'SB',
    'SB': 'SB',
    'Vanuatu': 'VU',
    'VU': 'VU',
    'New Caledonia': 'NC',
    'NC': 'NC',
    'French Polynesia': 'PF',
    'PF': 'PF',
    'Samoa': 'WS',
    'WS': 'WS',
    'Tonga': 'TO',
    'TO': 'TO',
    'Kiribati': 'KI',
    'KI': 'KI',
    'Micronesia': 'FM',
    'FM': 'FM',
    'Marshall Islands': 'MH',
    'MH': 'MH',
    'Palau': 'PW',
    'PW': 'PW',
    'Nauru': 'NR',
    'NR': 'NR',
    'Tuvalu': 'TV',
    'TV': 'TV',
    
    // Special Cases
    'Soviet Union': 'SU',
    'SU': 'SU',
    'Czechoslovakia': 'CS',
    'CS': 'CS',
    'East Germany': 'DD',
    'DD': 'DD',
    'West Germany': 'DE',
    'Yugoslavia': 'YU',
    'YU': 'YU',
    'Serbia and Montenegro': 'CS',
    'Unknown': null,
    'Not Set': null
        };

        let normalized = countryName.trim();
        if (countryMap[normalized]) return countryMap[normalized];
        
        const upper = normalized.toUpperCase();
        if (countryMap[upper]) return countryMap[upper];
        
        return null;
    }

    function getFlagEmoji(countryCode) {
        if (!countryCode) return '';
        const code = countryCode.toUpperCase();
        const offset = 127397;
        const chars = [...code].map(c => String.fromCodePoint(c.charCodeAt(0) + offset));
        return chars.join('');
    }

    function getCountryDisplayName(countryCode, originalName) {
        if (!countryCode) return originalName || 'Unknown';
        
        const displayNames = {
               'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'NZ': 'New Zealand',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'PT': 'Portugal',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'IS': 'Iceland',
    'IE': 'Ireland',
    'PL': 'Poland',
    'CZ': 'Czechia',
    'SK': 'Slovakia',
    'HU': 'Hungary',
    'RO': 'Romania',
    'BG': 'Bulgaria',
    'RU': 'Russia',
    'UA': 'Ukraine',
    'BY': 'Belarus',
    'GR': 'Greece',
    'TR': 'Turkey',
    'JP': 'Japan',
    'CN': 'China',
    'KR': 'South Korea',
    'KP': 'North Korea',
    'IN': 'India',
    'PK': 'Pakistan',
    'BD': 'Bangladesh',
    'LK': 'Sri Lanka',
    'NP': 'Nepal',
    'BT': 'Bhutan',
    'MM': 'Myanmar',
    'TH': 'Thailand',
    'LA': 'Laos',
    'KH': 'Cambodia',
    'VN': 'Vietnam',
    'MY': 'Malaysia',
    'SG': 'Singapore',
    'ID': 'Indonesia',
    'PH': 'Philippines',
    'BN': 'Brunei',
    'TL': 'Timor-Leste',
    'IL': 'Israel',
    'SA': 'Saudi Arabia',
    'AE': 'United Arab Emirates',
    'QA': 'Qatar',
    'KW': 'Kuwait',
    'BH': 'Bahrain',
    'OM': 'Oman',
    'YE': 'Yemen',
    'IQ': 'Iraq',
    'IR': 'Iran',
    'SY': 'Syria',
    'LB': 'Lebanon',
    'JO': 'Jordan',
    'CY': 'Cyprus',
    'ZA': 'South Africa',
    'EG': 'Egypt',
    'MA': 'Morocco',
    'DZ': 'Algeria',
    'TN': 'Tunisia',
    'LY': 'Libya',
    'SD': 'Sudan',
    'SS': 'South Sudan',
    'ER': 'Eritrea',
    'ET': 'Ethiopia',
    'DJ': 'Djibouti',
    'SO': 'Somalia',
    'KE': 'Kenya',
    'UG': 'Uganda',
    'TZ': 'Tanzania',
    'RW': 'Rwanda',
    'BI': 'Burundi',
    'CD': 'DR Congo',
    'CG': 'Republic of Congo',
    'GA': 'Gabon',
    'GQ': 'Equatorial Guinea',
    'CM': 'Cameroon',
    'CF': 'Central African Republic',
    'TD': 'Chad',
    'NG': 'Nigeria',
    'NE': 'Niger',
    'ML': 'Mali',
    'BF': 'Burkina Faso',
    'SN': 'Senegal',
    'GM': 'Gambia',
    'GW': 'Guinea-Bissau',
    'GN': 'Guinea',
    'SL': 'Sierra Leone',
    'LR': 'Liberia',
    'CI': 'Côte d\'Ivoire',
    'GH': 'Ghana',
    'TG': 'Togo',
    'BJ': 'Benin',
    'AO': 'Angola',
    'ZM': 'Zambia',
    'ZW': 'Zimbabwe',
    'MW': 'Malawi',
    'MZ': 'Mozambique',
    'MG': 'Madagascar',
    'KM': 'Comoros',
    'SC': 'Seychelles',
    'MU': 'Mauritius',
    'RE': 'Réunion',
    'YT': 'Mayotte',
    'BW': 'Botswana',
    'NA': 'Namibia',
    'SZ': 'Eswatini',
    'LS': 'Lesotho',
    'BR': 'Brazil',
    'AR': 'Argentina',
    'CL': 'Chile',
    'UY': 'Uruguay',
    'PY': 'Paraguay',
    'BO': 'Bolivia',
    'PE': 'Peru',
    'EC': 'Ecuador',
    'CO': 'Colombia',
    'VE': 'Venezuela',
    'GY': 'Guyana',
    'SR': 'Suriname',
    'GF': 'French Guiana',
    'MX': 'Mexico',
    'GT': 'Guatemala',
    'BZ': 'Belize',
    'SV': 'El Salvador',
    'HN': 'Honduras',
    'NI': 'Nicaragua',
    'CR': 'Costa Rica',
    'PA': 'Panama',
    'CU': 'Cuba',
    'JM': 'Jamaica',
    'HT': 'Haiti',
    'DO': 'Dominican Republic',
    'PR': 'Puerto Rico',
    'BS': 'Bahamas',
    'TT': 'Trinidad and Tobago',
    'BB': 'Barbados',
    'FJ': 'Fiji',
    'PG': 'Papua New Guinea',
    'SB': 'Solomon Islands',
    'VU': 'Vanuatu',
    'NC': 'New Caledonia',
    'PF': 'French Polynesia',
    'WS': 'Samoa',
    'TO': 'Tonga',
    'KI': 'Kiribati',
    'FM': 'Micronesia',
    'MH': 'Marshall Islands',
    'PW': 'Palau',
    'NR': 'Nauru',
	'MD': 'Moldova',
    'TV': 'Tuvalu'
        };
        
        return displayNames[countryCode] || originalName;
    }

    // ==================== CLEANUP ON NAVIGATION ====================
    
    function removePlugin() {
        const existing = document.getElementById('country-stats-plugin');
        if (existing) {
            existing.remove();
        }
        const tooltip = document.getElementById('country-stats-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
        document.querySelectorAll('[id^="country-window-"]').forEach(w => w.remove());
    }

    // ==================== ADD PLUGIN ====================
    
    let initialized = false;
    let initAttempts = 0;
    const maxAttempts = 30;

    function addPlugin() {
        if (!isStatsPage()) {
            removePlugin();
            return false;
        }

        if (initialized || document.getElementById('country-stats-plugin')) {
            return true;
        }

        const selectors = [
            '.stats-container',
            '.stats-content',
            'main .container',
            '.content',
            'main',
            '.container',
            '.row:last-child'
        ];
        
        let targetContainer = null;
        for (const selector of selectors) {
            targetContainer = document.querySelector(selector);
            if (targetContainer) break;
        }
        
        if (!targetContainer) {
            targetContainer = document.body;
        }
        
        if (targetContainer) {
            initialized = true;
            addCountryStats(targetContainer);
            return true;
        }
        
        return false;
    }

    // ==================== AUTO-LOADING STRATEGIES ====================

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(addPlugin, 100);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(addPlugin, 200);
        });
    }

    function retryAddPlugin() {
        if (addPlugin()) {
            return;
        }
        
        initAttempts++;
        if (initAttempts < maxAttempts) {
            setTimeout(retryAddPlugin, 500);
        }
    }
    
    setTimeout(retryAddPlugin, 500);

    const observer = new MutationObserver(function(mutations) {
        if (!isStatsPage()) {
            removePlugin();
            return;
        }
        
        if (!document.getElementById('country-stats-plugin')) {
            const statsContent = document.querySelector('.stats-container, .stats-content, table');
            if (statsContent && statsContent.children.length > 0) {
                console.log("CountryStats: Detected stats content via observer");
                addPlugin();
            }
        }
    });
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    } else {
        observer.observe(document.body, { childList: true, subtree: true });
    }

    let lastUrl = location.href;
    const urlObserver = new MutationObserver(function() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            
            if (isStatsPage()) {
                console.log("CountryStats: Detected navigation to stats page");
                initialized = false;
                initAttempts = 0;
                setTimeout(addPlugin, 300);
            } else {
                removePlugin();
                initialized = false;
            }
        }
    });
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            urlObserver.observe(document.body, { childList: true, subtree: true });
        });
    } else {
        urlObserver.observe(document.body, { childList: true, subtree: true });
    }

    // ==================== MAIN PLUGIN FUNCTIONS ====================

    async function addCountryStats(container) {
        if (!isStatsPage()) {
            removePlugin();
            return;
        }

        removePlugin();

        const section = document.createElement('div');
        section.id = 'country-stats-plugin';
        section.style.margin = '15px 0';
        section.style.width = '100%';
        
        section.innerHTML = `
            <div style="padding: 12px; background: var(--card-bg, #2d2d2d); border-radius: 6px;">
                <div style="display: flex; align-items: center; gap: 8px; color: var(--text-color, #e0e0e0); font-size: 0.9em;">
                    <i class="fa fa-spinner fa-spin"></i>
                    <span>Loading country statistics...</span>
                </div>
            </div>
        `;
        
        container.appendChild(section);
        await loadCountryData(section);
    }

    async function loadCountryData(container) {
        if (!isStatsPage()) {
            removePlugin();
            return;
        }

        try {
            const response = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query {
                        allPerformers {
                            id
                            name
                            country
                            image_path
                            favorite
                            gender
                        }
                    }`
                })
            });

            const result = await response.json();
            
            if (result.data?.allPerformers) {
                const performersWithFlags = result.data.allPerformers.map(p => {
                    const countryCode = p.country ? getCountryFlag(p.country) : null;
                    const displayName = getCountryDisplayName(countryCode, p.country);
                    
                    return {
                        ...p,
                        originalCountry: p.country,
                        countryCode: countryCode,
                        countryFlag: countryCode ? getFlagEmoji(countryCode) : null,
                        countryDisplay: displayName,
                        favorite: p.favorite || false,
                        gender: p.gender || ''
                    };
                });
                
                window.countryStatsPerformers = performersWithFlags;
                displayCountryStats(container, performersWithFlags);
            } else {
                showError(container, "No performer data found");
            }
        } catch (error) {
            console.error("CountryStats Error:", error);
            showError(container, "Failed to load data");
        }
    }

    function displayCountryStats(container, allPerformers) {
        // Apply gender filter
        const performers = filterByGender(allPerformers, currentGenderFilter);
        
        // Count performers by gender for stats
        const femaleCount = allPerformers.filter(p => {
            const g = (p.gender || '').toLowerCase().trim();
            return g === 'female' || g === 'f' || g === 'woman';
        }).length;
        
        const maleCount = allPerformers.filter(p => {
            const g = (p.gender || '').toLowerCase().trim();
            return g === 'male' || g === 'm' || g === 'man';
        }).length;
        
        const otherCount = allPerformers.filter(p => {
            const g = (p.gender || '').toLowerCase().trim();
            return g && g !== 'female' && g !== 'f' && g !== 'woman' && 
                   g !== 'male' && g !== 'm' && g !== 'man';
        }).length;
        
        const unknownGender = allPerformers.length - femaleCount - maleCount - otherCount;

        // Group filtered performers by country
        const countryGroups = new Map();
        const unknownGroup = [];

        performers.forEach(p => {
            const country = p.countryDisplay || 'Unknown';
            const countryCode = p.countryCode;
            const countryFlag = p.countryFlag;
            
            if (country && country !== 'Unknown' && country !== 'Not Set' && country !== '') {
                const key = countryCode || country;
                if (!countryGroups.has(key)) {
                    countryGroups.set(key, {
                        name: country,
                        code: countryCode,
                        flag: countryFlag,
                        performers: []
                    });
                }
                countryGroups.get(key).performers.push(p);
            } else {
                unknownGroup.push(p);
            }
        });

        // Convert to array and sort by count (descending)
        let sortedCountries = Array.from(countryGroups.values())
            .map(group => ({
                name: group.name,
                code: group.code,
                flag: group.flag,
                count: group.performers.length,
                performers: group.performers.sort((a, b) => a.name.localeCompare(b.name))
            }))
            .sort((a, b) => b.count - a.count);

        // Add unknown group at the end if exists
        if (unknownGroup.length > 0) {
            sortedCountries.push({
                name: 'Unknown',
                code: null,
                flag: '🌍',
                count: unknownGroup.length,
                performers: unknownGroup.sort((a, b) => a.name.localeCompare(b.name))
            });
        }

        const totalWithCountry = performers.length - unknownGroup.length;
        const worldMap = generateWorldMapWithDots(sortedCountries, performers, performers.length);

        // Collect unique flags for the "Total Countries" stat
        const uniqueCountryFlags = sortedCountries
            .filter(c => c.name !== 'Unknown' && c.flag)
            .map(c => c.flag)
            .join(' ');

        const html = `
            <div style="background: var(--card-bg, #2d2d2d); border-radius: 6px; overflow: hidden;">
                <div style="padding: 10px; border-bottom: 1px solid var(--border-color, #3d3d3d);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <h3 style="margin: 0; color: var(--text-color, #e0e0e0); font-size: 1.1rem;">
                            <i class="fa fa-globe" style="color: #4a9eff;"></i> Performer Distribution by Country
                        </h3>
                        
                        <!-- Gender Filter Buttons (Independent) -->
                        <div style="display: flex; gap: 5px;">
                            <button id="country-gender-filter-all" class="btn btn-mini ${currentGenderFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" 
                                    style="padding: 4px 12px; font-size: 0.8em;" onclick="setCountryGenderFilter('all')">
                                All (${allPerformers.length})
                            </button>
                            <button id="country-gender-filter-female" class="btn btn-mini ${currentGenderFilter === 'female' ? 'btn-primary' : 'btn-secondary'}" 
                                    style="padding: 4px 12px; font-size: 0.8em;" onclick="setCountryGenderFilter('female')">
                                👩 Women (${femaleCount})
                            </button>
                            <button id="country-gender-filter-male" class="btn btn-mini ${currentGenderFilter === 'male' ? 'btn-primary' : 'btn-secondary'}" 
                                    style="padding: 4px 12px; font-size: 0.8em;" onclick="setCountryGenderFilter('male')">
                                👨 Men (${maleCount})
                            </button>
                            <button id="country-gender-filter-other" class="btn btn-mini ${currentGenderFilter === 'other' ? 'btn-primary' : 'btn-secondary'}" 
                                    style="padding: 4px 12px; font-size: 0.8em;" onclick="setCountryGenderFilter('other')">
                                ⚧ Others (${otherCount + unknownGender})
                            </button>
                        </div>
                    </div>
                    <div style="margin-top: 5px; color: #888; font-size: 0.85em;">
                        Showing: ${performers.length} performers
                    </div>
                </div>
                <div style="padding: 12px;">
                    
                    <!-- World Map with Dots (Zoomable) -->
                    ${worldMap}

                    <!-- Stats Cards -->
                    <div style="display: flex; gap: 8px; margin-bottom: 15px; flex-wrap: wrap;">
                        ${generateStatsCards(sortedCountries, performers.length, totalWithCountry, uniqueCountryFlags)}
                    </div>

                    <!-- Country Distribution Bars -->
                    <div style="margin-bottom: 8px; max-height: 300px; overflow-y: auto; padding-right: 5px;">
                        ${generateCountryBars(sortedCountries, performers.length)}
                    </div>

                    <!-- Data Quality Note -->
                    <div style="margin-top: 15px; padding: 6px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; text-align: center; color: #888; font-size: 0.75em;">
                        <i class="fa fa-info-circle"></i> 
                        Based on ${performers.length} filtered performers (${allPerformers.length} total)<br>
                        ${totalWithCountry} with country data (${((totalWithCountry/performers.length)*100).toFixed(1)}%)
                        ${unknownGroup.length > 0 ? `<br>${unknownGroup.length} unknown (${((unknownGroup.length/performers.length)*100).toFixed(1)}%)` : ''}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        
        // Initialize zoom after the map is added to DOM
        const mapContainer = document.getElementById('world-map-container');
        if (mapContainer) {
            setTimeout(() => {
                initZoomControls(mapContainer);
            }, 100);
        }
    }

    function generateStatsCards(countryData, totalPerformers, totalWithCountry, uniqueCountryFlags) {
        if (countryData.length === 0) {
            return `<div style="color: #888; text-align: center; width: 100%; font-size: 0.85em;">No country data available</div>`;
        }

        const mostCommon = countryData[0];
        const uniqueCountries = countryData.filter(c => c.name !== 'Unknown').length;

        return `
            <div style="flex: 1; min-width: 100px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="color: #888; font-size: 0.7em;">Total Countries</div>
                <div style="font-size: 1.1em; font-weight: bold; color: #4a9eff; display: flex; align-items: center; gap: 5px;">
                    <span>${uniqueCountries}</span>
                    ${uniqueCountryFlags ? `<span style="font-size: 1.2em; margin-left: 5px;">${uniqueCountryFlags}</span>` : ''}
                </div>
                <div style="color: #888; font-size: 0.7em;">represented</div>
            </div>
            <div style="flex: 1; min-width: 120px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="color: #888; font-size: 0.7em;">Most Common</div>
                <div style="display: flex; align-items: center; gap: 4px; font-size: 1em; font-weight: bold; color: #4CAF50;">
                    ${mostCommon.flag ? `<span style="font-size: 1.2em;">${mostCommon.flag}</span>` : ''}
                    <span>${mostCommon.name}</span>
                </div>
                <div style="color: #4a9eff; font-size: 0.7em;">${mostCommon.count} (${((mostCommon.count/totalPerformers)*100).toFixed(1)}%)</div>
            </div>
            <div style="flex: 1; min-width: 100px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="color: #888; font-size: 0.7em;">With Country</div>
                <div style="font-size: 1.1em; font-weight: bold; color: #4CAF50;">${((totalWithCountry/totalPerformers)*100).toFixed(1)}%</div>
                <div style="color: #888; font-size: 0.7em;">${totalWithCountry} performers</div>
            </div>
        `;
    }

    function generateCountryBars(countryData, totalPerformers) {
        if (countryData.length === 0) {
            return `<p style="color: #888; text-align: center; padding: 8px; font-size: 0.8em;">No country data available</p>`;
        }

        return `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${countryData.map((country, index) => {
                    const percentage = (country.count / totalPerformers) * 100;
                    const barColor = getCountryBarColor(percentage);
                    const countryId = `country-group-${index}`;
                    
                    return `
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; font-size: 0.8em;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="color: #888;">${index+1}.</span>
                                    ${country.flag ? `<span style="font-size: 1.2em;">${country.flag}</span>` : ''}
                                    <span style="color: #ffd700; font-weight: bold;">${country.name}</span>
                                </div>
                                <span style="color: #4CAF50;">${country.count} (${percentage.toFixed(1)}%)</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <div style="flex: 1; height: 16px; background: var(--card-bg, #2d2d2d); border-radius: 8px; overflow: hidden; cursor: pointer;"
                                     onclick="toggleCountryGroup('${countryId}')">
                                    <div style="width: ${percentage}%; height: 100%; background: ${barColor}; transition: width 0.3s;"></div>
                                </div>
                                <i class="fa fa-chevron-down" id="icon-${countryId}" style="color: #888; cursor: pointer; transition: transform 0.2s; font-size: 10px;" onclick="toggleCountryGroup('${countryId}')"></i>
                            </div>
                            <div id="${countryId}" style="display: none; margin-top: 6px; padding: 6px; background: var(--card-bg, #2d2d2d); border-radius: 4px; max-height: 150px; overflow-y: auto;">
                                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                    ${country.performers.map(p => {
                                        // Set background color based on favorite status for bar items
                                        const barItemBgColor = p.favorite ? '#ff69b4' : 'var(--card-bg-alt, #3d3d3d)';
                                        const barItemHoverColor = p.favorite ? '#ff1493' : '#4a9eff';
                                        
                                        return `
                                            <span class="performer-name-tooltip" 
                                                  style="background: ${barItemBgColor}; padding: 2px 6px; border-radius: 12px; font-size: 0.7em; cursor: pointer; border: 1px solid var(--border-color, #4d4d4d); display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;"
                                                  onclick="openCountryPerformer('${p.id}', event)"
                                                  onmouseover="this.style.background='${barItemHoverColor}'; this.style.transform='scale(1.05)'; showPerformerTooltip(this, '${p.id}')"
                                                  onmouseout="this.style.background='${barItemBgColor}'; this.style.transform='scale(1)'; hidePerformerTooltip()">
                                                ${p.favorite ? '<span style="margin-right: 2px;">❤️</span>' : ''}
                                                ${p.countryFlag ? `<span style="font-size: 1.1em;">${p.countryFlag}</span>` : ''}
                                                ${p.name}
                                            </span>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function getCountryBarColor(percentage) {
        if (percentage >= 20) return '#4CAF50';
        if (percentage >= 10) return '#FFC107';
        if (percentage >= 5) return '#FF9800';
        return '#F44336';
    }

    function showError(container, message) {
        container.innerHTML = `
            <div style="background: var(--card-bg, #2d2d2d); border-radius: 6px; padding: 12px;">
                <div style="color: #ff6b6b; text-align: center; font-size: 0.9em;">
                    <i class="fa fa-exclamation-circle"></i> ${message}
                </div>
            </div>
        `;
        
        setTimeout(() => {
            if (document.getElementById('country-stats-plugin') && isStatsPage()) {
                loadCountryData(container);
            }
        }, 3000);
    }

    // ==================== GLOBAL FUNCTIONS ====================

    window.toggleCountryGroup = function(id) {
        const element = document.getElementById(id);
        const icon = document.getElementById(`icon-${id}`);
        
        if (!element) return;
        
        if (element.style.display === 'none' || !element.style.display) {
            element.style.display = 'block';
            if (icon) icon.style.transform = 'rotate(180deg)';
        } else {
            element.style.display = 'none';
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    };

    window.toggleCountryWindow = function(countryCode, countryName, performersJson) {
        const mapContainer = document.getElementById('world-map-container');
        if (!mapContainer) return;
        
        const performers = typeof performersJson === 'string' ? JSON.parse(performersJson) : performersJson;
        
        const windowDiv = createCountryWindow(countryCode, countryName, performers);
        if (windowDiv) {
            mapContainer.style.position = 'relative';
            mapContainer.appendChild(windowDiv);
        }
    };

    window.setCountryGenderFilter = function(filter) {
        currentGenderFilter = filter;
        const container = document.getElementById('country-stats-plugin');
        if (container) {
            // Reload the display with new filter
            loadCountryData(container);
        }
    };

    window.showCountryDotTooltip = function(countryCode, countryName, flagEmoji, count, percentage, x, y) {
        if (!isStatsPage()) return;
        
        const tooltip = document.getElementById('country-stats-tooltip');
        const imageContainer = document.getElementById('country-stats-tooltip-image-container');
        const nameEl = document.getElementById('country-stats-tooltip-name');
        const countryEl = document.getElementById('country-stats-tooltip-country');
        
        if (!tooltip || !imageContainer || !nameEl || !countryEl) return;
        
        // Hide image for dot tooltips
        imageContainer.style.display = 'none';
        
        const mapContainer = document.getElementById('world-map-container');
        if (mapContainer) {
            const rect = mapContainer.getBoundingClientRect();
            const svgWidth = 1000;
            const svgHeight = 500;
            const scaleX = rect.width / svgWidth;
            const scaleY = rect.height / svgHeight;
            
            tooltip.style.left = (rect.left + (x * scaleX) - 90) + 'px';
            tooltip.style.top = (rect.top + (y * scaleY) - 70) + 'px';
        }
        
        nameEl.innerHTML = `${flagEmoji} ${countryName}`;
        countryEl.innerHTML = `${count} (${percentage}%)`;
        
        tooltip.style.display = 'block';
    };

    window.showPerformerTooltip = function(element, performerId) {
        if (!isStatsPage()) return;
        
        const tooltip = document.getElementById('country-stats-tooltip');
        const imageContainer = document.getElementById('country-stats-tooltip-image-container');
        const tooltipImage = document.getElementById('country-stats-tooltip-image');
        const tooltipFallback = document.getElementById('country-stats-tooltip-fallback');
        const nameEl = document.getElementById('country-stats-tooltip-name');
        const countryEl = document.getElementById('country-stats-tooltip-country');
        
        if (!tooltip || !imageContainer || !tooltipImage || !tooltipFallback || !nameEl || !countryEl) return;
        
        const performer = window.countryStatsPerformers?.find(p => p.id === performerId);
        if (!performer) return;
        
        const rect = element.getBoundingClientRect();
        
        tooltip.style.left = (rect.left + (rect.width / 2) - 90) + 'px';
        tooltip.style.top = (rect.top - 210) + 'px';
        
        // Show image for performer tooltips
        imageContainer.style.display = 'block';
        
        nameEl.innerHTML = performer.name;
        countryEl.innerHTML = performer.countryFlag ? `${performer.countryFlag} ${performer.countryDisplay || performer.originalCountry || 'Unknown'}` : (performer.countryDisplay || performer.originalCountry || 'Unknown');
        
        if (performer.image_path) {
            tooltipImage.src = performer.image_path;
            tooltipImage.style.display = 'block';
            tooltipFallback.style.display = 'none';
        } else {
            tooltipImage.style.display = 'none';
            tooltipFallback.style.display = 'flex';
        }
        
        tooltip.style.display = 'block';
    };

    window.hideCountryTooltip = function() {
        const tooltip = document.getElementById('country-stats-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
            const img = document.getElementById('country-stats-tooltip-image');
            if (img) img.src = '';
        }
    };

    window.hidePerformerTooltip = function() {
        const tooltip = document.getElementById('country-stats-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
            const img = document.getElementById('country-stats-tooltip-image');
            if (img) img.src = '';
        }
    };

    window.openCountryPerformer = function(id, event) {
        if (event) event.stopPropagation();
        window.location.href = `/performers/${id}`;
    };
})();
