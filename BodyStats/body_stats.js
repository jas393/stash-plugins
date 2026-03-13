// body_stats.js - Height, weight, BMI, and body type statistics with independent gender filters

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
        console.log("BodyStats: Not stats page, exiting");
        return;
    }

    console.log("BodyStats: Loading on stats page");

    // ==================== GENDER FILTER STATE ====================
    
    let currentGenderFilter = 'all'; // 'all', 'female', 'male', 'other'

    // ==================== GLOBAL TOOLTIP ====================
    
    if (!document.getElementById('body-stats-tooltip')) {
        const tooltipContainer = document.createElement('div');
        tooltipContainer.id = 'body-stats-tooltip';
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
            width: 200px;
            transition: opacity 0.1s;
        `;
        document.body.appendChild(tooltipContainer);

        const imageContainer = document.createElement('div');
        imageContainer.id = 'body-stats-tooltip-image-container';
        imageContainer.style.cssText = `
            width: 180px;
            height: 180px;
            margin-bottom: 6px;
        `;
        tooltipContainer.appendChild(imageContainer);

        const tooltipImage = document.createElement('img');
        tooltipImage.id = 'body-stats-tooltip-image';
        tooltipImage.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 4px;
        `;
        imageContainer.appendChild(tooltipImage);

        const tooltipFallback = document.createElement('div');
        tooltipFallback.id = 'body-stats-tooltip-fallback';
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

        const tooltipName = document.createElement('div');
        tooltipName.id = 'body-stats-tooltip-name';
        tooltipName.style.cssText = `
            text-align: center;
            color: #ffd700;
            font-weight: bold;
            font-size: 0.95em;
            margin-bottom: 4px;
            word-wrap: break-word;
        `;
        tooltipContainer.appendChild(tooltipName);

        const tooltipCountry = document.createElement('div');
        tooltipCountry.id = 'body-stats-tooltip-country';
        tooltipCountry.style.cssText = `
            text-align: center;
            color: #4a9eff;
            font-size: 0.85em;
            margin-bottom: 4px;
        `;
        tooltipContainer.appendChild(tooltipCountry);

        const tooltipValue = document.createElement('div');
        tooltipValue.id = 'body-stats-tooltip-value';
        tooltipValue.style.cssText = `
            text-align: center;
            color: #4CAF50;
            font-weight: bold;
            font-size: 1em;
            padding: 4px;
            background: var(--card-bg-alt, #3d3d3d);
            border-radius: 4px;
        `;
        tooltipContainer.appendChild(tooltipValue);
    }

    // ==================== HELPER FUNCTIONS ====================

    // Function to filter performers by gender (independent for this plugin)
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

    // Helper function to get country flag emoji
    function getCountryFlag(countryCode) {
        if (!countryCode) return null;
        
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

        let normalized = countryCode.trim();
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

    // Function to calculate BMI
    function calculateBMI(heightCm, weightKg) {
        if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
        const heightM = heightCm / 100;
        const bmi = weightKg / (heightM * heightM);
        return Math.round(bmi * 10) / 10;
    }

    // Function to get BMI category
    function getBMICategory(bmi) {
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    }

    // Function to parse measurements (bust-waist-hip)
    function parseMeasurements(measurementsStr) {
        if (!measurementsStr) return null;
        
        // Try to parse format like "34-24-36" or "34C-24-36"
        const parts = measurementsStr.split('-').map(p => p.trim());
        
        if (parts.length >= 3) {
            // Extract numeric part from bust (might include cup size like "34C")
            const bustMatch = parts[0].match(/(\d+)/);
            const bust = bustMatch ? parseInt(bustMatch[1]) : null;
            
            // Waist and hip should be purely numeric
            const waist = parseInt(parts[1]);
            const hip = parseInt(parts[2]);
            
            if (bust && waist && hip && !isNaN(bust) && !isNaN(waist) && !isNaN(hip)) {
                return { bust, waist, hip };
            }
        }
        
        return null;
    }

    // Function to determine body type based on measurements
    function getBodyType(measurements) {
        if (!measurements) return null;
        
        const { bust, waist, hip } = measurements;
        
        // Calculate ratios
        const bustWaistRatio = bust / waist;
        const hipWaistRatio = hip / waist;
        
        // Classify based on classic body shapes
        if (bustWaistRatio >= 1.25 && hipWaistRatio >= 1.25) {
            return 'Hourglass';
        } else if (bustWaistRatio >= 1.25 && hipWaistRatio < 1.25) {
            return 'Pear';
        } else if (bustWaistRatio < 1.25 && hipWaistRatio >= 1.25) {
            return 'Inverted Triangle';
        } else if (Math.abs(bust - hip) <= 5 && waist < bust && waist < hip) {
            return 'Athletic';
        } else if (bust > hip && bust > waist) {
            return 'Apple';
        } else {
            return 'Rectangle';
        }
    }

    // ==================== CLEANUP ON NAVIGATION ====================
    
    function removePlugin() {
        const existing = document.getElementById('body-stats-plugin');
        if (existing) {
            existing.remove();
        }
        const tooltip = document.getElementById('body-stats-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
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

        if (initialized || document.getElementById('body-stats-plugin')) {
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
            addBodyStats(targetContainer);
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
        
        if (!document.getElementById('body-stats-plugin')) {
            const statsContent = document.querySelector('.stats-container, .stats-content, table');
            if (statsContent && statsContent.children.length > 0) {
                console.log("BodyStats: Detected stats content via observer");
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
                console.log("BodyStats: Detected navigation to stats page");
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

    async function addBodyStats(container) {
        if (!isStatsPage()) {
            removePlugin();
            return;
        }

        removePlugin();

        const section = document.createElement('div');
        section.id = 'body-stats-plugin';
        section.style.margin = '15px 0';
        section.style.width = '100%';
        
        section.innerHTML = `
            <div style="padding: 12px; background: var(--card-bg, #2d2d2d); border-radius: 6px;">
                <div style="display: flex; align-items: center; gap: 8px; color: var(--text-color, #e0e0e0); font-size: 0.9em;">
                    <i class="fa fa-spinner fa-spin"></i>
                    <span>Loading body statistics...</span>
                </div>
            </div>
        `;
        
        container.appendChild(section);
        await loadBodyData(section);
    }

    async function loadBodyData(container) {
        if (!isStatsPage()) {
            removePlugin();
            return;
        }

        try {
            // First, discover what fields are available
            const schemaResponse = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `{
                        __type(name: "Performer") {
                            fields {
                                name
                                type {
                                    name
                                    kind
                                }
                            }
                        }
                    }`
                })
            });

            const schemaResult = await schemaResponse.json();
            
            const performerFields = schemaResult.data?.__type?.fields || [];
            
            const possibleHeightFields = ['height', 'height_cm', 'centimeters', 'cm'];
            const possibleWeightFields = ['weight', 'weight_kg', 'kilograms', 'kg'];
            const possibleMeasurementFields = ['measurements', 'bust_waist_hip', 'body_measurements'];
            
            const heightField = performerFields.find(f => 
                possibleHeightFields.includes(f.name.toLowerCase())
            );
            
            const weightField = performerFields.find(f => 
                possibleWeightFields.includes(f.name.toLowerCase())
            );
            
            const measurementField = performerFields.find(f => 
                possibleMeasurementFields.includes(f.name.toLowerCase())
            );

            // Query with the discovered field names and include performer names, countries, and images
            let query = `query {
                allPerformers {
                    id
                    name
                    country
                    gender
                    image_path
                    favorite`;
            
            if (heightField) {
                query += `\n            ${heightField.name}`;
            }
            if (weightField) {
                query += `\n            ${weightField.name}`;
            }
            if (measurementField) {
                query += `\n            ${measurementField.name}`;
            }
            
            query += `\n        }\n    }`;

            console.log("BodyStats: Using query:", query);

            const response = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const result = await response.json();
            
            if (result.data?.allPerformers) {
                // Process performers with country flags, measurements, and calculate BMI and body type
                const performersWithData = result.data.allPerformers.map(p => {
                    const countryCode = p.country ? getCountryFlag(p.country) : null;
                    
                    // Extract numeric values for height and weight
                    let heightValue = null;
                    let weightValue = null;
                    let measurements = null;
                    let bodyType = null;
                    
                    if (heightField && p[heightField.name]) {
                        const val = p[heightField.name];
                        if (typeof val === 'string') {
                            heightValue = parseFloat(val.replace(/[^0-9.-]/g, ''));
                        } else if (typeof val === 'number') {
                            heightValue = val;
                        }
                        
                        if (heightValue && (heightValue < 100 || heightValue > 250)) {
                            heightValue = null;
                        }
                    }
                    
                    if (weightField && p[weightField.name]) {
                        let val = p[weightField.name];
                        if (typeof val === 'string') {
                            val = parseFloat(val.replace(/[^0-9.-]/g, ''));
                        } else if (typeof val === 'number') {
                            val = val;
                        } else {
                            val = null;
                        }
                        
                        if (val !== null && !isNaN(val) && val > 0) {
                            const fieldName = weightField.name.toLowerCase();
                            if (fieldName.includes('lbs') || fieldName.includes('pound')) {
                                val = val * 0.453592;
                            }
                            
                            if (val >= 30 && val <= 200) {
                                weightValue = Math.round(val * 10) / 10;
                            }
                        }
                    }
                    
                    // Parse measurements if available
                    if (measurementField && p[measurementField.name]) {
                        measurements = parseMeasurements(p[measurementField.name]);
                        if (measurements) {
                            bodyType = getBodyType(measurements);
                        }
                    }
                    
                    // Calculate BMI if both height and weight are available
                    const bmi = calculateBMI(heightValue, weightValue);
                    const bmiCategory = bmi ? getBMICategory(bmi) : null;
                    
                    return {
                        ...p,
                        countryCode: countryCode,
                        countryFlag: countryCode ? getFlagEmoji(countryCode) : null,
                        favorite: p.favorite || false,
                        gender: p.gender || '',
                        height_value: heightValue && !isNaN(heightValue) && heightValue > 0 ? heightValue : null,
                        weight_value: weightValue && !isNaN(weightValue) && weightValue > 0 ? weightValue : null,
                        measurements: measurements,
                        bodyType: bodyType,
                        bmi: bmi,
                        bmi_category: bmiCategory
                    };
                });
                
                window.bodyStatsPerformers = performersWithData;
                displayBodyStats(
                    container, 
                    performersWithData,
                    heightField?.name,
                    weightField?.name,
                    measurementField?.name
                );
            } else {
                showError(container, "No performer data found");
            }
        } catch (error) {
            console.error("BodyStats Error:", error);
            showError(container, "Failed to load data");
        }
    }

    function displayBodyStats(container, allPerformers, heightFieldName, weightFieldName, measurementFieldName) {
        // Apply gender filter using plugin's independent filter
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

        // Process height data
        let heightData = [];
        if (heightFieldName) {
            heightData = performers
                .filter(p => p.height_value !== null)
                .map(p => ({
                    value: p.height_value,
                    performer: p
                }));
        }

        // Process weight data
        let weightData = [];
        if (weightFieldName) {
            weightData = performers
                .filter(p => p.weight_value !== null)
                .map(p => ({
                    value: p.weight_value,
                    performer: p
                }));
        }

        // Process BMI data
        let bmiData = performers
            .filter(p => p.bmi !== null)
            .map(p => ({
                value: p.bmi,
                category: p.bmi_category,
                performer: p
            }));

        // Process body type data
        let bodyTypeData = performers
            .filter(p => p.bodyType !== null)
            .map(p => ({
                value: p.bodyType,
                performer: p
            }));

        // Calculate statistics
        const heightStats = calculateStatsWithPerformers(heightData);
        const weightStats = calculateStatsWithPerformers(weightData);
        const bmiStats = calculateStatsWithPerformers(bmiData);
        const bodyTypeStats = calculateBodyTypeStats(bodyTypeData);

        // Create range distributions
        const heightRanges = createHeightRanges(heightData, performers.length);
        const weightRanges = createWeightRanges(weightData, performers.length);
        const bmiRanges = createBMIRanges(bmiData, performers.length);
        const bodyTypeRanges = createBodyTypeRanges(bodyTypeData, performers.length);

        // Build HTML with filter buttons
        const html = `
            <div style="background: var(--card-bg, #2d2d2d); border-radius: 6px; overflow: hidden;">
                <div style="padding: 10px; border-bottom: 1px solid var(--border-color, #3d3d3d);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <h3 style="margin: 0; color: var(--text-color, #e0e0e0); font-size: 1.1rem;">
                            <i class="fa fa-arrows-v"></i> Body Statistics (Metric)
                        </h3>
                        
                        <!-- Gender Filter Buttons (Independent) -->
                        <div style="display: flex; gap: 5px;">
                            <button id="body-gender-filter-all" class="btn btn-mini ${currentGenderFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" 
                                    style="padding: 4px 12px; font-size: 0.8em;" onclick="setBodyGenderFilter('all')">
                                All (${allPerformers.length})
                            </button>
                            <button id="body-gender-filter-female" class="btn btn-mini ${currentGenderFilter === 'female' ? 'btn-primary' : 'btn-secondary'}" 
                                    style="padding: 4px 12px; font-size: 0.8em;" onclick="setBodyGenderFilter('female')">
                                👩 Women (${femaleCount})
                            </button>
                            <button id="body-gender-filter-male" class="btn btn-mini ${currentGenderFilter === 'male' ? 'btn-primary' : 'btn-secondary'}" 
                                    style="padding: 4px 12px; font-size: 0.8em;" onclick="setBodyGenderFilter('male')">
                                👨 Men (${maleCount})
                            </button>
                            <button id="body-gender-filter-other" class="btn btn-mini ${currentGenderFilter === 'other' ? 'btn-primary' : 'btn-secondary'}" 
                                    style="padding: 4px 12px; font-size: 0.8em;" onclick="setBodyGenderFilter('other')">
                                ⚧ Others (${otherCount + unknownGender})
                            </button>
                        </div>
                    </div>
                    <div style="margin-top: 5px; color: #888; font-size: 0.85em;">
                        Showing: ${performers.length} performers
                    </div>
                </div>
                <div style="padding: 12px;">
                    
                    <!-- Height Section -->
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 8px 0; color: var(--text-color, #e0e0e0); display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                            <i class="fa fa-arrows-v" style="color: #4a9eff;"></i> Height (cm)
                            ${heightFieldName ? `<span style="font-size: 0.75em; color: #888;">(${heightFieldName})</span>` : ''}
                        </h4>
                        
                        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                            ${generateStatsCard('Minimum', heightStats.min, 'cm', 'height')}
                            ${generateStatsCard('Maximum', heightStats.max, 'cm', 'height')}
                            ${generateStatsCard('Average', { value: heightStats.avg, performer: null }, 'cm')}
                        </div>

                        ${generateRangeBars('height', heightRanges, 'cm', performers.length)}
                    </div>

                    <!-- Weight Section -->
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 8px 0; color: var(--text-color, #e0e0e0); display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                            <i class="fa fa-balance-scale" style="color: #4a9eff;"></i> Weight (kg)
                            ${weightFieldName ? `<span style="font-size: 0.75em; color: #888;">(${weightFieldName})</span>` : ''}
                        </h4>
                        
                        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                            ${generateStatsCard('Minimum', weightStats.min, 'kg', 'weight')}
                            ${generateStatsCard('Maximum', weightStats.max, 'kg', 'weight')}
                            ${generateStatsCard('Average', { value: weightStats.avg, performer: null }, 'kg')}
                        </div>

                        ${generateRangeBars('weight', weightRanges, 'kg', performers.length)}
                    </div>

                    <!-- BMI Section -->
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 8px 0; color: var(--text-color, #e0e0e0); display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                            <i class="fa fa-calculator" style="color: #FF9800;"></i> BMI (Body Mass Index)
                        </h4>
                        
                        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                            ${generateStatsCard('Minimum BMI', bmiStats.min, '', 'bmi')}
                            ${generateStatsCard('Maximum BMI', bmiStats.max, '', 'bmi')}
                            ${generateStatsCard('Average BMI', { value: bmiStats.avg, performer: null }, '')}
                        </div>

                        ${generateBMICategoryBars(bmiRanges, performers.length)}
                    </div>

                    <!-- Body Type Section -->
                    <div style="margin-bottom: 15px;">
                        <h4 style="margin: 0 0 8px 0; color: var(--text-color, #e0e0e0); display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                            <i class="fa fa-female" style="color: #ff69b4;"></i> Body Type Classification
                            ${measurementFieldName ? `<span style="font-size: 0.75em; color: #888;">(based on ${measurementFieldName})</span>` : ''}
                        </h4>
                        
                        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                            ${generateStatsCard('Most Common', bodyTypeStats.mostCommon, '', 'bodytype')}
                            ${generateStatsCard('Types Found', { value: bodyTypeStats.uniqueCount, performer: null }, '', 'bodytype')}
                            ${generateStatsCard('With Data', { value: bodyTypeStats.count, performer: null }, '', 'bodytype')}
                        </div>

                        ${generateBodyTypeBars(bodyTypeRanges, performers.length)}
                    </div>

                    <!-- Data Quality Note -->
                    <div style="margin-top: 15px; padding: 6px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; text-align: center; color: #888; font-size: 0.75em;">
                        <i class="fa fa-info-circle"></i> 
                        Based on ${performers.length} filtered performers (${allPerformers.length} total)<br>
                        ${heightFieldName && heightData.length < performers.length ? `Height data: ${heightData.length} (${((heightData.length/performers.length)*100).toFixed(1)}%)<br>` : ''}
                        ${weightFieldName && weightData.length < performers.length ? `Weight data: ${weightData.length} (${((weightData.length/performers.length)*100).toFixed(1)}%)<br>` : ''}
                        ${bmiData.length < performers.length ? `BMI data: ${bmiData.length} (${((bmiData.length/performers.length)*100).toFixed(1)}%)<br>` : ''}
                        ${bodyTypeData.length < performers.length ? `Body type data: ${bodyTypeData.length} (${((bodyTypeData.length/performers.length)*100).toFixed(1)}%)` : ''}
                        ${!heightFieldName ? '<span style="color: #ff6b6b;">No height field</span><br>' : ''}
                        ${!weightFieldName ? '<span style="color: #ff6b6b;">No weight field</span><br>' : ''}
                        ${!measurementFieldName ? '<span style="color: #ff6b6b;">No measurements field</span>' : ''}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function createHeightRanges(heightData, totalPerformers) {
        if (heightData.length === 0) return [];

        const values = heightData.map(d => d.value);
        const min = Math.floor(Math.min(...values) / 5) * 5;
        const max = Math.ceil(Math.max(...values) / 5) * 5;
        
        const ranges = [];
        for (let start = min; start < max; start += 5) {
            const end = start + 5;
            const performersInRange = heightData.filter(d => 
                d.value >= start && d.value < end
            );
            
            if (performersInRange.length > 0) {
                ranges.push({
                    label: `${start}-${end}`,
                    count: performersInRange.length,
                    percentage: (performersInRange.length / totalPerformers) * 100,
                    performers: performersInRange.map(d => d.performer)
                });
            }
        }
        
        return ranges;
    }

    function createWeightRanges(weightData, totalPerformers) {
        if (weightData.length === 0) return [];

        const values = weightData.map(d => d.value);
        const min = Math.floor(Math.min(...values) / 5) * 5;
        const max = Math.ceil(Math.max(...values) / 5) * 5;
        
        const ranges = [];
        for (let start = min; start < max; start += 5) {
            const end = start + 5;
            const performersInRange = weightData.filter(d => 
                d.value >= start && d.value < end
            );
            
            if (performersInRange.length > 0) {
                ranges.push({
                    label: `${start}-${end}`,
                    count: performersInRange.length,
                    percentage: (performersInRange.length / totalPerformers) * 100,
                    performers: performersInRange.map(d => d.performer)
                });
            }
        }
        
        return ranges;
    }

    function createBMIRanges(bmiData, totalPerformers) {
        if (bmiData.length === 0) return [];

        const categories = [
            { name: 'Underweight', min: 0, max: 18.5, color: '#2196F3' },
            { name: 'Normal', min: 18.5, max: 25, color: '#4CAF50' },
            { name: 'Overweight', min: 25, max: 30, color: '#FFC107' },
            { name: 'Obese', min: 30, max: 100, color: '#F44336' }
        ];

        const ranges = [];
        
        categories.forEach(category => {
            const performersInCategory = bmiData.filter(d => 
                d.value >= category.min && d.value < category.max
            );
            
            if (performersInCategory.length > 0) {
                ranges.push({
                    label: category.name,
                    count: performersInCategory.length,
                    percentage: (performersInCategory.length / totalPerformers) * 100,
                    color: category.color,
                    performers: performersInCategory.map(d => d.performer)
                });
            }
        });
        
        return ranges;
    }

    function createBodyTypeRanges(bodyTypeData, totalPerformers) {
        if (bodyTypeData.length === 0) return [];

        const typeMap = new Map();
        
        bodyTypeData.forEach(item => {
            const type = item.value;
            if (!typeMap.has(type)) {
                typeMap.set(type, []);
            }
            typeMap.get(type).push(item.performer);
        });

        const colors = {
            'Hourglass': '#ff69b4',
            'Pear': '#9c27b0',
            'Inverted Triangle': '#2196f3',
            'Athletic': '#4caf50',
            'Apple': '#ff9800',
            'Rectangle': '#795548',
            'Unknown': '#888'
        };

        const ranges = [];
        typeMap.forEach((performers, type) => {
            ranges.push({
                label: type,
                count: performers.length,
                percentage: (performers.length / totalPerformers) * 100,
                color: colors[type] || '#888',
                performers: performers
            });
        });

        // Sort by count (most common first)
        ranges.sort((a, b) => b.count - a.count);
        
        return ranges;
    }

    function calculateBodyTypeStats(bodyTypeData) {
        if (bodyTypeData.length === 0) {
            return {
                mostCommon: { value: 'No data', performer: null },
                uniqueCount: 0,
                count: 0
            };
        }

        const typeCounts = new Map();
        bodyTypeData.forEach(item => {
            const type = item.value;
            typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
        });

        let mostCommonType = null;
        let maxCount = 0;
        typeCounts.forEach((count, type) => {
            if (count > maxCount) {
                maxCount = count;
                mostCommonType = type;
            }
        });

        return {
            mostCommon: { value: mostCommonType, performer: null },
            uniqueCount: typeCounts.size,
            count: bodyTypeData.length
        };
    }

    function generateStatsCard(title, data, unit, type) {
        if (data.value === 'No data') {
            return `
                <div style="flex: 1; min-width: 100px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                    <div style="color: #888; font-size: 0.7em;">${title}</div>
                    <div style="color: #888; margin-top: 3px; font-size: 0.9em;">No data</div>
                </div>
            `;
        }

        return `
            <div style="flex: 1; min-width: 120px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="color: #888; font-size: 0.7em;">${title}</div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 3px; gap: 8px; flex-wrap: wrap;">
                    <span style="font-size: 1.1em; font-weight: bold; color: #4CAF50;">${data.value} ${unit}</span>
                    ${data.performer ? `
                        <span class="performer-name-tooltip" 
                              style="color: #4a9eff; cursor: pointer; padding: 2px 6px; background: var(--card-bg, #2d2d2d); border-radius: 12px; font-size: 0.8em; border: 1px solid var(--border-color, #4d4d4d); display: inline-flex; align-items: center; gap: 4px;"
                              onclick="openBodyStatsPerformer('${data.performer.id}', event)"
                              onmouseover="showBodyStatsTooltip(this, '${data.performer.id}', '${data.value} ${unit}')"
                              onmouseout="hideBodyStatsTooltip()">
                            ${data.performer.favorite ? '<span style="margin-right: 2px;">❤️</span>' : ''}
                            ${data.performer.countryFlag ? `<span style="font-size: 1.1em;">${data.performer.countryFlag}</span>` : ''}
                            ${data.performer.name}
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function generateRangeBars(type, ranges, unit, totalPerformers) {
        if (ranges.length === 0) {
            return `<p style="color: #888; text-align: center; padding: 8px; font-size: 0.8em;">No range data available</p>`;
        }

        return `
            <div style="background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    ${ranges.map((range, index) => {
                        const barColor = getRangeColor(range.percentage);
                        const rangeId = `${type}-range-${index}`;
                        
                        return `
                            <div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 0.8em;">
                                    <span style="color: #888;">${range.label} ${unit}</span>
                                    <span style="color: #4CAF50;">${range.count} (${range.percentage.toFixed(1)}%)</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <div style="flex: 1; height: 14px; background: var(--card-bg, #2d2d2d); border-radius: 7px; overflow: hidden; cursor: pointer;"
                                         onclick="toggleBodyRange('${rangeId}')">
                                        <div style="width: ${range.percentage}%; height: 100%; background: ${barColor}; transition: width 0.3s;"></div>
                                    </div>
                                    <i class="fa fa-chevron-down" id="icon-${rangeId}" style="color: #888; cursor: pointer; transition: transform 0.2s; font-size: 10px;" onclick="toggleBodyRange('${rangeId}')"></i>
                                </div>
                                <div id="${rangeId}" style="display: none; margin-top: 6px; padding: 6px; background: var(--card-bg, #2d2d2d); border-radius: 4px; max-height: 150px; overflow-y: auto;">
                                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                        ${range.performers.map(p => {
                                            const bgColor = p.favorite ? '#ff69b4' : 'var(--card-bg-alt, #3d3d3d)';
                                            const hoverColor = p.favorite ? '#ff1493' : '#4a9eff';
                                            
                                            return `
                                                <span class="performer-name-tooltip" 
                                                      style="background: ${bgColor}; padding: 2px 6px; border-radius: 12px; font-size: 0.7em; cursor: pointer; border: 1px solid var(--border-color, #4d4d4d); display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;"
                                                      onclick="openBodyStatsPerformer('${p.id}', event)"
                                                      onmouseover="this.style.background='${hoverColor}'; this.style.transform='scale(1.05)'; showBodyStatsTooltip(this, '${p.id}', '${getPerformerValue(p, type)} ${unit}')"
                                                      onmouseout="this.style.background='${bgColor}'; this.style.transform='scale(1)'; hideBodyStatsTooltip()">
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
            </div>
        `;
    }

    function generateBMICategoryBars(ranges, totalPerformers) {
        if (ranges.length === 0) {
            return `<p style="color: #888; text-align: center; padding: 8px; font-size: 0.8em;">No BMI data available</p>`;
        }

        return `
            <div style="background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${ranges.map((range, index) => {
                        const rangeId = `bmi-range-${index}`;
                        
                        return `
                            <div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 0.8em;">
                                    <span style="color: #888;">
                                        <span style="display: inline-block; width: 12px; height: 12px; background: ${range.color}; border-radius: 3px; margin-right: 6px;"></span>
                                        ${range.label}
                                    </span>
                                    <span style="color: ${range.color};">${range.count} (${range.percentage.toFixed(1)}%)</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <div style="flex: 1; height: 16px; background: var(--card-bg, #2d2d2d); border-radius: 8px; overflow: hidden; cursor: pointer;"
                                         onclick="toggleBodyRange('${rangeId}')">
                                        <div style="width: ${range.percentage}%; height: 100%; background: ${range.color}; transition: width 0.3s;"></div>
                                    </div>
                                    <i class="fa fa-chevron-down" id="icon-${rangeId}" style="color: #888; cursor: pointer; transition: transform 0.2s; font-size: 10px;" onclick="toggleBodyRange('${rangeId}')"></i>
                                </div>
                                <div id="${rangeId}" style="display: none; margin-top: 6px; padding: 6px; background: var(--card-bg, #2d2d2d); border-radius: 4px; max-height: 150px; overflow-y: auto;">
                                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                        ${range.performers.map(p => {
                                            const bgColor = p.favorite ? '#ff69b4' : 'var(--card-bg-alt, #3d3d3d)';
                                            const hoverColor = p.favorite ? '#ff1493' : '#4a9eff';
                                            
                                            return `
                                                <span class="performer-name-tooltip" 
                                                      style="background: ${bgColor}; padding: 2px 6px; border-radius: 12px; font-size: 0.7em; cursor: pointer; border: 1px solid var(--border-color, #4d4d4d); display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;"
                                                      onclick="openBodyStatsPerformer('${p.id}', event)"
                                                      onmouseover="this.style.background='${hoverColor}'; this.style.transform='scale(1.05)'; showBodyStatsTooltip(this, '${p.id}', 'BMI: ${p.bmi ? p.bmi.toFixed(1) : '?'}')"
                                                      onmouseout="this.style.background='${bgColor}'; this.style.transform='scale(1)'; hideBodyStatsTooltip()">
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
            </div>
        `;
    }

    function generateBodyTypeBars(ranges, totalPerformers) {
        if (ranges.length === 0) {
            return `<p style="color: #888; text-align: center; padding: 8px; font-size: 0.8em;">No body type data available</p>`;
        }

        return `
            <div style="background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${ranges.map((range, index) => {
                        const rangeId = `bodytype-range-${index}`;
                        
                        return `
                            <div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 0.8em;">
                                    <span style="color: #888;">
                                        <span style="display: inline-block; width: 12px; height: 12px; background: ${range.color}; border-radius: 3px; margin-right: 6px;"></span>
                                        ${range.label}
                                    </span>
                                    <span style="color: ${range.color};">${range.count} (${range.percentage.toFixed(1)}%)</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <div style="flex: 1; height: 16px; background: var(--card-bg, #2d2d2d); border-radius: 8px; overflow: hidden; cursor: pointer;"
                                         onclick="toggleBodyRange('${rangeId}')">
                                        <div style="width: ${range.percentage}%; height: 100%; background: ${range.color}; transition: width 0.3s;"></div>
                                    </div>
                                    <i class="fa fa-chevron-down" id="icon-${rangeId}" style="color: #888; cursor: pointer; transition: transform 0.2s; font-size: 10px;" onclick="toggleBodyRange('${rangeId}')"></i>
                                </div>
                                <div id="${rangeId}" style="display: none; margin-top: 6px; padding: 6px; background: var(--card-bg, #2d2d2d); border-radius: 4px; max-height: 150px; overflow-y: auto;">
                                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                        ${range.performers.map(p => {
                                            const bgColor = p.favorite ? '#ff69b4' : 'var(--card-bg-alt, #3d3d3d)';
                                            const hoverColor = p.favorite ? '#ff1493' : '#4a9eff';
                                            
                                            return `
                                                <span class="performer-name-tooltip" 
                                                      style="background: ${bgColor}; padding: 2px 6px; border-radius: 12px; font-size: 0.7em; cursor: pointer; border: 1px solid var(--border-color, #4d4d4d); display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;"
                                                      onclick="openBodyStatsPerformer('${p.id}', event)"
                                                      onmouseover="this.style.background='${hoverColor}'; this.style.transform='scale(1.05)'; showBodyStatsTooltip(this, '${p.id}', '${p.bodyType}')"
                                                      onmouseout="this.style.background='${bgColor}'; this.style.transform='scale(1)'; hideBodyStatsTooltip()">
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
            </div>
        `;
    }

    function getPerformerValue(performer, type) {
        if (type === 'height') {
            return performer.height_value ? performer.height_value.toFixed(1) : '?';
        } else if (type === 'weight') {
            return performer.weight_value ? performer.weight_value.toFixed(1) : '?';
        } else {
            return performer.bmi ? performer.bmi.toFixed(1) : '?';
        }
    }

    function calculateStatsWithPerformers(data) {
        if (data.length === 0) {
            return {
                min: { value: 'No data', performer: null },
                max: { value: 'No data', performer: null },
                avg: 'No data',
                count: 0
            };
        }

        const sorted = [...data].sort((a, b) => a.value - b.value);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        
        const sum = data.reduce((acc, item) => acc + item.value, 0);
        const avg = sum / data.length;

        return {
            min: {
                value: Math.round(min.value * 10) / 10,
                performer: min.performer
            },
            max: {
                value: Math.round(max.value * 10) / 10,
                performer: max.performer
            },
            avg: Math.round(avg * 10) / 10,
            count: data.length
        };
    }

    function getRangeColor(percentage) {
        if (percentage >= 20) return '#4CAF50';
        if (percentage >= 10) return '#FFC107';
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
            if (document.getElementById('body-stats-plugin') && isStatsPage()) {
                loadBodyData(container);
            }
        }, 3000);
    }

    // ==================== GLOBAL FUNCTIONS ====================

    window.toggleBodyRange = function(id) {
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

    window.setBodyGenderFilter = function(filter) {
        currentGenderFilter = filter;
        const container = document.getElementById('body-stats-plugin');
        if (container) {
            // Reload the display with new filter
            loadBodyData(container);
        }
    };

    window.showBodyStatsTooltip = function(element, performerId, value) {
        if (!isStatsPage()) return;
        
        const tooltip = document.getElementById('body-stats-tooltip');
        const img = document.getElementById('body-stats-tooltip-image');
        const fallback = document.getElementById('body-stats-tooltip-fallback');
        const nameDisplay = document.getElementById('body-stats-tooltip-name');
        const countryDisplay = document.getElementById('body-stats-tooltip-country');
        const valueDisplay = document.getElementById('body-stats-tooltip-value');
        
        if (!tooltip || !img || !fallback || !nameDisplay || !countryDisplay || !valueDisplay) return;
        
        const performer = window.bodyStatsPerformers?.find(p => p.id === performerId);
        const rect = element.getBoundingClientRect();
        
        tooltip.style.left = (rect.left + (rect.width / 2) - 100) + 'px';
        tooltip.style.top = (rect.top - 230) + 'px';
        
        nameDisplay.innerHTML = performer?.name || 'Unknown';
        
        if (performer?.country) {
            const flagEmoji = performer.countryFlag || '';
            countryDisplay.innerHTML = `${flagEmoji} ${performer.country}`;
        } else {
            countryDisplay.innerHTML = '';
        }
        
        valueDisplay.textContent = value || 'Value unknown';
        
        if (performer && performer.image_path) {
            img.src = performer.image_path;
            img.style.display = 'block';
            fallback.style.display = 'none';
        } else {
            img.style.display = 'none';
            fallback.style.display = 'flex';
        }
        
        tooltip.style.display = 'block';
    };

    window.hideBodyStatsTooltip = function() {
        const tooltip = document.getElementById('body-stats-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
            const img = document.getElementById('body-stats-tooltip-image');
            if (img) img.src = '';
        }
    };

    window.openBodyStatsPerformer = function(id, event) {
        if (event) event.stopPropagation();
        window.location.href = `/performers/${id}`;
    };
})();
