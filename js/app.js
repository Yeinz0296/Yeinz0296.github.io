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
        def: ['Wisdom', 'Fortitude', 'Mist', 'Relic', 'Conqueror'],
        order: [
            { name: 'Duel', type: 'atk' },
            { name: 'Wisdom', type: 'def' },
            { name: 'Rune', type: 'atk' },
            { name: 'Fortitude', type: 'def' },
            { name: 'Weapon', type: 'atk' },
            { name: 'Mist', type: 'def' },
            { name: 'Intimidation', type: 'atk' },
            { name: 'Relic', type: 'def' },
            { name: 'Omni', type: 'atk' },
            { name: 'Conqueror', type: 'def' }
        ]
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
            hiddenStats: ['str', 'patk', 'patk_matk', 'int', 'dex'],
            optimal: {
                atk: ['Time', 'Day', 'Sky', 'Grace', 'Justice'],
                def: ['Nature', 'Night', 'Terra', 'Virtue', 'Soul']
            }
        },
        bard: {
            priorityStats: ['vit', 'max_hp', 'pve_dmg_reduction', 'pdef', 'mdef', 'dex', 'int'],
            hiddenStats: ['str', 'patk', 'ignore_pdef', 'pve_dmg_bonus'],
            optimal: {
                atk: ['Time', 'Space', 'Sky', 'Justice', 'Truth'],
                def: ['Divine', 'Nature', 'Night', 'Mercy', 'Virtue']
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
    'dex': 'DEX',
    'atk_stat_percent': 'ATK Stat %',
    'def_stat_percent': 'DEF Stat %',
    'pve_stat_percent': 'PvE Stat %',
    'pvp_stat_percent': 'PvP Stat %'
};

function parseNumber(str) {
    if (!str || str === '') return 0;
    return parseFloat(str.toString().replace(/,/g, '')) || 0;
}

// Initialize empty build state
function initBuildState() {
    [...state.sets.atk, ...state.sets.def].forEach(setName => {
        state.build[setName] = [
            { feather: '', tier: 1 },
            { feather: '', tier: 1 },
            { feather: '', tier: 1 },
            { feather: '', tier: 1 },
            { feather: '', tier: 1 }
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
                    transformHeader: (header) => header.trim().replace(/,$/, '').trim(),
                    complete: (results) => {
                        const cleanedData = results.data.map(row => {
                            const newRow = {};
                            for (let key in row) {
                                const cleanKey = key.trim().replace(/,$/, '').trim();
                                newRow[cleanKey] = typeof row[key] === 'string' ? row[key].trim() : row[key];
                            }
                            return newRow;
                        });
                        resolve(cleanedData);
                    }
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

        state.uniqueFeathers = {
            atk: [...new Set(atkData.map(f => f.feather))],
            def: [...new Set(defData.map(f => f.feather))],
            mix: [...new Set(mixData.map(f => f.feather))]
        };
        
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
        document.getElementById('loading').innerHTML = `<span class="text-red-500">Error loading data. ${error.message}</span>`;
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

        // Get currently selected feathers in this set to filter them out from other slots
        const selectedInSet = state.build[setName].map(s => s.feather).filter(f => f !== '');

        let html = `
        <div class="ro-window ${type === 'atk' ? 'ro-window-atk' : 'ro-window-def'} overflow-hidden mb-6">
            <div class="ro-header ${type === 'atk' ? 'ro-header-atk' : 'ro-header-def'} flex justify-between items-center">
                <div class="flex items-center space-x-3">
                    <span class="text-sm font-bold tracking-wide tracking-wider uppercase">${setName} Statue</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 bg-white ${type === 'atk' ? 'text-red-600' : 'text-ro-blue'} rounded-sm shadow-sm" id="set-bonus-${setName}">NO BONUS</span>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="text-right">
                        <span id="set-eden-${setName}" class="text-[10px] font-bold text-white opacity-90">0 EDEN</span>
                    </div>
                    <button class="clear-set-btn text-white hover:text-ro-accent transition-colors" data-set="${setName}" title="Clear Set">
                        <i class="fas fa-undo-alt text-xs"></i>
                    </button>
                </div>
            </div>
            <div class="p-4 grid grid-cols-1 sm:grid-cols-5 gap-4">`;

        for (let i = 0; i < 5; i++) {
            const slot = state.build[setName][i];
            const isWarnTier = slot.tier > 7;
            const isWarnMix = (slot.feather === 'Order' || slot.feather === 'Truth') && slot.tier > 2;
            
            html += `
                <div class="ro-slot p-3">
                    <label class="ro-label block mb-1">Slot ${i + 1}</label>
                    <select class="w-full text-xs border-ro-border rounded bg-white py-1 px-1 mb-2 feather-select" data-set="${setName}" data-slot="${i}">
                        <option value="">-- Empty --</option>
                        ${availableFeathers.map(f => {
                            // Hide if already selected in ANOTHER slot
                            const isSelectedElsewhere = selectedInSet.includes(f) && slot.feather !== f;
                            if (isSelectedElsewhere) return '';

                            const isMix = state.uniqueFeathers.mix.includes(f);
                            const mixTag = isMix ? ' (Mix)' : '';
                            const selected = slot.feather === f ? 'selected' : '';
                            const rarity = state.featherRarities[f] === 'gold' ? '🟡 ' : '🟣 ';
                            return `<option value="${f}" ${selected}>${rarity}${f}${mixTag}</option>`;
                        }).join('')}
                    </select>
                    
                    <label class="ro-label block mb-1">Tier</label>
                    <select class="w-full text-xs border-ro-border rounded bg-white py-1 px-1 tier-select ${isWarnTier || isWarnMix ? 'border-red-400 bg-red-50' : ''}" data-set="${setName}" data-slot="${i}">
                        ${[...Array(20).keys()].map(t => {
                            const tNum = t + 1;
                            return `<option value="${tNum}" ${slot.tier == tNum ? 'selected' : ''}>T${tNum}</option>`;
                        }).join('')}
                    </select>
                    ${isWarnTier ? '<p class="text-[9px] text-red-500 mt-1 font-bold">COST SPIKE</p>' : ''}
                    ${isWarnMix ? '<p class="text-[9px] text-red-500 mt-1 font-bold">UNCONFIRMED</p>' : ''}
                </div>`;
        }
        
        html += `
            </div>
            <div class="px-4 py-3 bg-slate-50 border-t">
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600" id="set-stats-${setName}">
                    <!-- Set specific stats -->
                </div>
            </div>
        </div>`;
        return html;
    };

    let fullHtml = '';
    state.sets.order.forEach(set => {
        fullHtml += renderSet(set.name, set.type);
    });
    container.innerHTML = fullHtml;
}

function updateSummary() {
    let totalStats = {};
    let totalEden = 0;
    
    const getFeatherStats = (featherName, tier, type) => {
        if (!featherName) return { stats: {}, eden: 0 };
        const dataArr = state.data.feathers[type];
        const row = dataArr.find(f => f.feather === featherName && parseInt(f.tier) === parseInt(tier));
        
        let stats = {};
        let eden = 0;

        if (row) {
            Object.keys(STAT_NAMES).forEach(statKey => {
                if (row[statKey]) {
                    stats[statKey] = parseNumber(row[statKey]);
                }
            });
            
            for(let t = 1; t < tier; t++) {
                const costRow = dataArr.find(f => f.feather === featherName && parseInt(f.tier) === t);
                if (costRow && costRow.eden_to_next) {
                    eden += parseNumber(costRow.eden_to_next);
                }
            }
        }
        return { stats, eden };
    };

    [...state.sets.atk, ...state.sets.def].forEach(setName => {
        const isAtk = state.sets.atk.includes(setName);
        const typeCat = isAtk ? 'atk' : 'def';
        if (!state.unlockedSets[isAtk ? 'atk' : 'def'].includes(setName)) return;

        let setStats = {};
        let setEden = 0;

        const slots = state.build[setName];
        const activeFeathers = slots.filter(s => s.feather !== '');
        
        activeFeathers.forEach(s => {
            let cat = typeCat;
            if (state.uniqueFeathers.mix.includes(s.feather)) cat = 'mix';
            const fResult = getFeatherStats(s.feather, s.tier, cat);
            
            setEden += fResult.eden;
            Object.entries(fResult.stats).forEach(([k, v]) => {
                setStats[k] = (setStats[k] || 0) + v;
                totalStats[k] = (totalStats[k] || 0) + v;
            });
        });

        const statusEl = document.getElementById(`set-bonus-${setName}`);
        const statsEl = document.getElementById(`set-stats-${setName}`);
        const edenEl = document.getElementById(`set-eden-${setName}`);
        
        if (!statusEl || !statsEl || !edenEl) return;

        if (activeFeathers.length === 5) {
            const uniqueNames = new Set(activeFeathers.map(f => f.feather));
            if (uniqueNames.size === 5) {
                const goldCount = activeFeathers.filter(f => state.featherRarities[f.feather] === 'gold').length;
                const purpleCount = activeFeathers.filter(f => state.featherRarities[f.feather] === 'purple').length;
                const minTier = Math.min(...activeFeathers.map(f => parseInt(f.tier)));

                const bonusRules = state.data.setBonuses.filter(b => (b.statue_type || b['statue_type,']) === typeCat);
                const possibleRules = bonusRules.filter(rule => {
                    return goldCount >= parseNumber(rule.req_gold) && purpleCount >= parseNumber(rule.req_purple);
                });

                possibleRules.sort((a, b) => {
                    const diffG = parseNumber(b.req_gold) - parseNumber(a.req_gold);
                    if (diffG !== 0) return diffG;
                    return parseNumber(b.req_purple) - parseNumber(a.req_purple);
                });

                if (possibleRules.length > 0) {
                    let bestRule = possibleRules[0];
                    const bNameDisp = bestRule.set_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    
                    let bonusStatsRow = state.data.setBonuses.find(b => b.set_name === bestRule.set_name && parseInt(b.tier) === minTier && (b.statue_type || b['statue_type,']) === typeCat);
                    let estimated = false;
                    if (!bonusStatsRow) {
                        bonusStatsRow = state.data.setBonuses.find(b => b.set_name === bestRule.set_name && parseInt(b.tier) === 20 && (b.statue_type || b['statue_type,']) === typeCat);
                        estimated = (minTier < 20);
                    }

                    statusEl.innerText = `${bNameDisp} (T${minTier})${estimated ? '*' : ''}`;
                    statusEl.className = "text-xs font-semibold px-2 py-1 rounded-full shadow-sm bg-purple-100 text-purple-800";

                    if (bonusStatsRow) {
                        Object.keys(STAT_NAMES).forEach(statKey => {
                            if (bonusStatsRow[statKey]) {
                                let val = parseNumber(bonusStatsRow[statKey]);
                                if (estimated) val = (val * minTier) / 20;
                                setStats[statKey] = (setStats[statKey] || 0) + val;
                                totalStats[statKey] = (totalStats[statKey] || 0) + val;
                            }
                        });
                    }
                } else {
                    statusEl.innerText = "No Matching Bonus";
                    statusEl.className = "text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full shadow-sm";
                }
            } else {
                statusEl.innerText = "Duplicate Feathers!";
                statusEl.className = "text-xs font-semibold px-2 py-1 bg-red-100 text-red-800 rounded-full shadow-sm";
            }
        } else {
            statusEl.innerText = "Incomplete Set";
            statusEl.className = "text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-800 rounded-full shadow-sm";
        }

        // Render Set Stats
        let preset = state.presets[state.currentPreset] || { priorityStats: [], hiddenStats: [] };
        statsEl.innerHTML = Object.entries(setStats)
            .filter(([k, v]) => v > 0 && !(preset.hiddenStats && preset.hiddenStats.includes(k)))
            .map(([k, v]) => {
                const isPrio = preset.priorityStats && preset.priorityStats.includes(k);
                return `<span class="${isPrio ? 'font-bold text-slate-900' : ''}">${STAT_NAMES[k]}: ${v.toFixed(1)}</span>`;
            }).join('<span class="text-gray-300">|</span>');
            
        edenEl.innerText = `${setEden.toLocaleString()} Eden`;
        totalEden += setEden;
    });

    // Render Global Summary
    const summaryContainer = document.getElementById('stats-summary');
    summaryContainer.innerHTML = '';
    
    let preset = state.presets[state.currentPreset] || { priorityStats: [], hiddenStats: [] };

    if (Object.keys(totalStats).length === 0) {
        summaryContainer.innerHTML = '<p class="text-gray-500 italic">No feathers equipped.</p>';
    } else {
        Object.entries(totalStats)
            .sort((a, b) => {
                const aPrio = preset.priorityStats && preset.priorityStats.includes(a[0]);
                const bPrio = preset.priorityStats && preset.priorityStats.includes(b[0]);
                if (aPrio && !bPrio) return -1;
                if (!aPrio && bPrio) return 1;
                return b[1] - a[1];
            })
            .forEach(([statKey, value]) => {
                if (preset.hiddenStats && preset.hiddenStats.includes(statKey)) return;
                if (value === 0) return;
                
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
    state.currentPreset = presetName;
    if (presetName === 'none') {
        renderStatues();
        updateSummary();
        return;
    }

    const presetConfig = state.presets[presetName];
    if (!presetConfig) return;
    
    [...state.sets.atk, ...state.sets.def].forEach(setName => {
        const isAtk = state.sets.atk.includes(setName);
        const type = isAtk ? 'atk' : 'def';
        
        if (state.unlockedSets[type].includes(setName)) {
            const optimalLoadout = presetConfig.optimal[type];
            for (let i = 0; i < 5; i++) {
                state.build[setName][i].feather = optimalLoadout[i] || '';
                state.build[setName][i].tier = 1;
            }
        }
    });

    renderStatues();
    updateSummary();
}

function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            if(btn.classList.contains('cursor-not-allowed')) return;

            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(btn.dataset.target).classList.remove('hidden');
        };
    });

    // Clear All
    document.getElementById('clear-all-btn').onclick = () => {
        if (confirm('Clear all feathers from all sets?')) {
            initBuildState();
            document.getElementById('class-preset').value = 'none';
            state.currentPreset = 'none';
            renderStatues();
            updateSummary();
        }
    };

    document.onclick = (e) => {
        if (e.target.closest('.clear-set-btn')) {
            const btn = e.target.closest('.clear-set-btn');
            const setName = btn.dataset.set;
            state.build[setName].forEach(slot => {
                slot.feather = '';
                slot.tier = 1;
            });
            renderStatues();
            updateSummary();
            return;
        }

        if (e.target.classList.contains('toggle-set-btn')) {
            const setName = e.target.dataset.set;
            const type = e.target.dataset.type;
            const index = state.unlockedSets[type].indexOf(setName);
            if (index > -1) state.unlockedSets[type].splice(index, 1);
            else state.unlockedSets[type].push(setName);
            renderSetToggles();
            renderStatues();
            updateSummary();
        }
    };

    document.onchange = (e) => {
        if (e.target.classList.contains('feather-select')) {
            const { set, slot } = e.target.dataset;
            state.build[set][slot].feather = e.target.value;
            // Re-render to update the available list for other slots
            renderStatues();
            updateSummary();
        }
        if (e.target.classList.contains('tier-select')) {
            const { set, slot } = e.target.dataset;
            state.build[set][slot].tier = parseInt(e.target.value);
            renderStatues();
            updateSummary();
        }
        if (e.target.id === 'class-preset') {
            applyPreset(e.target.value);
        }
    };
}

window.onload = loadData;
