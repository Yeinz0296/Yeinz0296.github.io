// State Management
const state = {
    data: {
        feathers: {
            atk: [],
            def: [],
            mix: []
        },
        setBonuses: []
    },
    sets: {
        atk: ['Duel', 'Rune', 'Weapon', 'Intimidation', 'Omni'],
        def: ['Wisdom', 'Fortitude', 'Mist', 'Relic', 'Conqueror']
    },
    unlockedSets: {
        atk: ['Duel'],
        def: ['Wisdom']
    },
    build: {}, // set_name -> [5 slots of {feather: 'Name', tier: 7}]
    currentPreset: 'none',
    presets: {
        paladin: {
            priorityStats: ['vit', 'ignore_pdef', 'pve_dmg_bonus', 'pve_dmg_reduction', 'max_hp', 'pdef', 'mdef'],
            hiddenStats: ['str', 'patk', 'patk_matk', 'int', 'dex'], // Hiding PATK/MATK too since it's sacrifice
            optimal: {
                atk: ['Time', 'Day', 'Sky', 'Grace', 'Justice'],
                def: ['Nature', 'Night', 'Terra', 'Virtue', 'Soul']
            }
        },
        bard: {
            priorityStats: ['vit', 'max_hp', 'pve_dmg_reduction', 'pdef', 'mdef', 'dex', 'int'],
            hiddenStats: ['str', 'patk', 'ignore_pdef', 'pve_dmg_bonus'],
            optimal: {
                atk: ['Time', 'Space', 'Sky', 'Justice', 'Truth'], // Example
                def: ['Divine', 'Nature', 'Night', 'Mercy', 'Virtue'] // Example
            }
        }
    }
};

const STAT_NAMES = {
    'patk_matk': 'PATK/MATK',
    'pdef': 'PDEF',
    'mdef': 'MDEF',
    'max_hp': 'Max HP',
    'pve_dmg_bonus': 'PvE DMG Bonus',
    'pve_dmg_reduction': 'PvE DMG Reduction',
    'pvp_dmg_bonus': 'PvP DMG Bonus',
    'pvp_dmg_reduction': 'PvP DMG Reduction',
    'ignore_pdef': 'Ignore PDEF',
    'ignore_mdef': 'Ignore MDEF',
    'vit': 'VIT',
    'str': 'STR',
    'int': 'INT',
    'dex': 'DEX'
};

// Initialize empty build state
function initBuildState() {
    [...state.sets.atk, ...state.sets.def].forEach(setName => {
        state.build[setName] = [
            { feather: '', tier: 7 },
            { feather: '', tier: 7 },
            { feather: '', tier: 7 },
            { feather: '', tier: 7 },
            { feather: '', tier: 7 }
        ];
    });
}

// Data Fetching and Parsing
async function loadData() {
    try {
        const fetchCsv = async (url) => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            return new Promise((resolve) => {
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => resolve(results.data)
                });
            });
        };

        const [atkData, defData, mixData, setBonusData] = await Promise.all([
            fetchCsv('data/feather/atk.csv'),
            fetchCsv('data/feather/def.csv'),
            fetchCsv('data/feather/mix.csv'),
            fetchCsv('data/feather/set_bonus.csv')
        ]);

        state.data.feathers.atk = atkData;
        state.data.feathers.def = defData;
        state.data.feathers.mix = mixData;
        state.data.setBonuses = setBonusData;

        // Group feathers by unique name for easy dropdown population
        state.uniqueFeathers = {
            atk: [...new Set(atkData.map(f => f.feather))],
            def: [...new Set(defData.map(f => f.feather))],
            mix: [...new Set(mixData.map(f => f.feather))]
        };
        
        // Cache feather rarities
        state.featherRarities = {};
        [...atkData, ...defData, ...mixData].forEach(f => {
            if (f.feather && f.rarity) state.featherRarities[f.feather] = f.rarity.toLowerCase();
        });

        initBuildState();
        renderApp();
        
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('tab-feather').classList.remove('hidden');

    } catch (error) {
        console.error("Failed to load data:", error);
        document.getElementById('loading').innerHTML = `<span class="text-red-500">Error loading data. Make sure you are running via a web server.</span>`;
    }
}

