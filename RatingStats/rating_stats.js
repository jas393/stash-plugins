// scene_rating_stats.js - Rating statistics with configurable timeline and age grouping

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
        console.log("SceneRatingStats: Not stats page, exiting");
        return;
    }

    console.log("SceneRatingStats: Loading on stats page");

    // ==================== GROUPING STATE ====================
    
    let timelineGrouping = 1; // Number of months per bar (1 = monthly, 3 = quarterly, 6 = half-year, 12 = yearly)
    let ageGrouping = 1; // Number of years per bar (1, 2, 3, 5, 10)

    // ==================== GLOBAL TOOLTIP ====================
    
    if (!document.getElementById('scene-rating-stats-tooltip')) {
        const tooltipContainer = document.createElement('div');
        tooltipContainer.id = 'scene-rating-stats-tooltip';
        tooltipContainer.style.cssText = `
            position: fixed;
            display: none;
            z-index: 999999;
            pointer-events: none;
            background: var(--card-bg, #1a1a1a);
            border: 2px solid var(--border-color, #444);
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.8);
            width: 350px;
            max-width: 90vw;
            transition: opacity 0.1s;
        `;
        document.body.appendChild(tooltipContainer);

        // Image container - larger to show full image properly
        const imageContainer = document.createElement('div');
        imageContainer.id = 'scene-rating-stats-tooltip-image-container';
        imageContainer.style.cssText = `
            width: 320px;
            height: 200px;
            margin-bottom: 12px;
            display: flex;
            justify-content: center;
            background: var(--card-bg-alt, #2d2d2d);
            border-radius: 6px;
            overflow: hidden;
        `;
        tooltipContainer.appendChild(imageContainer);

        const tooltipImage = document.createElement('img');
        tooltipImage.id = 'scene-rating-stats-tooltip-image';
        tooltipImage.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
            display: block;
        `;
        imageContainer.appendChild(tooltipImage);

        const tooltipFallback = document.createElement('div');
        tooltipFallback.id = 'scene-rating-stats-tooltip-fallback';
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
        tooltipFallback.textContent = 'No image available';
        imageContainer.appendChild(tooltipFallback);

        // Title
        const tooltipTitle = document.createElement('div');
        tooltipTitle.id = 'scene-rating-stats-tooltip-title';
        tooltipTitle.style.cssText = `
            text-align: center;
            color: #ffd700;
            font-weight: bold;
            font-size: 1.1em;
            margin-bottom: 8px;
            word-wrap: break-word;
        `;
        tooltipContainer.appendChild(tooltipTitle);

        // Date and Rating in a flex row
        const infoRow = document.createElement('div');
        infoRow.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border-color, #3d3d3d);
        `;
        tooltipContainer.appendChild(infoRow);

        const tooltipDate = document.createElement('div');
        tooltipDate.id = 'scene-rating-stats-tooltip-date';
        tooltipDate.style.cssText = `
            color: #4a9eff;
            font-size: 0.95em;
        `;
        infoRow.appendChild(tooltipDate);

        const tooltipRating = document.createElement('div');
        tooltipRating.id = 'scene-rating-stats-tooltip-rating';
        tooltipRating.style.cssText = `
            color: #ffd700;
            font-size: 0.95em;
            font-weight: bold;
        `;
        infoRow.appendChild(tooltipRating);

        // Description
        const tooltipDescription = document.createElement('div');
        tooltipDescription.id = 'scene-rating-stats-tooltip-description';
        tooltipDescription.style.cssText = `
            text-align: left;
            color: #ccc;
            font-size: 0.9em;
            margin-bottom: 12px;
            padding: 8px;
            background: var(--card-bg-alt, #2d2d2d);
            border-radius: 4px;
            max-height: 100px;
            overflow-y: auto;
            border-left: 3px solid #ffd700;
            font-style: italic;
        `;
        tooltipContainer.appendChild(tooltipDescription);

        // Tags
        const tooltipTags = document.createElement('div');
        tooltipTags.id = 'scene-rating-stats-tooltip-tags';
        tooltipTags.style.cssText = `
            text-align: left;
            color: #888;
            font-size: 0.85em;
            margin-bottom: 12px;
            max-height: 80px;
            overflow-y: auto;
            padding: 6px;
            background: var(--card-bg-alt, #2d2d2d);
            border-radius: 4px;
        `;
        tooltipContainer.appendChild(tooltipTags);

        // Performers
        const tooltipPerformers = document.createElement('div');
        tooltipPerformers.id = 'scene-rating-stats-tooltip-performers';
        tooltipPerformers.style.cssText = `
            text-align: left;
            color: #888;
            font-size: 0.85em;
            max-height: 150px;
            overflow-y: auto;
            padding: 6px;
            border-top: 1px solid var(--border-color, #3d3d3d);
        `;
        tooltipContainer.appendChild(tooltipPerformers);
    }

    // ==================== HELPER FUNCTIONS ====================

    // Helper function to get country flag emoji
    function getCountryFlag(countryCode) {
        if (!countryCode) return null;
        
        // Handle common country names and convert to codes
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
    'C��d\'Ivoire': 'CI',
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
    'R궮ion': 'RE',
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
        
        // Convert country code to uppercase
        const code = countryCode.toUpperCase();
        
        // Convert to flag emoji (regional indicator symbols)
        const offset = 127397;
        const chars = [...code].map(c => String.fromCodePoint(c.charCodeAt(0) + offset));
        return chars.join('');
    }

    // ==================== CLEANUP ON NAVIGATION ====================
    
    function removePlugin() {
        const existing = document.getElementById('scene-rating-stats-plugin');
        if (existing) {
            existing.remove();
        }
        const tooltip = document.getElementById('scene-rating-stats-tooltip');
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

        if (initialized || document.getElementById('scene-rating-stats-plugin')) {
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
            addSceneRatingStats(targetContainer);
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
        
        if (!document.getElementById('scene-rating-stats-plugin')) {
            const statsContent = document.querySelector('.stats-container, .stats-content, table');
            if (statsContent && statsContent.children.length > 0) {
                console.log("SceneRatingStats: Detected stats content via observer");
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
                console.log("SceneRatingStats: Detected navigation to stats page");
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

    async function addSceneRatingStats(container) {
        if (!isStatsPage()) {
            removePlugin();
            return;
        }

        removePlugin();

        const section = document.createElement('div');
        section.id = 'scene-rating-stats-plugin';
        section.style.margin = '15px 0';
        section.style.width = '100%';
        
        section.innerHTML = `
            <div style="padding: 12px; background: var(--card-bg, #2d2d2d); border-radius: 6px;">
                <div style="display: flex; align-items: center; gap: 8px; color: var(--text-color, #e0e0e0); font-size: 0.9em;">
                    <i class="fa fa-spinner fa-spin"></i>
                    <span>Loading scene statistics...</span>
                </div>
            </div>
        `;
        
        container.appendChild(section);
        await loadSceneData(section);
    }

    async function loadSceneData(container) {
        if (!isStatsPage()) {
            removePlugin();
            return;
        }

        try {
            // First get all performers for age calculation
            const performersResponse = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query {
                        allPerformers {
                            id
                            name
                            birthdate
                            country
                            image_path
                            favorite
                        }
                    }`
                })
            });

            const performersResult = await performersResponse.json();
            const performers = performersResult.data?.allPerformers || [];

            // Create a map of performer birthdates and countries
            const performerBirthdates = new Map();
            const performerCountries = new Map();
            const performerFavorites = new Map();
            
            performers.forEach(p => {
                if (p.birthdate) {
                    performerBirthdates.set(p.id, p.birthdate);
                }
                if (p.country) {
                    performerCountries.set(p.id, p.country);
                }
                performerFavorites.set(p.id, p.favorite || false);
            });

            // Now get scenes with their performers and tags
            const scenesResponse = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query {
                        allScenes {
                            id
                            title
                            details
                            paths {
                                screenshot
                            }
                            rating100
                            date
                            performers {
                                id
                                name
                                image_path
                            }
                            tags {
                                id
                                name
                            }
                        }
                    }`
                })
            });

            const scenesResult = await scenesResponse.json();
            
            if (scenesResult.data?.allScenes) {
                // Process scenes with ratings, dates, performer ages, and countries
                const scenesWithData = scenesResult.data.allScenes.map(s => {
                    let rating5 = null;
                    if (s.rating100 !== null && s.rating100 !== undefined) {
                        const exactRating = s.rating100 / 20;
                        rating5 = Math.round(exactRating * 2) / 2;
                    }
                    
                    // Parse scene date
                    let sceneDateObj = null;
                    let sceneDateStr = null;
                    if (s.date) {
                        sceneDateStr = s.date;
                        const dateParts = s.date.split('-');
                        if (dateParts.length === 3) {
                            sceneDateObj = {
                                year: parseInt(dateParts[0]),
                                month: parseInt(dateParts[1]),
                                day: parseInt(dateParts[2]),
                                date: new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
                            };
                        }
                    }
                    
                    // Calculate ages and add countries for performers
                    const performersWithDetails = s.performers?.map(p => {
                        let age = null;
                        if (sceneDateObj && performerBirthdates.has(p.id)) {
                            const birthdate = performerBirthdates.get(p.id);
                            const birthParts = birthdate.split('-');
                            if (birthParts.length === 3) {
                                const birthDate = new Date(birthParts[0], birthParts[1] - 1, birthParts[2]);
                                const sceneDate = sceneDateObj.date;
                                age = calculateAge(birthDate, sceneDate);
                            }
                        }
                        
                        const country = performerCountries.get(p.id) || null;
                        const countryCode = country ? getCountryFlag(country) : null;
                        const favorite = performerFavorites.get(p.id) || false;
                        
                        return {
                            id: p.id,
                            name: p.name || 'Unknown',
                            image_path: p.image_path,
                            age: age,
                            country: country,
                            countryCode: countryCode,
                            countryFlag: countryCode ? getFlagEmoji(countryCode) : null,
                            favorite: favorite
                        };
                    }) || [];
                    
                    return {
                        id: s.id,
                        title: s.title || 'Untitled Scene',
                        details: s.details || 'No description available',
                        image_path: s.paths?.screenshot || null,
                        rating5: rating5,
                        rating100: s.rating100,
                        date: sceneDateObj,
                        dateStr: sceneDateStr,
                        performers: performersWithDetails,
                        tags: s.tags || []
                    };
                });
                
                window.sceneRatingStatsData = scenesWithData;
                displaySceneStats(container, scenesWithData);
            } else {
                showError(container, "No scene data found");
            }
        } catch (error) {
            console.error("SceneRatingStats Error:", error);
            showError(container, "Failed to load data");
        }
    }

    function calculateAge(birthDate, sceneDate) {
        let age = sceneDate.getFullYear() - birthDate.getFullYear();
        const m = sceneDate.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && sceneDate.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    function displaySceneStats(container, scenes) {
        // Process rating data with 0.5-point intervals
        const ratingData = processRatingData(scenes);
        
        // Process monthly timeline with zero months (using current grouping)
        const monthlyData = processMonthlyDataWithZeros(scenes, timelineGrouping);
        
        // Process age distribution with configurable grouping and zero bars
        const ageData = processAgeDataWithGroupingAndZeros(scenes, ageGrouping);
        
        // Calculate statistics
        const validRatings = scenes.filter(s => s.rating5 !== null).map(s => s.rating5);
        const totalRated = validRatings.length;
        const totalScenes = scenes.length;
        const scenesWithDates = scenes.filter(s => s.date !== null).length;
        const totalAgeEntries = ageData.reduce((sum, item) => sum + item.count, 0);
        
        let average = null;
        if (totalRated > 0) {
            average = validRatings.reduce((a, b) => a + b, 0) / totalRated;
            average = Math.round(average * 10) / 10;
        }

        // Timeline grouping options
        const timelineOptions = [
            { value: 1, label: 'Monthly' },
            { value: 3, label: 'Quarterly' },
            { value: 6, label: 'Half-year' },
            { value: 12, label: 'Yearly' }
        ];

        // Age grouping options
        const ageOptions = [
            { value: 1, label: '1 year' },
            { value: 2, label: '2 years' },
            { value: 3, label: '3 years' },
            { value: 5, label: '5 years' },
            { value: 10, label: '10 years' }
        ];

        const html = `
            <div style="background: var(--card-bg, #2d2d2d); border-radius: 6px; overflow: hidden;">
                <div style="padding: 10px; border-bottom: 1px solid var(--border-color, #3d3d3d);">
                    <h3 style="margin: 0; color: var(--text-color, #e0e0e0); font-size: 1.1rem;">
                        <i class="fa fa-star" style="color: #ffd700;"></i> Scene Statistics
                    </h3>
                </div>
                <div style="padding: 12px;">
                    
                    <!-- Rating Distribution -->
                    <div style="margin-bottom: 25px;">
                        <h4 style="margin: 0 0 10px 0; color: var(--text-color, #e0e0e0); font-size: 0.95rem;">
                            <i class="fa fa-star" style="color: #ffd700;"></i> Ratings (0-5) - 0.5 Point Intervals
                        </h4>
                        
                        <!-- Stats Cards -->
                        <div style="display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;">
                            ${generateStatsCards(ratingData, totalRated, average, totalScenes)}
                        </div>

                        <!-- Rating Bars (Clickable) -->
                        <div style="margin-bottom: 8px;">
                            ${generateRatingBars(ratingData, totalScenes)}
                        </div>
                    </div>

                    <!-- Horizontal Timeline with Stacked Scenes -->
                    <div style="margin-bottom: 25px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                            <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                                <h4 style="margin: 0; color: var(--text-color, #e0e0e0); font-size: 0.95rem;">
                                    <i class="fa fa-calendar"></i> Scenes Timeline
                                </h4>
                                
                                <!-- Timeline Grouping Option -->
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #888; font-size: 0.8em;">Group by:</span>
                                    <select id="timeline-grouping-select" style="padding: 3px 6px; background: var(--card-bg, #2d2d2d); color: var(--text-color, #e0e0e0); border: 1px solid var(--border-color, #4d4d4d); border-radius: 4px; font-size: 0.8em;">
                                        ${timelineOptions.map(opt => 
                                            `<option value="${opt.value}" ${timelineGrouping === opt.value ? 'selected' : ''}>${opt.label}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>
                            
                            <div style="display: flex; gap: 5px;">
                                <button class="btn btn-mini btn-primary" onclick="toggleAllMonths(true)" style="padding: 2px 8px; font-size: 0.8em;">Expand All</button>
                                <button class="btn btn-mini btn-secondary" onclick="toggleAllMonths(false)" style="padding: 2px 8px; font-size: 0.8em;">Collapse All</button>
                            </div>
                        </div>
                        
                        <!-- Timeline Stats -->
                        <div style="display: flex; gap: 6px; margin-bottom: 15px; flex-wrap: wrap;">
                            ${generateTimelineStats(monthlyData, scenesWithDates)}
                        </div>

                        <!-- Horizontal Timeline with Stacked Scene Names -->
                        <div style="margin-bottom: 8px; overflow-x: auto; max-height: 400px; overflow-y: auto;">
                            ${generateTimelineWithScenes(monthlyData)}
                        </div>
                    </div>

                    <!-- Age Distribution Graph with Configurable Grouping and Zero Bars -->
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                            <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                                <h4 style="margin: 0; color: var(--text-color, #e0e0e0); font-size: 0.95rem;">
                                    <i class="fa fa-users" style="color: #4a9eff;"></i> Performer Age Distribution
                                </h4>
                                
                                <!-- Age Grouping Option -->
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #888; font-size: 0.8em;">Group by:</span>
                                    <select id="age-grouping-select" style="padding: 3px 6px; background: var(--card-bg, #2d2d2d); color: var(--text-color, #e0e0e0); border: 1px solid var(--border-color, #4d4d4d); border-radius: 4px; font-size: 0.8em;">
                                        ${ageOptions.map(opt => 
                                            `<option value="${opt.value}" ${ageGrouping === opt.value ? 'selected' : ''}>${opt.label}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>
                            
                            <div style="display: flex; gap: 5px;">
                                <button class="btn btn-mini btn-primary" onclick="toggleAllAges(true)" style="padding: 2px 8px; font-size: 0.8em;">Expand All</button>
                                <button class="btn btn-mini btn-secondary" onclick="toggleAllAges(false)" style="padding: 2px 8px; font-size: 0.8em;">Collapse All</button>
                            </div>
                        </div>
                        
                        <!-- Age Stats -->
                        <div style="display: flex; gap: 6px; margin-bottom: 15px; flex-wrap: wrap;">
                            ${generateAgeStats(ageData, totalAgeEntries)}
                        </div>

                        <!-- Age Distribution Bars with Stacked Scenes and Zero Bars -->
                        <div style="margin-bottom: 8px; overflow-x: auto; max-height: 600px; overflow-y: auto;">
                            ${generateAgeBarsWithScenesAndZeros(ageData, totalAgeEntries)}
                        </div>
                    </div>

                    <!-- Data Quality Note -->
                    <div style="margin-top: 15px; padding: 6px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; text-align: center; color: #888; font-size: 0.75em;">
                        <i class="fa fa-info-circle"></i> 
                        ${totalScenes} total ՠ${totalRated} rated (${((totalRated/totalScenes)*100).toFixed(1)}%) ՠ${scenesWithDates} dated ՠ${totalAgeEntries} age entries
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        
        // Add event listener for timeline grouping selector
        const timelineSelector = document.getElementById('timeline-grouping-select');
        if (timelineSelector) {
            timelineSelector.addEventListener('change', function(e) {
                timelineGrouping = parseInt(e.target.value);
                // Reload the display with new grouping
                displaySceneStats(container, scenes);
            });
        }
        
        // Add event listener for age grouping selector
        const ageSelector = document.getElementById('age-grouping-select');
        if (ageSelector) {
            ageSelector.addEventListener('change', function(e) {
                ageGrouping = parseInt(e.target.value);
                // Reload the display with new grouping
                displaySceneStats(container, scenes);
            });
        }
    }

    function processRatingData(scenes) {
        // Create 0.5-point intervals from 0 to 5
        const intervals = [];
        for (let i = 0; i < 5; i += 0.5) {
            intervals.push({
                min: i,
                max: i + 0.5,
                label: i.toFixed(1) + '-' + (i + 0.5).toFixed(1)
            });
        }
        // Add special interval for exactly 5.0
        intervals.push({
            min: 5,
            max: 5,
            label: '5.0'
        });

        const groups = intervals.map(interval => ({
            label: interval.label,
            min: interval.min,
            max: interval.max,
            scenes: []
        }));

        scenes.forEach(s => {
            const rating = s.rating5;
            if (rating !== null) {
                const interval = groups.find(g => {
                    if (g.label === '5.0') {
                        return rating === 5.0;
                    }
                    return rating >= g.min && rating < g.max;
                });
                
                if (interval) {
                    interval.scenes.push({
                        id: s.id,
                        title: s.title,
                        details: s.details,
                        image_path: s.image_path,
                        rating: rating,
                        date: s.date,
                        dateStr: s.dateStr,
                        performers: s.performers,
                        tags: s.tags
                    });
                }
            }
        });

        return groups
            .map(group => ({
                label: group.label,
                count: group.scenes.length,
                scenes: group.scenes.sort((a, b) => a.title.localeCompare(b.title))
            }))
            .filter(group => group.count > 0);
    }

    function processMonthlyDataWithZeros(scenes, monthsPerBar) {
        // Find date range
        let minYear = 9999, maxYear = 0;
        let minMonth = 12, maxMonth = 1;
        
        scenes.forEach(s => {
            if (s.date) {
                if (s.date.year < minYear) minYear = s.date.year;
                if (s.date.year > maxYear) maxYear = s.date.year;
                if (s.date.year === minYear && s.date.month < minMonth) minMonth = s.date.month;
                if (s.date.year === maxYear && s.date.month > maxMonth) maxMonth = s.date.month;
            }
        });

        // If no dates, return empty
        if (minYear === 9999) return [];

        // Get current date
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // Cap max year/month to current date
        if (maxYear > currentYear) {
            maxYear = currentYear;
            maxMonth = currentMonth;
        } else if (maxYear === currentYear && maxMonth > currentMonth) {
            maxMonth = currentMonth;
        }

        // Create map of existing scenes
        const sceneMap = new Map();
        scenes.forEach(s => {
            if (s.date) {
                // Calculate which group this scene belongs to based on monthsPerBar
                const groupIndex = Math.floor((s.date.year * 12 + s.date.month - 1) / monthsPerBar);
                const groupKey = `group-${groupIndex}`;
                
                if (!sceneMap.has(groupKey)) {
                    sceneMap.set(groupKey, []);
                }
                sceneMap.get(groupKey).push(s);
            }
        });

        // Calculate start and end group indices (inclusive)
        const startTotalMonths = minYear * 12 + minMonth - 1;
        const endTotalMonths = maxYear * 12 + maxMonth - 1;
        
        const startGroup = Math.floor(startTotalMonths / monthsPerBar);
        const endGroup = Math.floor((endTotalMonths) / monthsPerBar);

        // Generate all groups in range (including the last one)
        const monthlyData = [];
        for (let group = startGroup; group <= endGroup; group++) {
            const groupStartMonth = group * monthsPerBar;
            const groupStartYear = Math.floor(groupStartMonth / 12);
            const groupStartMonthOfYear = (groupStartMonth % 12) + 1;
            
            // Format the display label
            let displayLabel;
            if (monthsPerBar === 1) {
                displayLabel = `${groupStartYear}-${String(groupStartMonthOfYear).padStart(2, '0')}`;
            } else if (monthsPerBar === 3) {
                const quarter = Math.ceil(groupStartMonthOfYear / 3);
                displayLabel = `${groupStartYear} Q${quarter}`;
            } else if (monthsPerBar === 6) {
                const half = groupStartMonthOfYear <= 6 ? 'H1' : 'H2';
                displayLabel = `${groupStartYear} ${half}`;
            } else {
                displayLabel = `${groupStartYear}`;
            }
            
            const scenesInGroup = sceneMap.get(`group-${group}`) || [];
            
            monthlyData.push({
                key: `group-${group}`,
                display: displayLabel,
                year: groupStartYear,
                month: groupStartMonthOfYear,
                count: scenesInGroup.length,
                scenes: scenesInGroup.sort((a, b) => {
                    if (a.date && b.date) {
                        const aTotal = a.date.year * 12 + a.date.month;
                        const bTotal = b.date.year * 12 + b.date.month;
                        if (aTotal !== bTotal) return aTotal - bTotal;
                        if (a.date.day && b.date.day) {
                            return a.date.day - b.date.day;
                        }
                    }
                    return a.title.localeCompare(b.title);
                })
            });
        }

        return monthlyData;
    }

    function processAgeDataWithGroupingAndZeros(scenes, yearsPerBar) {
        // Collect all ages from all performers in all scenes, with scene info
        const ageEntries = [];
        
        scenes.forEach(scene => {
            if (scene.performers && scene.performers.length > 0) {
                scene.performers.forEach(performer => {
                    if (performer.age !== null && performer.age > 0) {
                        ageEntries.push({
                            age: performer.age,
                            sceneId: scene.id,
                            title: scene.title,
                            details: scene.details,
                            image_path: scene.image_path,
                            dateStr: scene.dateStr,
                            performerName: performer.name,
                            performerAge: performer.age,
                            performerCountry: performer.country,
                            performerCountryCode: performer.countryCode,
                            performerFlag: performer.countryFlag,
                            performerFavorite: performer.favorite
                        });
                    }
                });
            }
        });

        if (ageEntries.length === 0) return [];

        // Find age range
        const ages = ageEntries.map(e => e.age);
        const minAge = Math.min(...ages);
        const maxAge = Math.max(...ages);
        
        // Calculate group boundaries to include all possible ages in range with zero bars (inclusive)
        const startGroup = Math.floor(minAge / yearsPerBar) * yearsPerBar;
        const endGroup = Math.ceil(maxAge / yearsPerBar) * yearsPerBar;
        
        // Create groups for all intervals in range (including zeros)
        const ageGroups = new Map();
        
        // Initialize all groups with zero counts (including the last one)
        for (let groupStart = startGroup; groupStart <= endGroup; groupStart += yearsPerBar) {
            const groupEnd = groupStart + yearsPerBar - 1;
            const groupLabel = yearsPerBar === 1 ? 
                `${groupStart}` : 
                `${groupStart}-${groupEnd}`;
            
            ageGroups.set(groupLabel, {
                label: groupLabel,
                start: groupStart,
                end: groupEnd,
                count: 0,
                scenes: []
            });
        }
        
        // Add entries to groups
        ageEntries.forEach(entry => {
            const groupStart = Math.floor(entry.age / yearsPerBar) * yearsPerBar;
            const groupEnd = groupStart + yearsPerBar - 1;
            const groupLabel = yearsPerBar === 1 ? 
                `${groupStart}` : 
                `${groupStart}-${groupEnd}`;
            
            const group = ageGroups.get(groupLabel);
            if (group) {
                group.count++;
                group.scenes.push({
                    id: entry.sceneId,
                    title: entry.title,
                    details: entry.details,
                    image_path: entry.image_path,
                    dateStr: entry.dateStr,
                    performerName: entry.performerName,
                    performerAge: entry.performerAge,
                    performerCountry: entry.performerCountry,
                    performerCountryCode: entry.performerCountryCode,
                    performerFlag: entry.performerFlag,
                    performerFavorite: entry.performerFavorite
                });
            }
        });

        // Convert to array and sort by age
        const ageData = Array.from(ageGroups.values())
            .map(group => ({
                label: group.label,
                age: group.start,
                count: group.count,
                scenes: group.scenes.sort((a, b) => a.title.localeCompare(b.title))
            }))
            .sort((a, b) => a.age - b.age);

        return ageData;
    }

    function generateStatsCards(ratingData, totalRated, average, totalScenes) {
        if (totalRated === 0) {
            return `<div style="color: #888; text-align: center; width: 100%; font-size: 0.85em;">No ratings</div>`;
        }

        const mostCommon = ratingData.length > 0 ? 
            ratingData.reduce((max, item) => item.count > max.count ? item : max, ratingData[0]) : 
            null;

        const percentageRated = ((totalRated / totalScenes) * 100).toFixed(1);

        return `
            <div style="flex: 1; min-width: 70px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="color: #888; font-size: 0.7em;">Average</div>
                <div style="font-size: 1.1em; font-weight: bold; color: #4CAF50;">${average ? average.toFixed(1) : '0'}</div>
                <div style="color: #4a9eff; font-size: 0.7em;">/ 5.0</div>
            </div>
            <div style="flex: 1; min-width: 70px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="color: #888; font-size: 0.7em;">Rated</div>
                <div style="font-size: 1.1em; font-weight: bold; color: #4a9eff;">${percentageRated}%</div>
                <div style="color: #888; font-size: 0.7em;">${totalRated}</div>
            </div>
            ${mostCommon ? `
                <div style="flex: 1; min-width: 70px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                    <div style="color: #888; font-size: 0.7em;">Most Common</div>
                    <div style="font-size: 0.9em; font-weight: bold; color: ${getRangeColor(mostCommon.label)};">${mostCommon.label}</div>
                    <div style="color: #4a9eff; font-size: 0.7em;">${mostCommon.count}</div>
                </div>
            ` : ''}
        `;
    }

    function generateTimelineStats(monthlyData, scenesWithDates) {
        if (monthlyData.length === 0) {
            return `<div style="color: #888; text-align: center; width: 100%; font-size: 0.85em;">No date data</div>`;
        }

        const totalMonths = monthlyData.length;
        const avgPerMonth = (scenesWithDates / totalMonths).toFixed(1);
        const busiestMonth = monthlyData.reduce((max, item) => item.count > max.count ? item : max, monthlyData[0]);
        const quietestMonth = monthlyData.reduce((min, item) => item.count < min.count ? item : min, monthlyData[0]);

        return `
            <div style="flex: 1; min-width: 70px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="color: #888; font-size: 0.7em;">Total Periods</div>
                <div style="font-size: 1.1em; font-weight: bold; color: #4a9eff;">${totalMonths}</div>
                <div style="color: #888; font-size: 0.7em;">with data</div>
            </div>
            <div style="flex: 1; min-width: 70px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="color: #888; font-size: 0.7em;">Average</div>
                <div style="font-size: 1.1em; font-weight: bold; color: #4CAF50;">${avgPerMonth}</div>
                <div style="color: #4a9eff; font-size: 0.7em;">per period</div>
            </div>
            <div style="flex: 1; min-width: 70px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="color: #888; font-size: 0.7em;">Busiest</div>
                <div style="font-size: 0.8em; font-weight: bold; color: #4CAF50;">${busiestMonth.display}</div>
                <div style="color: #4a9eff; font-size: 0.7em;">${busiestMonth.count}</div>
            </div>
            <div style="flex: 1; min-width: 70px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="color: #888; font-size: 0.7em;">Quietest</div>
                <div style="font-size: 0.8em; font-weight: bold; color: #F44336;">${quietestMonth.display}</div>
                <div style="color: #4a9eff; font-size: 0.7em;">${quietestMonth.count}</div>
            </div>
        `;
    }

    function generateAgeStats(ageData, totalAgeEntries) {
        if (ageData.length === 0) {
            return `<div style="color: #888; text-align: center; width: 100%; font-size: 0.85em;">No age data</div>`;
        }

        const mostCommon = ageData.reduce((max, item) => item.count > max.count ? item : max, ageData[0]);
        const averageAge = ageData.reduce((sum, item) => sum + (item.age * item.count), 0) / totalAgeEntries;

        return `
            <div style="flex: 1; min-width: 70px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="color: #888; font-size: 0.7em;">Total Entries</div>
                <div style="font-size: 1.1em; font-weight: bold; color: #4a9eff;">${totalAgeEntries}</div>
                <div style="color: #888; font-size: 0.7em;">age records</div>
            </div>
            <div style="flex: 1; min-width: 70px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="color: #888; font-size: 0.7em;">Average Age</div>
                <div style="font-size: 1.1em; font-weight: bold; color: #4CAF50;">${averageAge.toFixed(1)}</div>
                <div style="color: #4a9eff; font-size: 0.7em;">years</div>
            </div>
            <div style="flex: 1; min-width: 70px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="color: #888; font-size: 0.7em;">Most Common</div>
                <div style="font-size: 0.9em; font-weight: bold; color: #FF9800;">${mostCommon.label}</div>
                <div style="color: #4a9eff; font-size: 0.7em;">${mostCommon.count}</div>
            </div>
        `;
    }

    function generateRatingBars(ratingData, totalScenes) {
        if (ratingData.length === 0) {
            return `<p style="color: #888; text-align: center; padding: 8px; font-size: 0.8em;">No rating data</p>`;
        }

        return `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${ratingData.map((group, index) => {
                    const percentage = (group.count / totalScenes) * 100;
                    const barColor = getRangeColor(group.label);
                    const groupId = `scene-rating-group-${index}`;
                    
                    const ratingValue = parseFloat(group.label.split('-')[0]);
                    let starDisplay = '';
                    if (group.label === '5.0') {
                        starDisplay = '*****';
                    } else {
                        const fullStars = Math.floor(ratingValue);
                        const halfStar = (ratingValue % 1 === 0.5) ? '*' : '';
                        starDisplay = '*'.repeat(fullStars) + halfStar;
                    }
                    
                    return `
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 0.8em;">
                                <span style="color: #888;">
                                    ${starDisplay} <span style="color: #ffd700; margin-left: 4px;">${group.label}</span>
                                </span>
                                <span style="color: ${barColor};">${group.count}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <div style="flex: 1; height: 16px; background: var(--card-bg, #2d2d2d); border-radius: 8px; overflow: hidden; cursor: pointer;"
                                     onclick="toggleRatingGroup('${groupId}')">
                                    <div style="width: ${percentage}%; height: 100%; background: ${barColor}; transition: width 0.3s;"></div>
                                </div>
                                <span style="color: #888; font-size: 0.7em; min-width: 35px;">${percentage.toFixed(1)}%</span>
                                <i class="fa fa-chevron-down" id="icon-${groupId}" style="color: #888; cursor: pointer; transition: transform 0.2s; font-size: 10px;" onclick="toggleRatingGroup('${groupId}')"></i>
                            </div>
                            <div id="${groupId}" style="display: none; margin-top: 6px; padding: 6px; background: var(--card-bg, #2d2d2d); border-radius: 4px; max-height: 120px; overflow-y: auto;">
                                <div style="display: flex; flex-wrap: wrap; gap: 3px;">
                                    ${group.scenes.map(s => {
                                        // Collect unique flags from performers in this scene
                                        const uniqueFlags = new Set();
                                        s.performers.forEach(p => {
                                            if (p.countryFlag) {
                                                uniqueFlags.add(p.countryFlag);
                                            }
                                        });
                                        const flags = Array.from(uniqueFlags).join('');
                                        
                                        return `
                                            <span class="scene-name-tooltip" 
                                                  style="background: var(--card-bg-alt, #3d3d3d); padding: 2px 5px; border-radius: 8px; font-size: 0.7em; cursor: pointer; border: 1px solid var(--border-color, #4d4d4d); display: inline-block;"
                                                  onclick="openScenePage('${s.id}', event)"
                                                  onmouseover="showSceneTooltip('${s.id}', event)"
                                                  onmouseout="hideSceneRatingTooltip()">
                                                ${flags} ${s.title.length > 15 ? s.title.substring(0, 13) + '...' : s.title}
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

    function generateTimelineWithScenes(monthlyData) {
        if (monthlyData.length === 0) {
            return `<p style="color: #888; text-align: center; padding: 8px; font-size: 0.8em;">No timeline data</p>`;
        }

        const maxCount = Math.max(...monthlyData.map(m => m.count));

        return `
            <div style="display: flex; gap: 3px; min-width: ${monthlyData.length * 85}px; padding: 5px 0;">
                ${monthlyData.map((month, index) => {
                    const height = month.count > 0 ? Math.max(18, (month.count / maxCount) * 45) : 3;
                    const barColor = month.count > 0 ? getMonthColor(month.count, maxCount) : '#444';
                    const monthId = `month-group-${index}`;
                    
                    return `
                        <div style="display: flex; flex-direction: column; width: 80px; background: var(--card-bg-alt, #3d3d3d); border-radius: 3px; padding: 3px; opacity: ${month.count > 0 ? 1 : 0.6};">
                            <div style="font-size: 0.65em; color: #ffd700; font-weight: bold; margin-bottom: 2px; text-align: center;">
                                ${month.display}
                            </div>
                            
                            <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 4px;">
                                <div style="height: 50px; display: flex; flex-direction: column-reverse; align-items: center; width: 100%;">
                                    <div style="width: 30px; height: ${height}px; background: ${barColor}; border-radius: 2px 2px 0 0; cursor: pointer;"
                                         onclick="toggleMonthGroup('${monthId}')">
                                    </div>
                                </div>
                                <div style="font-size: 0.65em; color: ${barColor}; margin-top: 2px; font-weight: bold;">
                                    ${month.count}
                                </div>
                            </div>
                            
                            ${month.count > 0 ? `
                                <div id="${monthId}" style="display: none; margin-top: 2px; padding: 2px; background: var(--card-bg, #2d2d2d); border-radius: 3px; max-height: 150px; overflow-y: auto;">
                                    <div style="display: flex; flex-direction: column; gap: 2px;">
                                        ${month.scenes.map(s => {
                                            const shortTitle = s.title.length > 12 ? s.title.substring(0, 10) + '..' : s.title;
                                            
                                            // Collect unique flags from performers in this scene
                                            const uniqueFlags = new Set();
                                            s.performers.forEach(p => {
                                                if (p.countryFlag) {
                                                    uniqueFlags.add(p.countryFlag);
                                                }
                                            });
                                            const flags = Array.from(uniqueFlags).join('');
                                            
                                            return `
                                                <span class="scene-name-tooltip" 
                                                      style="background: var(--card-bg-alt, #3d3d3d); padding: 1px 2px; border-radius: 2px; font-size: 0.55em; cursor: pointer; border-left: 2px solid ${barColor}; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                                                      onclick="openScenePage('${s.id}', event)"
                                                      onmouseover="showSceneTooltip('${s.id}', event)"
                                                      onmouseout="hideSceneRatingTooltip()">
                                                    ${flags} ${shortTitle}
                                                </span>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            ` : `
                                <div style="height: 18px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 0.55em; border-top: 1px solid var(--border-color, #4d4d4d);">
                                    ؍
                                </div>
                            `}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function generateAgeBarsWithScenesAndZeros(ageData, totalAgeEntries) {
        if (ageData.length === 0) {
            return `<p style="color: #888; text-align: center; padding: 8px; font-size: 0.8em;">No age data</p>`;
        }

        const maxCount = Math.max(...ageData.map(d => d.count));

        return `
            <div style="display: flex; gap: 2px; min-width: ${ageData.length * 70}px; padding: 5px 0;">
                ${ageData.map((age, index) => {
                    const height = age.count > 0 ? Math.max(36, (age.count / maxCount) * 90) : 6;
                    const barColor = age.count > 0 ? getAgeColor(age.age) : '#444';
                    const ageId = `age-group-${index}`;
                    const percentage = totalAgeEntries > 0 ? (age.count / totalAgeEntries) * 100 : 0;
                    
                    return `
                        <div style="display: flex; flex-direction: column; width: 65px; background: var(--card-bg-alt, #3d3d3d); border-radius: 3px; padding: 3px; opacity: ${age.count > 0 ? 1 : 0.6};">
                            <div style="font-size: 0.6em; color: #ffd700; font-weight: bold; margin-bottom: 2px; text-align: center;">
                                ${age.label}
                            </div>
                            
                            <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 6px;">
                                <div style="height: 100px; display: flex; flex-direction: column-reverse; align-items: center; width: 100%;">
                                    <div style="width: 30px; height: ${height}px; background: ${barColor}; border-radius: 2px 2px 0 0; cursor: pointer;"
                                         onclick="toggleAgeGroup('${ageId}')">
                                    </div>
                                </div>
                                <div style="font-size: 0.6em; color: ${barColor}; margin-top: 4px; font-weight: bold;">
                                    ${age.count} (${percentage.toFixed(1)}%)
                                </div>
                            </div>
                            
                            ${age.count > 0 ? `
                                <div id="${ageId}" style="display: none; margin-top: 4px; padding: 3px; background: var(--card-bg, #2d2d2d); border-radius: 3px; max-height: 150px; overflow-y: auto;">
                                    <div style="display: flex; flex-direction: column; gap: 2px;">
                                        ${age.scenes.map(s => {
                                            const shortTitle = s.title.length > 12 ? s.title.substring(0, 10) + '..' : s.title;
                                            const flag = s.performerCountryCode ? 
                                                `<span style="margin-right: 2px;">${getFlagEmoji(s.performerCountryCode)}</span>` : 
                                                '';
                                            const heartIcon = s.performerFavorite ? '❤️' : '';
                                            return `
                                                <span class="scene-name-tooltip" 
                                                      style="background: var(--card-bg-alt, #3d3d3d); padding: 1px 2px; border-radius: 2px; font-size: 0.55em; cursor: pointer; border-left: 2px solid ${barColor}; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                                                      onclick="openScenePage('${s.id}', event)"
                                                      onmouseover="showSceneTooltip('${s.id}', event)"
                                                      onmouseout="hideSceneRatingTooltip()">
                                                    ${heartIcon}${flag} ${shortTitle}
                                                </span>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            ` : `
                                <div style="height: 18px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 0.5em; border-top: 1px solid var(--border-color, #4d4d4d);">
                                    ؍
                                </div>
                            `}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function getRangeColor(range) {
        const value = parseFloat(range.split('-')[0]);
        if (value >= 4.5) return '#4CAF50';
        if (value >= 3.5) return '#8BC34A';
        if (value >= 2.5) return '#FFC107';
        if (value >= 1.5) return '#FF9800';
        if (value >= 0.5) return '#FF5722';
        return '#F44336';
    }

    function getMonthColor(count, maxCount) {
        if (count >= maxCount * 0.8) return '#4CAF50';
        if (count >= maxCount * 0.5) return '#FFC107';
        return '#F44336';
    }

    function getAgeColor(age) {
        if (age < 20) return '#4CAF50';
        if (age < 25) return '#8BC34A';
        if (age < 30) return '#FFC107';
        if (age < 35) return '#FF9800';
        if (age < 40) return '#FF5722';
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
            if (document.getElementById('scene-rating-stats-plugin') && isStatsPage()) {
                loadSceneData(container);
            }
        }, 3000);
    }

    // ==================== GLOBAL FUNCTIONS ====================

    window.toggleRatingGroup = function(id) {
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

    window.toggleMonthGroup = function(id) {
        const element = document.getElementById(id);
        
        if (!element) return;
        
        if (element.style.display === 'none' || !element.style.display) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    };

    window.toggleAgeGroup = function(id) {
        const element = document.getElementById(id);
        
        if (!element) return;
        
        if (element.style.display === 'none' || !element.style.display) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    };

    window.toggleAllMonths = function(expand) {
        const monthGroups = document.querySelectorAll('[id^="month-group-"]');
        monthGroups.forEach(element => {
            if (expand) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });
    };

    window.toggleAllAges = function(expand) {
        const ageGroups = document.querySelectorAll('[id^="age-group-"]');
        ageGroups.forEach(element => {
            if (expand) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });
    };

    window.showSceneTooltip = function(sceneId, event) {
        if (!isStatsPage()) return;
        
        const tooltip = document.getElementById('scene-rating-stats-tooltip');
        const img = document.getElementById('scene-rating-stats-tooltip-image');
        const fallback = document.getElementById('scene-rating-stats-tooltip-fallback');
        const titleDisplay = document.getElementById('scene-rating-stats-tooltip-title');
        const dateDisplay = document.getElementById('scene-rating-stats-tooltip-date');
        const ratingDisplay = document.getElementById('scene-rating-stats-tooltip-rating');
        const descriptionDisplay = document.getElementById('scene-rating-stats-tooltip-description');
        const tagsDisplay = document.getElementById('scene-rating-stats-tooltip-tags');
        const performersDisplay = document.getElementById('scene-rating-stats-tooltip-performers');
        
        if (!tooltip || !img || !fallback || !titleDisplay || !dateDisplay || !ratingDisplay || !descriptionDisplay || !tagsDisplay || !performersDisplay) return;
        
        const scene = window.sceneRatingStatsData?.find(s => s.id === sceneId);
        if (!scene) return;
        
        const rect = event.target.getBoundingClientRect();
        
        // Position tooltip above with more space for larger tooltip
        tooltip.style.left = (rect.left + (rect.width / 2) - 175) + 'px';
        tooltip.style.top = (rect.top - 400) + 'px';
        
        titleDisplay.innerHTML = scene.title || 'Untitled';
        
        dateDisplay.innerHTML = ` 📅${scene.dateStr || 'No date'}`;
        
        if (scene.rating5 !== null) {
            const fullStars = Math.floor(scene.rating5);
            const halfStar = (scene.rating5 % 1 === 0.5) ? '*' : '';
            const stars = '*'.repeat(fullStars) + halfStar;
            ratingDisplay.innerHTML = `${stars} ${scene.rating5.toFixed(1)}/5`;
        } else {
            ratingDisplay.innerHTML = 'Not rated';
        }
        
        // Show description
        const description = scene.details || 'No description available';
        descriptionDisplay.innerHTML = description.length > 200 ? description.substring(0, 197) + '...' : description;
        
        // Show tags
        if (scene.tags && scene.tags.length > 0) {
            tagsDisplay.innerHTML = '<div style="color: #ffd700; margin-bottom: 3px;">Tags:</div>' + 
                scene.tags.map(t => {
                    return `<span style="display: inline-block; background: var(--card-bg, #2d2d2d); padding: 1px 6px; margin: 2px; border-radius: 10px; border: 1px solid var(--border-color, #4d4d4d);">#${t.name}</span>`;
                }).join(' ');
        } else {
            tagsDisplay.innerHTML = '<div style="color: #888;">No tags</div>';
        }
        
        // Show performers with flags and heart icons for favorites
        if (scene.performers && scene.performers.length > 0) {
            performersDisplay.innerHTML = '<div style="color: #ffd700; margin-bottom: 3px;">Performers:</div>' + 
                scene.performers.map(p => {
                    const ageText = p.age ? ` (${p.age})` : '';
                    const flagEmoji = p.countryFlag || '';
                    // Use a proper heart emoji instead of text
                    const heartIcon = p.favorite ? '❤️ ' : '';
                    return `<div style="margin: 2px 0;">${heartIcon}${flagEmoji} ${p.name}${ageText}</div>`;
                }).join('');
        } else {
            performersDisplay.innerHTML = '<div style="color: #888;">No performers</div>';
        }
        
        // Show full image (uncropped)
        if (scene.image_path) {
            img.src = scene.image_path;
            img.style.display = 'block';
            fallback.style.display = 'none';
            
            // Reset any previous sizing
            img.style.maxWidth = '100%';
            img.style.maxHeight = '200px';
            img.style.width = 'auto';
            img.style.height = 'auto';
        } else {
            img.style.display = 'none';
            fallback.style.display = 'flex';
        }
        
        tooltip.style.display = 'block';
    };

    window.hideSceneRatingTooltip = function() {
        const tooltip = document.getElementById('scene-rating-stats-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
            const img = document.getElementById('scene-rating-stats-tooltip-image');
            if (img) img.src = '';
        }
    };

    window.openScenePage = function(id, event) {
        if (event) event.stopPropagation();
        window.location.href = `/scenes/${id}`;
    };
})();
