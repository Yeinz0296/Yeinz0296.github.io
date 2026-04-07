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
    build: {}, // set_name -> [5 slots of {feather: 'Name', tier: 1}]
    currentPreset: 'none',
    presets: {
        paladin: {
            priorityStats: ['vit', 'ignore_pdef', 'pve_dmg_bonus', 'pve_dmg_reduction', 'max_hp', 'pdef', 'mdef'],
            hiddenStats: ['str', 'patk', 'patk_matk', 'int', 'dex'],
            optimal: {
                atk: ['Time', 'Day', 'Sky', 'Grace', 'Glory'],
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
    'atk_stat_percent': 'Atk Stat %',
    'def_stat_percent': 'Def Stat %',
    'pve_stat_percent': 'PvE Stat %',
    'pvp_stat_percent': 'PvP Stat %'
};

function parseNumber(str) {
    if (!str || str === '') return 0;
    return parseFloat(str.toString().replace(/,/g, '')) || 0;
}

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
        const selectedInSet = state.build[setName].map(s => s.feather).filter(f => f !== '');

        let html = `
        <div class="ro-window ${type === 'atk' ? 'ro-window-atk' : 'ro-window-def'} overflow-hidden mb-6">
            <div class="ro-header ${type === 'atk' ? 'ro-header-atk' : 'ro-header-def'} flex justify-between items-center">
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-bold uppercase tracking-wider" id="set-title-${setName}">${setName}</span>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="text-right">
                        <span id="set-eden-${setName}" class="text-[10px] font-bold text-white opacity-90 uppercase">0 EDEN</span>
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
            const rarity = slot.feather ? state.featherRarities[slot.feather] : '';
            const rarityClass = rarity === 'gold' ? 'ro-slot-gold' : (rarity === 'purple' ? 'ro-slot-purple' : '');
            
            html += `
                <div class="ro-slot p-3 ${rarityClass} ${isWarnTier || isWarnMix ? 'border-red-400' : ''}">
                    <label class="ro-label block mb-1">Slot ${i + 1}</label>
                    <select class="w-full text-xs border-ro-border rounded bg-white py-1 px-1 mb-2 feather-select" data-set="${setName}" data-slot="${i}">
                        <option value="">-- Empty --</option>
                        ${availableFeathers.map(f => {
                            const isSelectedElsewhere = selectedInSet.includes(f) && slot.feather !== f;
                            if (isSelectedElsewhere) return '';
                            const isMix = state.uniqueFeathers.mix.includes(f);
                            const mixTag = isMix ? ' (Mix)' : '';
                            const selected = slot.feather === f ? 'selected' : '';
                            const rarityIcon = state.featherRarities[f] === 'gold' ? '🟡 ' : '🟣 ';
                            return `<option value="${f}" ${selected}>${rarityIcon}${f}${mixTag}</option>`;
                        }).join('')}
                    </select>
                    <label class="ro-label block mb-1">Tier</label>
                    <select class="w-full text-xs border-ro-border rounded bg-white py-1 px-1 tier-select ${isWarnTier || isWarnMix ? 'border-red-400 bg-red-50' : ''}" data-set="${setName}" data-slot="${i}">
                        ${[...Array(20).keys()].map(t => {
                            const tNum = t + 1;
                            return `<option value="${tNum}" ${slot.tier == tNum ? 'selected' : ''}>T${tNum}</option>`;
                        }).join('')}
                    </select>
                </div>`;
        }
        
        html += `
            </div>
            <div class="px-4 py-3 bg-slate-50 border-t flex flex-col space-y-2">
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500 uppercase font-bold" id="set-feathers-${setName}">
                    <!-- Base Feather Stats -->
                </div>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ro-blue font-bold border-t pt-2" id="set-stats-${setName}">
                    <!-- Final Stats (Overview) -->
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
    let totalFeatherCosts = {};
    
    const getFeatherStats = (featherName, tier, type) => {
        if (!featherName) return { stats: {}, eden: 0, featherCount: 0 };
        const dataArr = state.data.feathers[type];
        const row = dataArr.find(f => f.feather === featherName && parseInt(f.tier) === parseInt(tier));
        
        let stats = {};
        let eden = 0;
        let featherCount = 0;

        if (row) {
            const possibleKeys = [
                'patk_matk', 'pdef', 'mdef', 'max_hp', 'pve_dmg_bonus', 'pve_dmg_reduction', 
                'pvp_dmg_bonus', 'pvp_dmg_reduction', 'ignore_pdef', 'ignore_mdef', 
                'vit', 'str', 'int', 'dex'
            ];
            possibleKeys.forEach(k => {
                if (row[k]) stats[k] = parseNumber(row[k]);
            });
            
            for(let t = 1; t < tier; t++) {
                const costRow = dataArr.find(f => f.feather === featherName && parseInt(f.tier) === t);
                if (costRow) {
                    if (costRow.eden_to_next) eden += parseNumber(costRow.eden_to_next);
                    if (costRow.feathers_to_next) featherCount += parseNumber(costRow.feathers_to_next);
                }
            }
        }
        return { stats, eden, featherCount };
    };

    [...state.sets.atk, ...state.sets.def].forEach(setName => {
        const isAtk = state.sets.atk.includes(setName);
        const typeCat = isAtk ? 'atk' : 'def';
        if (!state.unlockedSets[isAtk ? 'atk' : 'def'].includes(setName)) return;

        let baseFeatherStats = {}; 
        let setEden = 0;

        const slots = state.build[setName];
        const activeFeathers = slots.filter(s => s.feather !== '');
        
        activeFeathers.forEach(s => {
            let cat = typeCat;
            if (state.uniqueFeathers.mix.includes(s.feather)) cat = 'mix';
            const fResult = getFeatherStats(s.feather, s.tier, cat);
            
            setEden += fResult.eden;
            if (fResult.featherCount > 0) {
                totalFeatherCosts[s.feather] = (totalFeatherCosts[s.feather] || 0) + fResult.featherCount;
            }

            Object.entries(fResult.stats).forEach(([k, v]) => {
                baseFeatherStats[k] = (baseFeatherStats[k] || 0) + v;
            });
        });

        const titleEl = document.getElementById(`set-title-${setName}`);
        const feathersDisplayEl = document.getElementById(`set-feathers-${setName}`);
        const statsDisplayEl = document.getElementById(`set-stats-${setName}`);
        const edenEl = document.getElementById(`set-eden-${setName}`);
        
        if (!titleEl || !feathersDisplayEl || !statsDisplayEl || !edenEl) return;

        let multipliers = { atk: 0, def: 0, pve: 0, pvp: 0 };
        let flatSetBonuses = {};
        let bonusNameText = '';

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
                    const bNameDisp = bestRule.set_name.replace(/_/g, ' ').toUpperCase();
                    
                    let bonusStatsRow = state.data.setBonuses.find(b => b.set_name === bestRule.set_name && parseInt(b.tier) === minTier && (b.statue_type || b['statue_type,']) === typeCat);
                    let estimated = false;
                    if (!bonusStatsRow) {
                        bonusStatsRow = state.data.setBonuses.find(b => b.set_name === bestRule.set_name && parseInt(b.tier) === 20 && (b.statue_type || b['statue_type,']) === typeCat);
                        estimated = (minTier < 20);
                    }

                    bonusNameText = `(${bNameDisp} T${minTier})${estimated ? '*' : ''}`;

                    if (bonusStatsRow) {
                        Object.keys(bonusStatsRow).forEach(key => {
                            const k = key.toLowerCase();
                            const val = parseNumber(bonusStatsRow[key]);
                            if (k.includes('atk_stat_percent')) multipliers.atk = val / 100;
                            if (k.includes('def_stat_percent')) multipliers.def = val / 100;
                            if (k.includes('pve_stat_percent')) multipliers.pve = val / 100;
                            if (k.includes('pvp_stat_percent')) multipliers.pvp = val / 100;
                            if (k.includes('pvp_dmg_bonus')) flatSetBonuses['pvp_dmg_bonus'] = val;
                            if (k.includes('pvp_dmg_reduction')) flatSetBonuses['pvp_dmg_reduction'] = val;
                        });

                        if (estimated) {
                            ['atk', 'def', 'pve', 'pvp'].forEach(m => multipliers[m] = (multipliers[m] * minTier) / 20);
                            ['pvp_dmg_bonus', 'pvp_dmg_reduction'].forEach(f => { if(flatSetBonuses[f]) flatSetBonuses[f] = (flatSetBonuses[f] * minTier) / 20; });
                        }
                    }
                } else {
                    bonusNameText = "(NO MATCHING BONUS)";
                }
            } else {
                bonusNameText = "(DUPLICATE FEATHERS!)";
            }
        } else {
            bonusNameText = "(INCOMPLETE SET)";
        }

        titleEl.innerText = `${setName} ${bonusNameText}`;

        // Apply Multipliers
        const finalSetStats = {};
        Object.entries(baseFeatherStats).forEach(([k, v]) => {
            let mult = 0;
            if (['patk_matk', 'ignore_pdef', 'ignore_mdef'].includes(k)) mult = multipliers.atk;
            if (['pdef', 'mdef', 'max_hp'].includes(k)) mult = multipliers.def;
            if (['pve_dmg_bonus', 'pve_dmg_reduction'].includes(k)) mult = multipliers.pve;
            if (['pvp_dmg_bonus', 'pvp_dmg_reduction'].includes(k)) mult = multipliers.pvp;
            finalSetStats[k] = v * (1 + mult);
        });
        
        Object.entries(flatSetBonuses).forEach(([k, v]) => {
            finalSetStats[k] = (finalSetStats[k] || 0) + v;
        });

        Object.entries(finalSetStats).forEach(([k, v]) => {
            totalStats[k] = (totalStats[k] || 0) + v;
        });

        let preset = state.presets[state.currentPreset] || { priorityStats: [], hiddenStats: [] };
        
        feathersDisplayEl.innerHTML = 'Base Feathers: ' + Object.entries(baseFeatherStats)
            .filter(([k,v]) => v > 0)
            .map(([k,v]) => `${STAT_NAMES[k]}: ${v.toFixed(1)}`).join(' | ');

        statsDisplayEl.innerHTML = 'Final (Overview): ' + Object.entries(finalSetStats)
            .filter(([k, v]) => Math.floor(v) > 0 && !(preset.hiddenStats && preset.hiddenStats.includes(k)))
            .map(([k, v]) => {
                const isPrio = preset.priorityStats && preset.priorityStats.includes(k);
                return `<span class="${isPrio ? 'text-slate-900 underline' : ''}">${STAT_NAMES[k]}: ${Math.floor(v)}</span>`;
            }).join(' | ');
            
        edenEl.innerText = `${setEden.toLocaleString()} EDEN`;
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
                if (Math.floor(value) === 0) return;
                summaryContainer.innerHTML += `
                    <div class="flex justify-between items-center py-1 ${preset.priorityStats?.includes(statKey) ? 'bg-yellow-50 px-2 rounded font-semibold text-yellow-800' : 'text-gray-700'}">
                        <span>${STAT_NAMES[statKey] || statKey} ${preset.priorityStats?.includes(statKey) ? '<i class="fas fa-star text-[10px]"></i>' : ''}</span>
                        <span>${Math.floor(value)}</span>
                    </div>
                `;
            });
    }
    
    document.getElementById('total-eden').innerText = totalEden.toLocaleString();

    // Render Feather Cost Breakdown
    const costBreakdownEl = document.getElementById('cost-breakdown');
    costBreakdownEl.innerHTML = '';
    if (Object.keys(totalFeatherCosts).length > 0) {
        costBreakdownEl.innerHTML = '<div class="font-bold text-gray-700 mb-2 uppercase tracking-tight text-xs border-b pb-1">Required Feathers:</div>';
        Object.entries(totalFeatherCosts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([name, count]) => {
                const rarity = state.featherRarities[name];
                const colorClass = rarity === 'gold' ? 'text-yellow-600' : 'text-purple-600';
                costBreakdownEl.innerHTML += `
                    <div class="flex justify-between items-center py-1 text-sm">
                        <span class="${colorClass} font-bold">${name}:</span>
                        <span class="font-bold text-slate-800">${count.toLocaleString()}</span>
                    </div>
                `;
            });
    }
}