// UI Rendering
function renderApp() {
    renderSetToggles();
    renderStatues();
    updateSummary();
    setupEventListeners();
}

function renderSetToggles() {
    const createToggle = (setName, type) => {
        const isUnlocked = state.unlockedSets[type].includes(setName);
        const color = isUnlocked ? (type === 'atk' ? 'bg-red-500 text-white border-red-500' : 'bg-blue-500 text-white border-blue-500') : 'bg-white text-gray-500 border-gray-300';
        return `<button class="px-3 py-1 border rounded text-xs font-medium toggle-set-btn ${color}" data-set="${setName}" data-type="${type}">${setName}</button>`;
    };

    document.getElementById('atk-set-toggles').innerHTML = state.sets.atk.map(s => createToggle(s, 'atk')).join('');
    document.getElementById('def-set-toggles').innerHTML = state.sets.def.map(s => createToggle(s, 'def')).join('');
}

function renderStatues() {
    const container = document.getElementById('statues-container');
    container.innerHTML = '';

    const renderSet = (setName, type) => {
        if (!state.unlockedSets[type].includes(setName)) return '';

        const availableFeathers = [...state.uniqueFeathers[type], ...state.uniqueFeathers.mix];
        const borderColor = type === 'atk' ? 'border-red-200' : 'border-blue-200';
        const headerColor = type === 'atk' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800';

        let html = `
        <div class="bg-white shadow rounded-lg border ${borderColor} overflow-hidden mb-6">
            <div class="px-4 py-3 ${headerColor} border-b flex justify-between items-center">
                <h3 class="text-lg font-bold">${setName} Statue</h3>
                <span class="text-xs font-semibold px-2 py-1 bg-white rounded-full shadow-sm" id="set-bonus-${setName}">No Bonus</span>
            </div>
            <div class="p-4 grid grid-cols-1 sm:grid-cols-5 gap-4">`;

        for (let i = 0; i < 5; i++) {
            const slot = state.build[setName][i];
            const isWarnTier = slot.tier > 7;
            const isWarnMix = (slot.feather === 'Order' || slot.feather === 'Truth') && slot.tier > 2;
            
            html += `
                <div class="slot-card bg-gray-50 p-3 rounded border">
                    <label class="block text-xs font-medium text-gray-700 mb-1">Slot ${i + 1}</label>
                    <select class="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 mb-2 feather-select" data-set="${setName}" data-slot="${i}">
                        <option value="">-- Select --</option>
                        ${availableFeathers.map(f => {
                            const isMix = state.uniqueFeathers.mix.includes(f);
                            const mixTag = isMix ? ' (Mix)' : '';
                            const selected = slot.feather === f ? 'selected' : '';
                            const rarity = state.featherRarities[f] === 'gold' ? '🟡 ' : '🟣 ';
                            return `<option value="${f}" ${selected}>${rarity}${f}${mixTag}</option>`;
                        }).join('')}
                    </select>
                    
                    <label class="block text-xs font-medium text-gray-700 mb-1">Tier</label>
                    <div class="flex items-center">
                        <select class="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 tier-select ${isWarnTier || isWarnMix ? 'border-red-400 bg-red-50' : ''}" data-set="${setName}" data-slot="${i}">
                            ${[...Array(20).keys()].map(t => {
                                const tNum = t + 1;
                                return `<option value="${tNum}" ${slot.tier == tNum ? 'selected' : ''}>T${tNum}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    ${isWarnTier ? '<p class="text-[10px] text-red-500 mt-1"><i class="fas fa-exclamation-triangle"></i> Expensive</p>' : ''}
                    ${isWarnMix ? '<p class="text-[10px] text-red-500 mt-1"><i class="fas fa-exclamation-triangle"></i> Unconfirmed > T2</p>' : ''}
                </div>`;
        }
        
        html += `</div></div>`;
        return html;
    };

    let fullHtml = '';
    state.sets.atk.forEach(s => fullHtml += renderSet(s, 'atk'));
    state.sets.def.forEach(s => fullHtml += renderSet(s, 'def'));
    container.innerHTML = fullHtml;
}

function updateSummary() {
    let totalStats = {};
    let totalEden = 0;
    
    const parseNumber = (str) => {
        if (!str) return 0;
        return parseFloat(str.toString().replace(/,/g, ''));
    };

    const addStats = (featherName, tier, type) => {
        if (!featherName) return;
        const dataArr = state.data.feathers[type];
        const row = dataArr.find(f => f.feather === featherName && parseInt(f.tier) === parseInt(tier));
        
        if (row) {
            Object.keys(STAT_NAMES).forEach(statKey => {
                if (row[statKey]) {
                    totalStats[statKey] = (totalStats[statKey] || 0) + parseNumber(row[statKey]);
                }
            });
            
            // Calculate Eden cost (sum from T1 to current tier)
            for(let t = 1; t < tier; t++) {
                const costRow = dataArr.find(f => f.feather === featherName && parseInt(f.tier) === t);
                if (costRow && costRow.eden_to_next) {
                    totalEden += parseNumber(costRow.eden_to_next);
                }
            }
        }
    };

    // Calculate active set bonuses
    const activeSetBonuses = [];

    [...state.sets.atk, ...state.sets.def].forEach(setName => {
        if (!state.unlockedSets.atk.includes(setName) && !state.unlockedSets.def.includes(setName)) return;

        const slots = state.build[setName];
        const activeFeathers = slots.filter(s => s.feather !== '');
        
        const isAtk = state.sets.atk.includes(setName);
        const typeCat = isAtk ? 'atk' : 'def';

        // Add individual feather stats
        activeFeathers.forEach(s => {
            let cat = typeCat;
            if (state.uniqueFeathers.mix.includes(s.feather)) cat = 'mix';
            addStats(s.feather, s.tier, cat);
        });

        // Determine set bonus
        if (activeFeathers.length === 5) {
            // Check uniqueness
            const uniqueNames = new Set(activeFeathers.map(f => f.feather));
            if (uniqueNames.size === 5) {
                const goldCount = activeFeathers.filter(f => state.featherRarities[f.feather] === 'gold').length;
                const purpleCount = activeFeathers.filter(f => state.featherRarities[f.feather] === 'purple').length;
                const minTier = Math.min(...activeFeathers.map(f => parseInt(f.tier)));

                // Find matching set bonus rule
                const bonusRules = state.data.setBonuses.filter(b => b.statue_type === typeCat);
                let bestRule = null;
                
                // Sort by gold required desc, then purple desc
                bonusRules.sort((a, b) => {
                    const diffGold = parseNumber(b.req_gold) - parseNumber(a.req_gold);
                    if (diffGold !== 0) return diffGold;
                    return parseNumber(b.req_purple) - parseNumber(a.req_purple);
                });

                for (const rule of bonusRules) {
                    if (goldCount >= parseNumber(rule.req_gold) && purpleCount >= parseNumber(rule.req_purple)) {
                        bestRule = rule;
                        break;
                    }
                }

                if (bestRule) {
                    const bNameDisp = bestRule.set_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    document.getElementById(`set-bonus-${setName}`).innerText = `${bNameDisp} (T${minTier})`;
                    document.getElementById(`set-bonus-${setName}`).className = "text-xs font-semibold px-2 py-1 rounded-full shadow-sm bg-purple-100 text-purple-800";
                    
                    // The set_bonus.csv has a specific row for raven_prestige tiers, others only have T20
                    let activeBonusRow = state.data.setBonuses.find(b => b.set_name === bestRule.set_name && parseInt(b.tier) === minTier);
                    
                    // If no specific tier row exists, fallback to interpolation or just use T20 if nothing else (MVP behavior)
                    // In a full app, we would interpolate. Here we use exact match if available (Raven Prestige)
                    if (activeBonusRow) {
                        Object.keys(STAT_NAMES).forEach(statKey => {
                            if (activeBonusRow[statKey]) {
                                totalStats[statKey] = (totalStats[statKey] || 0) + parseNumber(activeBonusRow[statKey]);
                            }
                        });
                    }
                }
            } else {
                document.getElementById(`set-bonus-${setName}`).innerText = "Duplicate Feathers!";
                document.getElementById(`set-bonus-${setName}`).className = "text-xs font-semibold px-2 py-1 bg-red-100 text-red-800 rounded-full shadow-sm";
            }
        } else {
            const el = document.getElementById(`set-bonus-${setName}`);
            if(el) {
                el.innerText = "Incomplete Set";
                el.className = "text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-800 rounded-full shadow-sm";
            }
        }
    });

    // Render Summary
    const summaryContainer = document.getElementById('stats-summary');
    summaryContainer.innerHTML = '';
    
    let preset = state.presets[state.currentPreset] || { priorityStats: [], hiddenStats: [] };

    if (Object.keys(totalStats).length === 0) {
        summaryContainer.innerHTML = '<p class="text-gray-500 italic">No feathers equipped.</p>';
    } else {
        Object.entries(totalStats)
            .sort((a, b) => b[1] - a[1]) // Sort by value desc
            .forEach(([statKey, value]) => {
                if (preset.hiddenStats && preset.hiddenStats.includes(statKey)) return;
                
                const isPriority = preset.priorityStats && preset.priorityStats.includes(statKey);
                const statName = STAT_NAMES[statKey] || statKey;
                const valueDisp = Number.isInteger(value) ? value : value.toFixed(1);
                
                summaryContainer.innerHTML += `
                    <div class="flex justify-between items-center py-1 ${isPriority ? 'bg-yellow-50 px-2 rounded font-semibold text-yellow-800' : 'text-gray-700'}">
                        <span>${statName} ${isPriority ? '<i class="fas fa-star text-[10px]"></i>' : ''}</span>
                        <span>${valueDisp}</span>
                    </div>
                `;
            });
    }

    document.getElementById('total-eden').innerText = totalEden.toLocaleString();
}

function applyPreset(presetName) {
    if (presetName === 'none') {
        state.currentPreset = 'none';
        updateSummary();
        return;
    }

    const presetConfig = state.presets[presetName];
    if (!presetConfig) return;
    
    state.currentPreset = presetName;

    // Auto-equip optimal feathers for unlocked sets
    [...state.sets.atk, ...state.sets.def].forEach(setName => {
        const isAtk = state.sets.atk.includes(setName);
        const type = isAtk ? 'atk' : 'def';
        
        if (state.unlockedSets[type].includes(setName)) {
            const optimalLoadout = presetConfig.optimal[type];
            for (let i = 0; i < 5; i++) {
                state.build[setName][i].feather = optimalLoadout[i] || '';
                state.build[setName][i].tier = 7; // Default target
            }
        }
    });

    renderStatues();
    updateSummary();
}

// Event Listeners
function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if(btn.classList.contains('cursor-not-allowed')) return;

            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'border-b-2', 'border-blue-500', 'text-blue-600'));
            btn.classList.add('active', 'border-b-2', 'border-blue-500', 'text-blue-600');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(btn.dataset.target).classList.remove('hidden');
        });
    });

    // Set Toggles (Event Delegation to handle re-renders)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('toggle-set-btn')) {
            const setName = e.target.dataset.set;
            const type = e.target.dataset.type;
            
            const index = state.unlockedSets[type].indexOf(setName);
            if (index > -1) {
                state.unlockedSets[type].splice(index, 1);
            } else {
                state.unlockedSets[type].push(setName);
            }
            
            renderSetToggles();
            renderStatues();
            updateSummary();
        }
    });

    // Feather Selects & Tier Selects
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('feather-select')) {
            const setName = e.target.dataset.set;
            const slot = parseInt(e.target.dataset.slot);
            state.build[setName][slot].feather = e.target.value;
            renderStatues();
            updateSummary();
        }
        
        if (e.target.classList.contains('tier-select')) {
            const setName = e.target.dataset.set;
            const slot = parseInt(e.target.dataset.slot);
            state.build[setName][slot].tier = parseInt(e.target.value);
            renderStatues();
            updateSummary();
        }
    });

    // Preset Select
    document.getElementById('class-preset').addEventListener('change', (e) => {
        applyPreset(e.target.value);
    });
}

// Boot
window.onload = loadData;
