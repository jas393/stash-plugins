// performer_stats.js - Guaranteed stats page only with auto-loading
// Now includes tags list, country flags, smart numeric custom field sorting, favorite indicators, and independent gender filters

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
        console.log("PerformerStats: Not stats page, exiting");
        return;
    }

    console.log("PerformerStats: Loading on stats page");

    // ==================== GENDER FILTER STATE ====================
    
    let currentGenderFilter = 'all'; // 'all', 'female', 'male', 'other'

    // ==================== GLOBAL TOOLTIP ====================
    
    if (!document.getElementById('performer-stats-tooltip')) {
        const tooltipContainer = document.createElement('div');
        tooltipContainer.id = 'performer-stats-tooltip';
        tooltipContainer.style.cssText = `
            position: fixed;
            display: none;
            z-index: 999999;
            pointer-events: none;
            background: var(--card-bg, #1a1a1a);
            border: 2px solid var(--border-color, #444);
            border-radius: 8px;
            padding: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.8);
            width: 180px;
            transition: opacity 0.1s;
        `;
        document.body.appendChild(tooltipContainer);

        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
            width: 164px;
            height: 164px;
            margin-bottom: 6px;
        `;
        tooltipContainer.appendChild(imageContainer);

        const tooltipImage = document.createElement('img');
        tooltipImage.id = 'performer-stats-tooltip-image';
        tooltipImage.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 4px;
        `;
        imageContainer.appendChild(tooltipImage);

        const tooltipFallback = document.createElement('div');
        tooltipFallback.id = 'performer-stats-tooltip-fallback';
        tooltipFallback.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #888;
            font-size: 12px;
            text-align: center;
            background: var(--card-bg-alt, #3d3d3d);
            border-radius: 4px;
            display: none;
        `;
        tooltipFallback.textContent = 'No image';
        imageContainer.appendChild(tooltipFallback);

        const tooltipName = document.createElement('div');
        tooltipName.id = 'performer-stats-tooltip-name';
        tooltipName.style.cssText = `
            text-align: center;
            color: #ffd700;
            font-weight: bold;
            font-size: 0.9em;
            margin-bottom: 4px;
            word-wrap: break-word;
        `;
        tooltipContainer.appendChild(tooltipName);

        const tooltipCountry = document.createElement('div');
        tooltipCountry.id = 'performer-stats-tooltip-country';
        tooltipCountry.style.cssText = `
            text-align: center;
            color: #4a9eff;
            font-size: 0.8em;
        `;
        tooltipContainer.appendChild(tooltipCountry);
    }

    // ==================== CLEANUP ON NAVIGATION ====================
    
    function removePlugin() {
        const existing = document.getElementById('performer-stats-plugin');
        if (existing) {
            existing.remove();
        }
        const tooltip = document.getElementById('performer-stats-tooltip');
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

        if (initialized || document.getElementById('performer-stats-plugin')) {
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
            addPerformerLists(targetContainer);
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
        
        if (!document.getElementById('performer-stats-plugin')) {
            const statsContent = document.querySelector('.stats-container, .stats-content, table');
            if (statsContent && statsContent.children.length > 0) {
                console.log("PerformerStats: Detected stats content via observer");
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
                console.log("PerformerStats: Detected navigation to stats page");
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

    // Function to check if a value is numeric
    function isNumericValue(value) {
        if (value === null || value === undefined) return false;
        const str = String(value).trim();
        if (str === '') return false;
        return !isNaN(parseFloat(str)) && isFinite(str) && /^-?\d*\.?\d+$/.test(str);
    }

    // Function to check if a field is predominantly numeric (>80% of non-null values are numeric)
    function isNumericField(groups) {
        if (groups.length === 0) return false;
        
        let totalValues = 0;
        let numericCount = 0;
        
        groups.forEach(group => {
            if (group.value !== 'Unknown/Not Set') {
                totalValues += group.count;
                if (isNumericValue(group.value)) {
                    numericCount += group.count;
                }
            }
        });
        
        return totalValues > 0 && (numericCount / totalValues) > 0.8;
    }

    // Function to extract custom field values
    function extractCustomFieldValue(performer, fieldName) {
        if (!performer.custom_fields) return null;
        
        if (typeof performer.custom_fields === 'object') {
            let value = performer.custom_fields[fieldName] || 
                       performer.custom_fields[fieldName.toLowerCase()] ||
                       performer.custom_fields[fieldName.toUpperCase()] ||
                       null;
            
            if (value && typeof value === 'object' && value.value !== undefined) {
                value = value.value;
            }
            
            return value !== null && value !== undefined ? String(value).trim() : null;
        }
        
        if (typeof performer.custom_fields === 'string') {
            try {
                const parsed = JSON.parse(performer.custom_fields);
                let value = parsed[fieldName] || 
                           parsed[fieldName.toLowerCase()] ||
                           parsed[fieldName.toUpperCase()] ||
                           null;
                
                if (value && typeof value === 'object' && value.value !== undefined) {
                    value = value.value;
                }
                
                return value !== null && value !== undefined ? String(value).trim() : null;
            } catch (e) {
                return null;
            }
        }
        
        return null;
    }

    // Function to discover available custom fields
    function discoverCustomFields(performers) {
        const fieldSet = new Set();
        
        performers.forEach(p => {
            if (p.custom_fields) {
                if (typeof p.custom_fields === 'object') {
                    Object.keys(p.custom_fields).forEach(key => fieldSet.add(key));
                } else if (typeof p.custom_fields === 'string') {
                    try {
                        const parsed = JSON.parse(p.custom_fields);
                        Object.keys(parsed).forEach(key => fieldSet.add(key));
                    } catch (e) {}
                }
            }
        });
        
        return Array.from(fieldSet).sort();
    }

    // Function to check if performer has penis (for dick_size logic)
    function hasPenis(performer) {
        const gender = (performer.gender || '').toLowerCase().trim();
        // Men and others might have penis, women typically don't in this context
        return gender === 'male' || gender === 'm' || gender === 'man' || 
               (gender && gender !== 'female' && gender !== 'f' && gender !== 'woman');
    }

    // ==================== MAIN PLUGIN FUNCTIONS ====================

    async function addPerformerLists(container) {
        if (!isStatsPage()) {
            removePlugin();
            return;
        }

        removePlugin();

        const section = document.createElement('div');
        section.id = 'performer-stats-plugin';
        section.style.margin = '20px 0';
        section.style.width = '100%';
        
        section.innerHTML = `
            <div style="padding: 20px; background: var(--card-bg, #2d2d2d); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px; color: var(--text-color, #e0e0e0);">
                    <i class="fa fa-spinner fa-spin"></i>
                    <span>Loading performer statistics...</span>
                </div>
            </div>
        `;
        
        container.appendChild(section);
        await loadPerformerData(section);
    }

    async function loadPerformerData(container) {
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
                            ethnicity
                            hair_color
                            eye_color
                            o_counter
                            fake_tits
                            image_path
                            country
                            gender
                            favorite
                            custom_fields
                            tags {
                                id
                                name
                            }
                        }
                    }`
                })
            });

            const result = await response.json();
            
            if (result.data?.allPerformers) {
                const performersWithFlags = result.data.allPerformers.map(p => {
                    const countryCode = p.country ? getCountryFlag(p.country) : null;
                    return {
                        ...p,
                        countryCode: countryCode,
                        countryFlag: countryCode ? getFlagEmoji(countryCode) : null,
                        favorite: p.favorite || false,
                        gender: p.gender || ''
                    };
                });
                
                window.performerStatsData = performersWithFlags;
                
                const customFields = discoverCustomFields(performersWithFlags);
                
                displayAllLists(container, performersWithFlags, customFields);
            } else {
                showError(container, "No performer data found");
            }
        } catch (error) {
            console.error("PerformerStats Error:", error);
            showError(container, "Failed to load data");
        }
    }

    function displayAllLists(container, allPerformers, customFields) {
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

        // Process standard categories with filtered performers
        const ethnicityData = processCategory(performers, 'ethnicity', 'Unknown/Not Set');
        const hairColorData = processCategory(performers, 'hair_color', 'Unknown/Not Set');
        const eyeColorData = processCategory(performers, 'eye_color', 'Unknown/Not Set');
        const oCounterData = processOCounterData(performers);
        
        // Conditional lists based on gender filter
        let fakeTitsData = [];
        let dickSizeData = [];
        
        if (currentGenderFilter === 'all') {
            // For 'all', create separate lists for those with/without penis
            const femaleOrOtherPerformers = performers.filter(p => !hasPenis(p));
            const maleOrOtherPerformers = performers.filter(p => hasPenis(p));
            
            fakeTitsData = processCategory(femaleOrOtherPerformers, 'fake_tits', 'Unknown/Not Set', 'alpha');
            
            // Create dick size data from appropriate performers
            dickSizeData = processDickSizeData(maleOrOtherPerformers);
        } else if (currentGenderFilter === 'female') {
            // Only women - show fake tits
            fakeTitsData = processCategory(performers, 'fake_tits', 'Unknown/Not Set', 'alpha');
        } else if (currentGenderFilter === 'male') {
            // Only men - show dick size
            dickSizeData = processDickSizeData(performers);
        } else if (currentGenderFilter === 'other') {
            // Others - show both (they might have either)
            fakeTitsData = processCategory(performers, 'fake_tits', 'Unknown/Not Set', 'alpha');
            dickSizeData = processDickSizeData(performers);
        }
        
        const tagsData = processTagsData(performers);
        
        const customFieldData = [];

        let html = `
            <div style="background: var(--card-bg, #2d2d2d); border-radius: 8px; overflow: hidden;">
                <div style="padding: 15px; border-bottom: 1px solid var(--border-color, #3d3d3d);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <h3 style="margin: 0; color: var(--text-color, #e0e0e0); font-size: 1.2rem;">
                            <i class="fa fa-bar-chart"></i> Performer Statistics
                        </h3>
                        
                        <!-- Gender Filter Buttons (Independent) -->
                        <div style="display: flex; gap: 5px;">
                            <button id="performer-gender-filter-all" class="btn btn-mini ${currentGenderFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" 
                                    style="padding: 4px 12px; font-size: 0.8em;" onclick="setPerformerGenderFilter('all')">
                                All (${allPerformers.length})
                            </button>
                            <button id="performer-gender-filter-female" class="btn btn-mini ${currentGenderFilter === 'female' ? 'btn-primary' : 'btn-secondary'}" 
                                    style="padding: 4px 12px; font-size: 0.8em;" onclick="setPerformerGenderFilter('female')">
                                👩 Women (${femaleCount})
                            </button>
                            <button id="performer-gender-filter-male" class="btn btn-mini ${currentGenderFilter === 'male' ? 'btn-primary' : 'btn-secondary'}" 
                                    style="padding: 4px 12px; font-size: 0.8em;" onclick="setPerformerGenderFilter('male')">
                                👨 Men (${maleCount})
                            </button>
                            <button id="performer-gender-filter-other" class="btn btn-mini ${currentGenderFilter === 'other' ? 'btn-primary' : 'btn-secondary'}" 
                                    style="padding: 4px 12px; font-size: 0.8em;" onclick="setPerformerGenderFilter('other')">
                                ⚧ Others (${otherCount + unknownGender})
                            </button>
                        </div>
                    </div>
                    <div style="margin-top: 5px; color: #888; font-size: 0.85em;">
                        Showing: ${performers.length} performers
                    </div>
                </div>
                <div style="padding: 15px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
        `;

        // Always show these lists
        html += generateListHTML('Ethnicity', 'fa-users', ethnicityData, performers.length, 'ethnicity', '1');
        html += generateListHTML('Hair Color', 'fa-eyedropper', hairColorData, performers.length, 'hair', '1');
        html += generateListHTML('Eye Color', 'fa-eye', eyeColorData, performers.length, 'eye', '1');
        html += generateListHTML('O-Counter', 'fa-heart', oCounterData, performers.length, 'ocounter', '1');
        
        // Show Fake Tits if data exists (for appropriate genders)
        if (fakeTitsData.length > 0) {
            html += generateListHTML('Fake Tits', 'fa-female', fakeTitsData, performers.length, 'faketits', '1');
        }
        
        // Show Dick Size if data exists (for appropriate genders)
        if (dickSizeData.length > 0) {
            html += generateListHTML('Dick Size', 'fa-arrows-h', dickSizeData, performers.length, 'dicksize', '1');
        }
        
        // Always show Tags
        html += generateListHTML('Tags', 'fa-tags', tagsData, performers.length, 'tags', '1');
        
        // Custom field selector always shown
        html += generateCustomFieldListHTML(customFields, performers.length, customFieldData);

        html += `
                    </div>
                    <div style="margin-top: 10px; padding: 10px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; text-align: right;">
                        <strong>Total in filter: ${performers.length}</strong> (out of ${allPerformers.length} total)
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        
        const selector = document.getElementById('custom-field-selector');
        if (selector) {
            selector.addEventListener('change', function(e) {
                const fieldName = e.target.value;
                if (fieldName) {
                    updateCustomFieldList(container, performers, fieldName);
                }
            });
        }
    }

    function processCategory(performers, field, unknownLabel, sortBy = 'count') {
        const groups = new Map();
        const unknownItems = [];

        performers.forEach(p => {
            const value = p[field]?.trim();
            if (value) {
                if (!groups.has(value)) {
                    groups.set(value, []);
                }
                groups.get(value).push({ 
                    id: p.id, 
                    name: p.name || 'Unnamed',
                    countryFlag: p.countryFlag,
                    countryCode: p.countryCode,
                    favorite: p.favorite
                });
            } else {
                unknownItems.push({ 
                    id: p.id, 
                    name: p.name || 'Unnamed',
                    countryFlag: p.countryFlag,
                    countryCode: p.countryCode,
                    favorite: p.favorite
                });
            }
        });

        let sortedGroups = Array.from(groups.entries())
            .map(([value, performerList]) => ({
                value,
                count: performerList.length,
                performers: performerList.sort((a, b) => a.name.localeCompare(b.name))
            }));

        if (sortBy === 'alpha') {
            sortedGroups.sort((a, b) => a.value.localeCompare(b.value));
        } else {
            sortedGroups.sort((a, b) => b.count - a.count);
        }

        if (unknownItems.length > 0) {
            sortedGroups.push({
                value: unknownLabel,
                count: unknownItems.length,
                performers: unknownItems.sort((a, b) => a.name.localeCompare(b.name))
            });
        }

        return sortedGroups;
    }

    function processOCounterData(performers) {
        const groups = new Map();

        performers.forEach(p => {
            const oCounter = p.o_counter !== undefined && p.o_counter !== null ? p.o_counter.toString() : '0';
            
            if (!groups.has(oCounter)) {
                groups.set(oCounter, []);
            }
            groups.get(oCounter).push({ 
                id: p.id, 
                name: p.name || 'Unnamed',
                countryFlag: p.countryFlag,
                countryCode: p.countryCode,
                favorite: p.favorite
            });
        });

        const sortedGroups = Array.from(groups.entries())
            .map(([value, performerList]) => ({
                value,
                count: performerList.length,
                performers: performerList.sort((a, b) => a.name.localeCompare(b.name))
            }))
            .sort((a, b) => parseInt(a.value) - parseInt(b.value));

        return sortedGroups;
    }

    function processDickSizeData(performers) {
        // Group by dick size (assuming it's a custom field or measurement)
        // For this example, we'll look for common dick size fields in custom_fields
        const groups = new Map();
        const unknownItems = [];

        performers.forEach(p => {
            // Try to find dick size in various possible locations
            let dickSize = null;
            
            // Check custom_fields for common dick size field names
            if (p.custom_fields) {
                const possibleFields = ['dick_size', 'penis_size', 'cock_size', 'length', 'size'];
                for (const field of possibleFields) {
                    const value = extractCustomFieldValue(p, field);
                    if (value) {
                        dickSize = value;
                        break;
                    }
                }
            }
            
            // If still not found, check if there's a measurements field that might contain it
            if (!dickSize && p.measurements) {
                // Measurements might be in format like "34-24-36" or could include dick size
                // This is a simplified approach
                const measurements = p.measurements;
                if (typeof measurements === 'string') {
                    const parts = measurements.split('-');
                    if (parts.length >= 1 && parts[0].match(/\d+/)) {
                        dickSize = parts[0];
                    }
                }
            }
            
            if (dickSize) {
                if (!groups.has(dickSize)) {
                    groups.set(dickSize, []);
                }
                groups.get(dickSize).push({ 
                    id: p.id, 
                    name: p.name || 'Unnamed',
                    countryFlag: p.countryFlag,
                    countryCode: p.countryCode,
                    favorite: p.favorite
                });
            } else {
                unknownItems.push({ 
                    id: p.id, 
                    name: p.name || 'Unnamed',
                    countryFlag: p.countryFlag,
                    countryCode: p.countryCode,
                    favorite: p.favorite
                });
            }
        });

        let sortedGroups = Array.from(groups.entries())
            .map(([value, performerList]) => ({
                value,
                count: performerList.length,
                performers: performerList.sort((a, b) => a.name.localeCompare(b.name))
            }))
            .sort((a, b) => {
                // Try numeric sort first
                const numA = parseFloat(a.value);
                const numB = parseFloat(b.value);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }
                // Fall back to string comparison
                return a.value.localeCompare(b.value);
            });

        if (unknownItems.length > 0) {
            sortedGroups.push({
                value: 'Unknown',
                count: unknownItems.length,
                performers: unknownItems.sort((a, b) => a.name.localeCompare(b.name))
            });
        }

        return sortedGroups;
    }

    function processTagsData(performers) {
        const tagMap = new Map();

        performers.forEach(p => {
            if (p.tags && p.tags.length > 0) {
                p.tags.forEach(tag => {
                    if (!tagMap.has(tag.id)) {
                        tagMap.set(tag.id, {
                            id: tag.id,
                            name: tag.name,
                            performers: []
                        });
                    }
                    tagMap.get(tag.id).performers.push({
                        id: p.id,
                        name: p.name || 'Unnamed',
                        countryFlag: p.countryFlag,
                        countryCode: p.countryCode,
                        favorite: p.favorite
                    });
                });
            }
        });

        const sortedTags = Array.from(tagMap.values())
            .map(tag => ({
                value: tag.name,
                count: tag.performers.length,
                performers: tag.performers.sort((a, b) => a.name.localeCompare(b.name))
            }))
            .sort((a, b) => b.count - a.count);

        return sortedTags;
    }

    function processCustomField(performers, fieldName) {
        const groups = new Map();
        const unknownItems = [];

        performers.forEach(p => {
            const value = extractCustomFieldValue(p, fieldName);
            if (value && value !== '' && value.toLowerCase() !== 'unknown' && value.toLowerCase() !== 'not set') {
                if (!groups.has(value)) {
                    groups.set(value, []);
                }
                groups.get(value).push({ 
                    id: p.id, 
                    name: p.name || 'Unnamed',
                    countryFlag: p.countryFlag,
                    countryCode: p.countryCode,
                    favorite: p.favorite
                });
            } else {
                unknownItems.push({ 
                    id: p.id, 
                    name: p.name || 'Unnamed',
                    countryFlag: p.countryFlag,
                    countryCode: p.countryCode,
                    favorite: p.favorite
                });
            }
        });

        let sortedGroups = Array.from(groups.entries())
            .map(([value, performerList]) => ({
                value,
                count: performerList.length,
                performers: performerList.sort((a, b) => a.name.localeCompare(b.name))
            }));

        const isNumeric = isNumericField(sortedGroups);
        
        if (isNumeric) {
            sortedGroups.sort((a, b) => {
                const numA = parseFloat(a.value);
                const numB = parseFloat(b.value);
                return numA - numB;
            });
        } else {
            sortedGroups.sort((a, b) => b.count - a.count);
        }

        if (unknownItems.length > 0) {
            sortedGroups.push({
                value: 'Unknown/Not Set',
                count: unknownItems.length,
                performers: unknownItems.sort((a, b) => a.name.localeCompare(b.name))
            });
        }

        return {
            groups: sortedGroups,
            isNumeric: isNumeric
        };
    }

    function generateListHTML(title, icon, data, totalPerformers, baseId, flexGrow) {
        if (data.length === 0) {
            return `
                <div style="flex: ${flexGrow}; min-width: 300px; background: var(--card-bg-alt, #3d3d3d); border-radius: 6px; padding: 15px;">
                    <h4 style="margin: 0 0 15px 0; color: var(--text-color, #e0e0e0); display: flex; align-items: center; gap: 8px;">
                        <i class="fa ${icon}"></i> ${title}
                    </h4>
                    <p style="color: #888; text-align: center; margin: 20px 0;">No data available</p>
                </div>
            `;
        }

        let listItems = '';
        data.forEach((group, index) => {
            const percentage = ((group.count / totalPerformers) * 100).toFixed(1);
            const groupId = `${baseId}-group-${index}`;
            const barColor = getPercentageColor(percentage);
            
            listItems += `
                <div style="margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                        <div style="display: flex; align-items: center; gap: 8px; width: 100%; cursor: pointer;" 
                             onclick="toggleGroup('${groupId}')">
                            <div style="min-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                <strong>${index+1}. ${group.value}</strong>
                            </div>
                            <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 100px; height: 20px; background: var(--card-bg, #2d2d2d); border-radius: 10px; overflow: hidden;">
                                    <div style="width: ${percentage}%; height: 100%; background: ${barColor}; transition: width 0.3s;"></div>
                                </div>
                                <span style="color: #888; font-size: 0.85em; min-width: 70px;">
                                    ${group.count} (${percentage}%)
                                </span>
                            </div>
                            <i class="fa fa-chevron-down" id="icon-${groupId}" style="transition: transform 0.2s; font-size: 12px;"></i>
                        </div>
                    </div>
                    <div id="${groupId}" style="display: none; padding: 10px; background: var(--card-bg, #2d2d2d); margin-top: 5px; border-radius: 4px; max-height: 200px; overflow-y: auto;">
                        <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                            ${group.performers.map(p => {
                                const bgColor = p.favorite ? '#ff69b4' : 'var(--card-bg-alt, #3d3d3d)';
                                const hoverColor = p.favorite ? '#ff1493' : '#4a9eff';
                                
                                return `
                                    <span class="performer-name-tooltip" 
                                          style="background: ${bgColor}; padding: 3px 8px; border-radius: 12px; font-size: 0.85em; cursor: pointer; border: 1px solid var(--border-color, #4d4d4d); display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;"
                                          onclick="openPerformerPage('${p.id}', event)"
                                          onmouseover="this.style.background='${hoverColor}'; this.style.transform='scale(1.05)'; showPerformerTooltip(this, '${p.id}')"
                                          onmouseout="this.style.background='${bgColor}'; this.style.transform='scale(1)'; hidePerformerTooltip()">
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
        });

        return `
            <div style="flex: ${flexGrow}; min-width: 300px; background: var(--card-bg-alt, #3d3d3d); border-radius: 6px; padding: 15px;">
                <h4 style="margin: 0 0 15px 0; color: var(--text-color, #e0e0e0); display: flex; align-items: center; gap: 8px;">
                    <i class="fa ${icon}"></i> ${title}
                </h4>
                <div style="max-height: 450px; overflow-y: auto; padding-right: 5px;">
                    ${listItems}
                </div>
            </div>
        `;
    }

    function generateCustomFieldListHTML(customFields, totalPerformers, initialData) {
        const options = customFields.map(field => 
            `<option value="${field}">${field}</option>`
        ).join('');

        return `
            <div style="flex: 1; min-width: 300px; background: var(--card-bg-alt, #3d3d3d); border-radius: 6px; padding: 15px;">
                <h4 style="margin: 0 0 15px 0; color: var(--text-color, #e0e0e0); display: flex; align-items: center; gap: 8px;">
                    <i class="fa fa-cog"></i> Custom Field
                </h4>
                
                <div style="margin-bottom: 15px;">
                    <select id="custom-field-selector" style="width: 100%; padding: 8px; background: var(--card-bg, #2d2d2d); color: var(--text-color, #e0e0e0); border: 1px solid var(--border-color, #4d4d4d); border-radius: 4px; font-size: 0.9em;">
                        <option value="">-- Select a custom field --</option>
                        ${options}
                    </select>
                </div>
                
                <div id="custom-field-content" style="max-height: 400px; overflow-y: auto; padding-right: 5px;">
                    <p style="color: #888; text-align: center; margin: 20px 0;">Select a field to view statistics</p>
                </div>
            </div>
        `;
    }

    function updateCustomFieldList(container, performers, fieldName) {
        const contentDiv = document.getElementById('custom-field-content');
        if (!contentDiv) return;
        
        const result = processCustomField(performers, fieldName);
        const fieldData = result.groups;
        const isNumeric = result.isNumeric;
        
        if (fieldData.length === 0) {
            contentDiv.innerHTML = `<p style="color: #888; text-align: center; margin: 20px 0;">No data available for this field</p>`;
            return;
        }
        
        const numericIndicator = isNumeric ? 
            `<div style="margin-bottom: 10px; padding: 4px 8px; background: var(--card-bg, #2d2d2d); border-radius: 4px; color: #4a9eff; font-size: 0.8em; text-align: center;">
                <i class="fa fa-sort-numeric-asc"></i> Sorted numerically (lowest to highest)
            </div>` : '';
        
        let listItems = '';
        fieldData.forEach((group, index) => {
            const percentage = ((group.count / performers.length) * 100).toFixed(1);
            const groupId = `custom-group-${index}`;
            const barColor = getPercentageColor(percentage);
            
            listItems += `
                <div style="margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                        <div style="display: flex; align-items: center; gap: 8px; width: 100%; cursor: pointer;" 
                             onclick="toggleGroup('${groupId}')">
                            <div style="min-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                <strong>${index+1}. ${group.value}</strong>
                            </div>
                            <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 100px; height: 20px; background: var(--card-bg, #2d2d2d); border-radius: 10px; overflow: hidden;">
                                    <div style="width: ${percentage}%; height: 100%; background: ${barColor}; transition: width 0.3s;"></div>
                                </div>
                                <span style="color: #888; font-size: 0.85em; min-width: 70px;">
                                    ${group.count} (${percentage}%)
                                </span>
                            </div>
                            <i class="fa fa-chevron-down" id="icon-${groupId}" style="transition: transform 0.2s; font-size: 12px;"></i>
                        </div>
                    </div>
                    <div id="${groupId}" style="display: none; padding: 10px; background: var(--card-bg, #2d2d2d); margin-top: 5px; border-radius: 4px; max-height: 200px; overflow-y: auto;">
                        <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                            ${group.performers.map(p => {
                                const bgColor = p.favorite ? '#ff69b4' : 'var(--card-bg-alt, #3d3d3d)';
                                const hoverColor = p.favorite ? '#ff1493' : '#4a9eff';
                                
                                return `
                                    <span class="performer-name-tooltip" 
                                          style="background: ${bgColor}; padding: 3px 8px; border-radius: 12px; font-size: 0.85em; cursor: pointer; border: 1px solid var(--border-color, #4d4d4d); display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;"
                                          onclick="openPerformerPage('${p.id}', event)"
                                          onmouseover="this.style.background='${hoverColor}'; this.style.transform='scale(1.05)'; showPerformerTooltip(this, '${p.id}')"
                                          onmouseout="this.style.background='${bgColor}'; this.style.transform='scale(1)'; hidePerformerTooltip()">
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
        });
        
        contentDiv.innerHTML = numericIndicator + listItems;
    }

    function getPercentageColor(percentage) {
        const p = parseFloat(percentage);
        if (p >= 70) return '#4CAF50';
        if (p >= 40) return '#FFC107';
        return '#F44336';
    }

    function showError(container, message) {
        container.innerHTML = `
            <div style="background: var(--card-bg, #2d2d2d); border-radius: 8px; padding: 20px;">
                <div style="color: #ff6b6b; text-align: center;">
                    <i class="fa fa-exclamation-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>${message}</p>
                    <p style="color: #888; font-size: 0.9em; margin-top: 10px;">The plugin will retry automatically...</p>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            if (document.getElementById('performer-stats-plugin') && isStatsPage()) {
                loadPerformerData(container);
            }
        }, 3000);
    }

    // ==================== GLOBAL FUNCTIONS ====================

    window.toggleGroup = function(id) {
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

    window.setPerformerGenderFilter = function(filter) {
        currentGenderFilter = filter;
        const container = document.getElementById('performer-stats-plugin');
        if (container) {
            // Reload the display with new filter
            loadPerformerData(container);
        }
    };

    window.showPerformerTooltip = function(element, performerId) {
        if (!isStatsPage()) return;
        
        const tooltip = document.getElementById('performer-stats-tooltip');
        const img = document.getElementById('performer-stats-tooltip-image');
        const fallback = document.getElementById('performer-stats-tooltip-fallback');
        const nameDisplay = document.getElementById('performer-stats-tooltip-name');
        const countryDisplay = document.getElementById('performer-stats-tooltip-country');
        
        if (!tooltip || !img || !fallback || !nameDisplay || !countryDisplay) return;
        
        const performer = window.performerStatsData?.find(p => p.id === performerId);
        const rect = element.getBoundingClientRect();
        
        tooltip.style.left = (rect.left + (rect.width / 2) - 90) + 'px';
        tooltip.style.top = (rect.top - 200) + 'px';
        
        nameDisplay.innerHTML = performer?.name || 'Unknown';
        
        if (performer?.country) {
            const flagEmoji = performer.countryFlag || '';
            countryDisplay.innerHTML = `${flagEmoji} ${performer.country}`;
        } else {
            countryDisplay.innerHTML = '';
        }
        
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

    window.hidePerformerTooltip = function() {
        const tooltip = document.getElementById('performer-stats-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
            const img = document.getElementById('performer-stats-tooltip-image');
            if (img) img.src = '';
        }
    };

    window.openPerformerPage = function(id, event) {
        if (event) event.stopPropagation();
        window.location.href = `/performers/${id}`;
    };
})();