function applyPreset(presetName) {
    state.currentPreset = presetName;
    if (presetName === 'none') { renderStatues(); updateSummary(); return; }
    const presetConfig = state.presets[presetName];
    if (!presetConfig) return;
    [...state.sets.atk, ...state.sets.def].forEach(setName => {
        const type = state.sets.atk.includes(setName) ? 'atk' : 'def';
        if (state.unlockedSets[type].includes(setName)) {
            const loadout = presetConfig.optimal[type];
            for (let i = 0; i < 5; i++) {
                state.build[setName][i].feather = loadout[i] || '';
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

    document.getElementById('clear-all-btn').onclick = () => {
        if (confirm('Clear all?')) {
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
            state.build[btn.dataset.set].forEach(s => { s.feather = ''; s.tier = 1; });
            renderStatues();
            updateSummary();
        } else if (e.target.classList.contains('toggle-set-btn')) {
            const { set, type } = e.target.dataset;
            const idx = state.unlockedSets[type].indexOf(set);
            if (idx > -1) state.unlockedSets[type].splice(idx, 1);
            else state.unlockedSets[type].push(set);
            renderSetToggles();
            renderStatues();
            updateSummary();
        }
    };

    document.onchange = (e) => {
        if (e.target.classList.contains('feather-select')) {
            state.build[e.target.dataset.set][e.target.dataset.slot].feather = e.target.value;
            renderStatues();
            updateSummary();
        } else if (e.target.classList.contains('tier-select')) {
            state.build[e.target.dataset.set][e.target.dataset.slot].tier = parseInt(e.target.value);
            renderStatues();
            updateSummary();
        } else if (e.target.id === 'class-preset') {
            applyPreset(e.target.value);
        }
    };
}

window.onload = loadData;
