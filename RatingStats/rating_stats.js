// scene_rating_stats.js - Rating statistics with double-height bars and flags in month titles

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
            padding: 10px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.8);
            width: 350px;
            max-width: 90vw;
            transition: opacity 0.1s;
        `;
        document.body.appendChild(tooltipContainer);

        const imageContainer = document.createElement('div');
        imageContainer.id = 'scene-rating-stats-tooltip-image-container';
        imageContainer.style.cssText = `
            width: 100%;
            margin-bottom: 8px;
            display: flex;
            justify-content: center;
            background: var(--card-bg-alt, #2d2d2d);
            border-radius: 4px;
            overflow: hidden;
        `;
        tooltipContainer.appendChild(imageContainer);

        const tooltipImage = document.createElement('img');
        tooltipImage.id = 'scene-rating-stats-tooltip-image';
        tooltipImage.style.cssText = `
            max-width: 100%;
            max-height: 300px;
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
            height: 150px;
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

        const tooltipTitle = document.createElement('div');
        tooltipTitle.id = 'scene-rating-stats-tooltip-title';
        tooltipTitle.style.cssText = `
            text-align: center;
            color: #ffd700;
            font-weight: bold;
            font-size: 1em;
            margin-bottom: 5px;
            word-wrap: break-word;
        `;
        tooltipContainer.appendChild(tooltipTitle);

        const tooltipDate = document.createElement('div');
        tooltipDate.id = 'scene-rating-stats-tooltip-date';
        tooltipDate.style.cssText = `
            text-align: center;
            color: #4a9eff;
            font-size: 0.9em;
            margin-bottom: 5px;
        `;
        tooltipContainer.appendChild(tooltipDate);

        const tooltipRating = document.createElement('div');
        tooltipRating.id = 'scene-rating-stats-tooltip-rating';
        tooltipRating.style.cssText = `
            text-align: center;
            color: #ffd700;
            font-size: 0.9em;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px solid var(--border-color, #3d3d3d);
        `;
        tooltipContainer.appendChild(tooltipRating);

        const tooltipDescription = document.createElement('div');
        tooltipDescription.id = 'scene-rating-stats-tooltip-description';
        tooltipDescription.style.cssText = `
            text-align: left;
            color: #ccc;
            font-size: 0.85em;
            margin-bottom: 8px;
            padding: 6px;
            background: var(--card-bg-alt, #2d2d2d);
            border-radius: 4px;
            max-height: 100px;
            overflow-y: auto;
            border-left: 3px solid #ffd700;
            font-style: italic;
        `;
        tooltipContainer.appendChild(tooltipDescription);

        const tooltipTags = document.createElement('div');
        tooltipTags.id = 'scene-rating-stats-tooltip-tags';
        tooltipTags.style.cssText = `
            text-align: left;
            color: #888;
            font-size: 0.8em;
            margin-bottom: 8px;
            max-height: 80px;
            overflow-y: auto;
            padding: 4px;
            background: var(--card-bg-alt, #2d2d2d);
            border-radius: 4px;
        `;
        tooltipContainer.appendChild(tooltipTags);

        const tooltipPerformers = document.createElement('div');
        tooltipPerformers.id = 'scene-rating-stats-tooltip-performers';
        tooltipPerformers.style.cssText = `
            text-align: left;
            color: #888;
            font-size: 0.8em;
            max-height: 120px;
            overflow-y: auto;
            padding: 4px;
            border-top: 1px solid var(--border-color, #3d3d3d);
        `;
        tooltipContainer.appendChild(tooltipPerformers);
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

    // Helper function to get country flag emoji
    function getCountryFlag(countryCode) {
        if (!countryCode) return null;
        
        // Handle common country names and convert to codes
        const countryMap = {
            'USA': 'US',
            'United States': 'US',
            'America': 'US',
            'UK': 'GB',
            'United Kingdom': 'GB',
            'England': 'GB',
            'Canada': 'CA',
            'France': 'FR',
            'Germany': 'DE',
            'Italy': 'IT',
            'Spain': 'ES',
            'Japan': 'JP',
            'China': 'CN',
            'Russia': 'RU',
            'Australia': 'AU',
            'Brazil': 'BR',
            'India': 'IN',
            'Mexico': 'MX',
            'Netherlands': 'NL',
            'Sweden': 'SE',
            'Denmark': 'DK',
            'Norway': 'NO',
            'Finland': 'FI',
            'Poland': 'PL',
            'Czech Republic': 'CZ',
            'Hungary': 'HU',
            'Greece': 'GR',
            'Turkey': 'TR',
            'Israel': 'IL',
            'South Africa': 'ZA',
            'Argentina': 'AR',
            'Colombia': 'CO',
            'Venezuela': 'VE',
            'Portugal': 'PT',
            'Belgium': 'BE',
            'Switzerland': 'CH',
            'Austria': 'AT',
            'Ireland': 'IE',
            'Scotland': 'GB-SCT',
            'Wales': 'GB-WLS',
            'New Zealand': 'NZ'
        };

        // Try to get country code
        let code = countryCode.toUpperCase().trim();
        
        // Check if it's already a 2-letter code
        if (code.length === 2) {
            return code.toUpperCase();
        }
        
        // Look up in map
        if (countryMap[code]) {
            return countryMap[code];
        }
        
        // Check if it's a common variation
        const variations = {
            'UNITED STATES': 'US',
            'UNITED KINGDOM': 'GB',
            'CZECHIA': 'CZ',
            'SOUTH KOREA': 'KR',
            'NORTH KOREA': 'KP',
            'UAE': 'AE',
            'SAUDI ARABIA': 'SA',
            'SOUTH AFRICA': 'ZA',
            'NEW ZEALAND': 'NZ'
        };
        
        return variations[code] || null;
    }

    // Helper function to convert country code to flag emoji
    function getFlagEmoji(countryCode) {
        if (!countryCode) return '';
        
        // Convert country code to uppercase
        const code = countryCode.toUpperCase();
        
        // Convert to flag emoji (regional indicator symbols)
        const offset = 127397;
        const chars = [...code].map(c => String.fromCodePoint(c.charCodeAt(0) + offset));
        return chars.join('');
    }

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
            // First get all performers with their country and birthdate
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
                        }
                    }`
                })
            });

            const performersResult = await performersResponse.json();
            const performers = performersResult.data?.allPerformers || [];

            // Create maps for performer data
            const performerBirthdates = new Map();
            const performerCountries = new Map();
            const performerNames = new Map();
            
            performers.forEach(p => {
                if (p.birthdate) {
                    performerBirthdates.set(p.id, p.birthdate);
                }
                if (p.country) {
                    performerCountries.set(p.id, p.country);
                }
                performerNames.set(p.id, p.name);
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
                        
                        return {
                            id: p.id,
                            name: p.name || 'Unknown',
                            image_path: p.image_path,
                            age: age,
                            country: country,
                            countryCode: countryCode,
                            sceneId: s.id,
                            sceneTitle: s.title,
                            sceneDate: sceneDateStr
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
        
        // Process monthly timeline with zero months
        const monthlyData = processMonthlyDataWithZeros(scenes);
        
        // Process age distribution with one-year intervals
        const ageData = processAgeDataWithZeros(scenes);
        
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

                    <!-- Horizontal Timeline with Stacked Scenes (Double Height) -->
                    <div style="margin-bottom: 25px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="margin: 0; color: var(--text-color, #e0e0e0); font-size: 0.95rem;">
                                <i class="fa fa-calendar"></i> Scenes Timeline
                            </h4>
                            <div style="display: flex; gap: 5px;">
                                <button class="btn btn-mini btn-primary" onclick="toggleAllMonths(true)" style="padding: 2px 8px; font-size: 0.8em;">Expand All</button>
                                <button class="btn btn-mini btn-secondary" onclick="toggleAllMonths(false)" style="padding: 2px 8px; font-size: 0.8em;">Collapse All</button>
                            </div>
                        </div>
                        
                        <!-- Timeline Stats -->
                        <div style="display: flex; gap: 6px; margin-bottom: 15px; flex-wrap: wrap;">
                            ${generateTimelineStats(monthlyData, scenesWithDates)}
                        </div>

                        <!-- Horizontal Timeline with Stacked Scene Names (Double Height) -->
                        <div style="margin-bottom: 8px; overflow-x: auto; max-height: 500px; overflow-y: auto;">
                            ${generateTimelineWithScenes(monthlyData)}
                        </div>
                    </div>

                    <!-- Age Distribution Graph - One Year Intervals (Double Height) -->
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="margin: 0; color: var(--text-color, #e0e0e0); font-size: 0.95rem;">
                                <i class="fa fa-users" style="color: #4a9eff;"></i> Performer Age Distribution (One-Year Intervals)
                            </h4>
                            <div style="display: flex; gap: 5px;">
                                <button class="btn btn-mini btn-primary" onclick="toggleAllAges(true)" style="padding: 2px 8px; font-size: 0.8em;">Expand All</button>
                                <button class="btn btn-mini btn-secondary" onclick="toggleAllAges(false)" style="padding: 2px 8px; font-size: 0.8em;">Collapse All</button>
                            </div>
                        </div>
                        
                        <!-- Age Stats -->
                        <div style="display: flex; gap: 6px; margin-bottom: 15px; flex-wrap: wrap;">
                            ${generateAgeStats(ageData, totalAgeEntries)}
                        </div>

                        <!-- Age Distribution Bars with Stacked Scenes (Double Height) -->
                        <div style="margin-bottom: 8px; overflow-x: auto; max-height: 600px; overflow-y: auto;">
                            ${generateAgeBarsWithScenes(ageData, totalAgeEntries)}
                        </div>
                    </div>

                    <!-- Data Quality Note -->
                    <div style="margin-top: 15px; padding: 6px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; text-align: center; color: #888; font-size: 0.75em;">
                        <i class="fa fa-info-circle"></i> 
                        ${totalScenes} total • ${totalRated} rated (${((totalRated/totalScenes)*100).toFixed(1)}%) • ${scenesWithDates} dated • ${totalAgeEntries} age entries
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
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

    function processMonthlyDataWithZeros(scenes) {
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

        if (minYear === 9999) return [];

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (maxYear > currentYear) {
            maxYear = currentYear;
            maxMonth = currentMonth;
        } else if (maxYear === currentYear && maxMonth > currentMonth) {
            maxMonth = currentMonth;
        }

        const sceneMap = new Map();
        scenes.forEach(s => {
            if (s.date) {
                const monthKey = `${s.date.year}-${String(s.date.month).padStart(2, '0')}`;
                if (s.date.year < currentYear || (s.date.year === currentYear && s.date.month <= currentMonth)) {
                    if (!sceneMap.has(monthKey)) {
                        sceneMap.set(monthKey, []);
                    }
                    sceneMap.get(monthKey).push(s);
                }
            }
        });

        const monthlyData = [];
        for (let year = minYear; year <= maxYear; year++) {
            const startMonth = (year === minYear) ? minMonth : 1;
            const endMonth = (year === maxYear) ? maxMonth : 12;
            
            for (let month = startMonth; month <= endMonth; month++) {
                const monthKey = `${year}-${String(month).padStart(2, '0')}`;
                const monthDisplay = `${year}-${String(month).padStart(2, '0')}`;
                
                const scenesInMonth = sceneMap.get(monthKey) || [];
                
                monthlyData.push({
                    key: monthKey,
                    display: monthDisplay,
                    year: year,
                    month: month,
                    count: scenesInMonth.length,
                    scenes: scenesInMonth.sort((a, b) => {
                        if (a.date && b.date) {
                            if (a.date.day && b.date.day) {
                                return a.date.day - b.date.day;
                            }
                        }
                        return a.title.localeCompare(b.title);
                    })
                });
            }
        }

        return monthlyData;
    }

    function processAgeDataWithZeros(scenes) {
        // Collect all ages from all performers in all scenes, with scene info
        const ageMap = new Map();
        
        scenes.forEach(scene => {
            if (scene.performers && scene.performers.length > 0) {
                scene.performers.forEach(performer => {
                    if (performer.age !== null && performer.age > 0) {
                        const age = performer.age;
                        if (!ageMap.has(age)) {
                            ageMap.set(age, []);
                        }
                        ageMap.get(age).push({
                            id: scene.id,
                            title: scene.title,
                            details: scene.details,
                            image_path: scene.image_path,
                            dateStr: scene.dateStr,
                            performerName: performer.name,
                            performerAge: age,
                            performerCountry: performer.country,
                            performerCountryCode: performer.countryCode
                        });
                    }
                });
            }
        });

        if (ageMap.size === 0) return [];

        // Find age range
        const ages = Array.from(ageMap.keys());
        const minAge = Math.min(...ages);
        const maxAge = Math.max(...ages);
        
        // Create one-year intervals for all ages in range
        const ageData = [];
        for (let age = minAge; age <= maxAge; age++) {
            const scenesAtAge = ageMap.get(age) || [];
            ageData.push({
                label: age.toString(),
                age: age,
                count: scenesAtAge.length,
                scenes: scenesAtAge.sort((a, b) => a.title.localeCompare(b.title))
            });
        }

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
                <div style="color: #888; font-size: 0.7em;">Total Months</div>
                <div style="font-size: 1.1em; font-weight: bold; color: #4a9eff;">${totalMonths}</div>
                <div style="color: #888; font-size: 0.7em;">with data</div>
            </div>
            <div style="flex: 1; min-width: 70px; background: var(--card-bg-alt, #3d3d3d); border-radius: 4px; padding: 8px;">
                <div style="color: #888; font-size: 0.7em;">Average</div>
                <div style="font-size: 1.1em; font-weight: bold; color: #4CAF50;">${avgPerMonth}</div>
                <div style="color: #4a9eff; font-size: 0.7em;">per month</div>
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
                                    ${group.scenes.map(s => `
                                        <span class="scene-name-tooltip" 
                                              style="background: var(--card-bg-alt, #3d3d3d); padding: 2px 5px; border-radius: 8px; font-size: 0.7em; cursor: pointer; border: 1px solid var(--border-color, #4d4d4d); display: inline-block;"
                                              onclick="openScenePage('${s.id}', event)"
                                              onmouseover="showSceneTooltip('${s.id}', event)"
                                              onmouseout="hideSceneRatingTooltip()">
                                            ${s.title.length > 15 ? s.title.substring(0, 13) + '...' : s.title}
                                        </span>
                                    `).join('')}
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
                    const height = month.count > 0 ? Math.max(36, (month.count / maxCount) * 90) : 6; // Double height
                    const barColor = month.count > 0 ? getMonthColor(month.count, maxCount) : '#444';
                    const monthId = `month-group-${index}`;
                    
                    return `
                        <div style="display: flex; flex-direction: column; width: 80px; background: var(--card-bg-alt, #3d3d3d); border-radius: 3px; padding: 3px; opacity: ${month.count > 0 ? 1 : 0.6};">
                            <div style="font-size: 0.65em; color: #ffd700; font-weight: bold; margin-bottom: 2px; text-align: center;">
                                ${month.display}
                            </div>
                            
                            <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 6px;"> <!-- Increased margin -->
                                <div style="height: 100px; display: flex; flex-direction: column-reverse; align-items: center; width: 100%;"> <!-- Double height container -->
                                    <div style="width: 30px; height: ${height}px; background: ${barColor}; border-radius: 2px 2px 0 0; cursor: pointer;"
                                         onclick="toggleMonthGroup('${monthId}')">
                                    </div>
                                </div>
                                <div style="font-size: 0.65em; color: ${barColor}; margin-top: 4px; font-weight: bold;"> <!-- Increased margin -->
                                    ${month.count}
                                </div>
                            </div>
                            
                            ${month.count > 0 ? `
                                <div id="${monthId}" style="display: none; margin-top: 4px; padding: 3px; background: var(--card-bg, #2d2d2d); border-radius: 3px; max-height: 150px; overflow-y: auto;">
                                    <div style="display: flex; flex-direction: column; gap: 2px;">
                                        ${month.scenes.map(s => {
                                            const shortTitle = s.title.length > 12 ? s.title.substring(0, 10) + '..' : s.title;
                                            
                                            // Collect unique flags from performers in this scene
                                            const uniqueFlags = new Set();
                                            s.performers.forEach(p => {
                                                if (p.countryCode) {
                                                    uniqueFlags.add(p.countryCode);
                                                }
                                            });
                                            const flags = Array.from(uniqueFlags).map(code => getFlagEmoji(code)).join(' ');
                                            
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
                                    Ø
                                </div>
                            `}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function generateAgeBarsWithScenes(ageData, totalAgeEntries) {
        if (ageData.length === 0) {
            return `<p style="color: #888; text-align: center; padding: 8px; font-size: 0.8em;">No age data</p>`;
        }

        const maxCount = Math.max(...ageData.map(d => d.count));

        return `
            <div style="display: flex; gap: 2px; min-width: ${ageData.length * 60}px; padding: 5px 0;">
                ${ageData.map((age, index) => {
                    const height = age.count > 0 ? Math.max(36, (age.count / maxCount) * 90) : 6; // Already double height
                    const barColor = getAgeColor(age.age);
                    const ageId = `age-group-${index}`;
                    const percentage = (age.count / totalAgeEntries) * 100;
                    
                    return `
                        <div style="display: flex; flex-direction: column; width: 55px; background: var(--card-bg-alt, #3d3d3d); border-radius: 3px; padding: 3px; opacity: ${age.count > 0 ? 1 : 0.6};">
                            <div style="font-size: 0.6em; color: #ffd700; font-weight: bold; margin-bottom: 2px; text-align: center;">
                                ${age.label}
                            </div>
                            
                            <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 6px;">
                                <div style="height: 100px; display: flex; flex-direction: column-reverse; align-items: center; width: 100%;">
                                    <div style="width: 25px; height: ${height}px; background: ${barColor}; border-radius: 2px 2px 0 0; cursor: pointer;"
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
                                            return `
                                                <span class="scene-name-tooltip" 
                                                      style="background: var(--card-bg-alt, #3d3d3d); padding: 1px 2px; border-radius: 2px; font-size: 0.55em; cursor: pointer; border-left: 2px solid ${barColor}; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                                                      onclick="openScenePage('${s.id}', event)"
                                                      onmouseover="showSceneTooltip('${s.id}', event)"
                                                      onmouseout="hideSceneRatingTooltip()">
                                                    ${flag} ${shortTitle}
                                                </span>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            ` : `
                                <div style="height: 18px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 0.5em; border-top: 1px solid var(--border-color, #4d4d4d);">
                                    Ø
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
        
        tooltip.style.left = (rect.left + (rect.width / 2) - 175) + 'px';
        tooltip.style.top = (rect.top - 450) + 'px';
        
        titleDisplay.innerHTML = scene.title || 'Untitled';
        
        dateDisplay.innerHTML = ` ${scene.dateStr || 'No date'}`;
        
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
        
        // Show performers with flag emoji
        if (scene.performers && scene.performers.length > 0) {
            performersDisplay.innerHTML = '<div style="color: #ffd700; margin-bottom: 3px;">Performers:</div>' + 
                scene.performers.map(p => {
                    const ageText = p.age ? ` (${p.age})` : '';
                    const flagEmoji = p.countryCode ? getFlagEmoji(p.countryCode) : '';
                    const countryText = p.country ? ` ${flagEmoji}` : '';
                    return `<div style="margin: 2px 0;"> ${p.name}${ageText}${countryText}</div>`;
                }).join('');
        } else {
            performersDisplay.innerHTML = '<div style="color: #888;">No performers</div>';
        }
        
        // Show full image (uncropped)
        if (scene.image_path) {
            img.src = scene.image_path;
            img.style.display = 'block';
            fallback.style.display = 'none';
            
            img.style.maxWidth = '100%';
            img.style.maxHeight = '300px';
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
