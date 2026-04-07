// State Management
const state = {
    data: { feathers: { atk: [], def: [], mix: [] }, setBonuses: [], presets: [] },
    sets: {
        atk: ['Duel', 'Rune', 'Weapon', 'Intimidation', 'Omni'],
        def: ['Wisdom', 'Fortitude', 'Mist', 'Relic', 'Conqueror'],
        order: [
            { name: 'Duel', type: 'atk' }, { name: 'Wisdom', type: 'def' },
            { name: 'Rune', type: 'atk' }, { name: 'Fortitude', type: 'def' },
            { name: 'Weapon', type: 'atk' }, { name: 'Mist', type: 'def' },
            { name: 'Intimidation', type: 'atk' }, { name: 'Relic', type: 'def' },
            { name: 'Omni', type: 'atk' }, { name: 'Conqueror', type: 'def' }
        ]
    },
    unlockedSets: { atk: ['Duel'], def: ['Wisdom'] },
    build: {}, inventory: {}, 
    baseStats: { 
        str: { base: 1, bonus: 0 }, 
        agi: { base: 1, bonus: 0 }, 
        vit: { base: 1, bonus: 0 }, 
        int: { base: 1, bonus: 0 }, 
        dex: { base: 1, bonus: 0 }, 
        luk: { base: 1, bonus: 0 } 
    },
    manualStats: {},
    currentPreset: 'none', currentMode: 'pve'
};

const STAT_NAMES = {
    'patk_matk': 'PATK/MATK', 'pdef': 'PDEF', 'mdef': 'MDEF', 'max_hp': 'HP',
    'pve_dmg_bonus': 'PvE DMG Bonus', 'pve_dmg_reduction': 'PvE DMG Reduction',
    'pvp_dmg_bonus': 'PvP DMG Bonus', 'pvp_dmg_reduction': 'PvP DMG Reduction',
    'ignore_pdef': 'Ignore PDEF', 'ignore_mdef': 'Ignore MDEF',
    'vit': 'VIT', 'str': 'STR', 'int': 'INT', 'dex': 'DEX', 'agi': 'AGI', 'luk': 'LUK',
    'atk_stat_percent': 'Atk Stat %', 'def_stat_percent': 'Def Stat %',
    'pve_stat_percent': 'PvE Stat %', 'pvp_stat_percent': 'PvP Stat %',
    'patk': 'PATK', 'matk': 'MATK', 'flee': 'Flee', 'hit': 'HIT',
    'crit': 'CRIT', 'crit_def': 'Crit Defense', 'max_sp': 'SP', 'max_hp_pct': 'HP %', 'max_sp_pct': 'SP %',
    'hp_recovery': 'HP recover', 'sp_recovery': 'SP Recovery',
    'cast_reduction': 'Cast Time', 'magic_dmg_reduction': 'Magic DMG Reduction',
    'refine_atk': 'Refine PATK', 'refine_matk': 'Refine MATK', 'refine_def': 'Refine PDEF', 
    'refine_mdef': 'Refine MDEF', 'aspd': 'ASPD'
};

function initManualStats() {
    const defaultStats = [
        'max_hp', 'max_sp', 'patk', 'matk', 'refine_atk', 'refine_matk', 
        'hp_recovery', 'hit', 'pdef', 'mdef', 'refine_def', 'refine_mdef', 
        'sp_recovery', 'flee', 'aspd', 'crit', 'crit_def', 'magic_dmg_reduction',
        'max_hp_pct', 'max_sp_pct', 'cast_reduction'
    ];
    defaultStats.forEach(s => { if (state.manualStats[s] === undefined) state.manualStats[s] = 0; });
}

function updateManualStatsModal() {
    const general = ['max_hp', 'max_sp', 'patk', 'matk', 'refine_atk', 'refine_matk', 'hp_recovery', 'hit', 'pdef', 'mdef', 'refine_def', 'refine_mdef', 'sp_recovery', 'flee'];
    const quasi = ['aspd', 'crit', 'crit_def', 'magic_dmg_reduction'];
    const special = ['max_hp_pct', 'max_sp_pct', 'cast_reduction'];

    const renderInput = (key) => `
        <div class="flex items-center justify-between space-x-4 bg-slate-900/50 p-2 rounded-lg border border-slate-700/30">
            <label class="text-[10px] font-bold text-slate-400 uppercase flex-1">${STAT_NAMES[key] || key}</label>
            <input type="number" class="w-24 border-slate-700 rounded-lg bg-slate-950 py-1.5 px-3 text-sm font-bold text-center manual-stat-input" data-stat="${key}" value="${state.manualStats[key] || 0}">
        </div>`;

    document.getElementById('manual-general-inputs').innerHTML = general.map(renderInput).join('');
    document.getElementById('manual-quasi-inputs').innerHTML = quasi.map(renderInput).join('');
    document.getElementById('manual-special-inputs').innerHTML = special.map(renderInput).join('');
}

function parseNumber(str) { if (!str || str === '') return 0; return parseFloat(str.toString().replace(/,/g, '')) || 0; }

function initBuildState() {
    [...state.sets.atk, ...state.sets.def].forEach(setName => {
        state.build[setName] = [{ feather: '', tier: 1 }, { feather: '', tier: 1 }, { feather: '', tier: 1 }, { feather: '', tier: 1 }, { feather: '', tier: 1 }];
    });
}

function calculateBaseStatBonuses() {
    const { str, agi, vit, int, dex, luk } = state.baseStats;
    const bonuses = {};

    // HP: 1% increase for every VIT
    bonuses['max_hp_pct'] = vit * 1;
    
    // SP: 1% increase for every INT
    bonuses['max_sp_pct'] = int * 1;

    // ATK: STR by 1, DEX by 0.2, LUK by 0.2
    bonuses['patk'] = (str * 1) + (dex * 0.2) + (luk * 0.2);

    // MATK: STR by 0.2, DEX by 1, LUK by 0.2
    bonuses['matk'] = (str * 0.2) + (dex * 1) + (luk * 0.2);

    // MDEF: VIT by 0.5, AGI by 0.2
    bonuses['mdef'] = (vit * 0.5) + (agi * 0.2);

    // Refine ATK: INT by 1.5, LUK by 0.3, DEX by 0.2
    bonuses['refine_atk'] = (int * 1.5) + (luk * 0.3) + (dex * 0.2);

    // Refine MATK: INT by 1, VIT by 0.2, DEX by 0.2
    bonuses['refine_matk'] = (int * 1) + (vit * 0.2) + (dex * 0.2);

    // Refine DEF: Small increase from DEX/AGI
    bonuses['refine_def'] = (dex * 0.1) + (agi * 0.1);

    // Refine MDEF: Small increase from DEX/AGI
    bonuses['refine_mdef'] = (dex * 0.1) + (agi * 0.1);

    // HP & SP Recovery: Small increase from DEX/AGI
    bonuses['hp_recovery'] = (dex * 0.1) + (agi * 0.1);
    bonuses['sp_recovery'] = (dex * 0.1) + (agi * 0.1);

    // HIT: Accuracy +1 for every DEX
    bonuses['hit'] = dex * 1;

    // FLEE: Evasion +1 for every AGI
    bonuses['flee'] = agi * 1;

    // ASPD: Small increase from DEX/AGI
    bonuses['aspd'] = (dex * 0.1) + (agi * 0.1);

    // Cast Time: Small increase from DEX/INT
    bonuses['cast_reduction'] = (dex * 0.1) + (int * 0.1);

    return bonuses;
}

function calculateStatPointCost(val) {
    let total = 0;
    for (let i = 1; i < val; i++) {
        total += Math.floor((i - 1) / 10) + 2;
    }
    return total;
}

function updateDerivedStatsUI(totalStats = {}) {
    const generalContainer = document.getElementById('derived-general-stats');
    const quasiContainer = document.getElementById('derived-quasi-stats');
    const specialContainer = document.getElementById('derived-special-stats');
    
    if (!generalContainer) return;

    const renderStat = (key, val, suffix = '') => `
        <div class="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
            <label class="ro-label block mb-1">${STAT_NAMES[key] || key}</label>
            <span class="text-sm font-black text-white">${val.toFixed(1)}${suffix}</span>
        </div>`;

    // General Stats
    generalContainer.innerHTML = [
        renderStat('max_hp', totalStats.max_hp || 0),
        renderStat('max_sp', totalStats.max_sp || 0),
        renderStat('patk', totalStats.patk || 0),
        renderStat('matk', totalStats.matk || 0),
        renderStat('refine_atk', totalStats.refine_atk || 0),
        renderStat('refine_matk', totalStats.refine_matk || 0),
        renderStat('hp_recovery', totalStats.hp_recovery || 0),
        renderStat('hit', totalStats.hit || 0),
        renderStat('pdef', totalStats.pdef || 0),
        renderStat('mdef', totalStats.mdef || 0),
        renderStat('refine_def', totalStats.refine_def || 0),
        renderStat('refine_mdef', totalStats.refine_mdef || 0),
        renderStat('sp_recovery', totalStats.sp_recovery || 0),
        renderStat('flee', totalStats.flee || 0)
    ].join('');

    // Quasi-stats
    quasiContainer.innerHTML = [
        renderStat('aspd', totalStats.aspd || 0),
        renderStat('crit', totalStats.crit || 0),
        renderStat('crit_def', totalStats.crit_def || 0),
        renderStat('magic_dmg_reduction', totalStats.magic_dmg_reduction || 0)
    ].join('');

    // Special Stats
    specialContainer.innerHTML = [
        renderStat('max_hp_pct', totalStats.max_hp_pct || 0, '%'),
        renderStat('max_sp_pct', totalStats.max_sp_pct || 0, '%'),
        renderStat('cast_reduction', totalStats.cast_reduction || 0),
        `<div class="bg-slate-900/30 p-3 rounded-lg border border-slate-700/30 flex items-center justify-center italic text-[10px] text-slate-500">
            More special stats coming soon...
         </div>`
    ].join('');

    // Update Stat Points
    let totalPoints = 0;
    Object.values(state.baseStats).forEach(v => totalPoints += calculateStatPointCost(v));
    document.getElementById('stat-points-used').innerText = totalPoints.toLocaleString();
    const maxPoints = 2500; 
    document.getElementById('stat-points-bar').style.width = `${Math.min(100, (totalPoints / maxPoints) * 100)}%`;
}

function saveToLocal() {
    const data = { 
        build: state.build, 
        unlockedSets: state.unlockedSets, 
        preset: state.currentPreset, 
        mode: state.currentMode, 
        inventory: state.inventory,
        baseStats: state.baseStats,
        manualStats: state.manualStats
    };
    localStorage.setItem('rooc_planner_data_v4', JSON.stringify(data));
}

function loadFromLocal() {
    const saved = localStorage.getItem('rooc_planner_data_v4');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.build = data.build; state.unlockedSets = data.unlockedSets;
            state.currentPreset = data.preset || 'none';
            state.currentMode = data.mode || 'pve';
            state.inventory = data.inventory || {};
            state.baseStats = data.baseStats || { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 };
            state.manualStats = data.manualStats || {};
            return true;
        } catch (e) { return false; }
    }
    return false;
}

function generateShareUrl() {
    const data = { b: state.build, u: state.unlockedSets, p: state.currentPreset, m: state.currentMode, i: state.inventory, s: state.baseStats, ms: state.manualStats };
    const hash = btoa(JSON.stringify(data));
    const url = window.location.origin + window.location.pathname + '#share=' + hash;
    navigator.clipboard.writeText(url).then(() => alert('Shareable link copied!'));
}

function loadFromHash() {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
        try {
            const encoded = hash.split('=')[1];
            const data = JSON.parse(atob(encoded));
            state.build = data.b; state.unlockedSets = data.u; state.currentPreset = data.p; state.currentMode = data.m; state.inventory = data.i || {};
            state.baseStats = data.s || { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 };
            state.manualStats = data.ms || {};
            window.location.hash = ''; return true;
        } catch (e) { return false; }
    }
    return false;
}

function updateBaseStatsUI() {
    document.querySelectorAll('.base-stat-input').forEach(input => {
        input.value = state.baseStats[input.dataset.stat] || 1;
    });
}

async function loadData() {
    try {
        const fetchCsv = async (url) => {
            const response = await fetch(url);
            const text = await response.text();
            return new Promise((resolve) => {
                Papa.parse(text, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().replace(/,$/, '').trim(), complete: (r) => resolve(results_map(r.data)) });
            });
        };
        const results_map = (data) => data.map(row => {
            const newRow = {};
            for (let k in row) newRow[k.trim().replace(/,$/, '').trim()] = row[k];
            return newRow;
        });

        const [atk, def, mix, bonus, presets] = await Promise.all([
            fetchCsv('data/feather/atk.csv'), fetchCsv('data/feather/def.csv'),
            fetchCsv('data/feather/mix.csv'), fetchCsv('data/feather/set_bonus.csv'),
            fetchCsv('data/feather/class_presets.csv')
        ]);

        state.data.feathers.atk = atk; state.data.feathers.def = def;
        state.data.feathers.mix = mix; state.data.setBonuses = bonus;
        state.data.presets = presets;

        state.uniqueFeathers = { atk: [...new Set(atk.map(f => f.feather))], def: [...new Set(def.map(f => f.feather))], mix: [...new Set(mix.map(f => f.feather))] };
        state.featherRarities = {}; [...atk, ...def, ...mix].forEach(f => { if (f.feather && f.rarity) state.featherRarities[f.feather] = f.rarity.toLowerCase(); });

        initBuildState();
        if (!loadFromHash()) loadFromLocal();
        initManualStats();

        updatePresetDropdown();
        updateBaseStatsUI();
        renderApp();
        
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('tab-stats').classList.remove('hidden');
        document.getElementById('class-mode').value = state.currentMode;
        if (state.currentPreset !== 'none') document.getElementById('class-preset').value = state.currentPreset;

    } catch (error) {
        console.error("Failed to load data:", error);
        document.getElementById('loading').innerHTML = `<span class="text-red-500">Error loading data. ${error.message}</span>`;
    }
}

function updatePresetDropdown() {
    const sel = document.getElementById('class-preset');
    const mode = document.getElementById('class-mode').value;
    sel.innerHTML = '<option value="none">-- Select Build --</option>';
    
    // Get unique class IDs available for this mode
    const classes = [...new Set(state.data.presets.filter(p => p.mode === mode).map(p => p.class_id))];
    state.data.presets.filter(p => p.mode === mode).forEach(p => {
        sel.innerHTML += `<option value="${p.class_id}">${p.display_name}</option>`;
    });
}

function renderApp() {
    renderSetToggles(); renderStatues(); updateSummary(); setupEventListeners();
}

function renderSetToggles() {
    const createToggle = (setName, type) => {
        const isUnlocked = state.unlockedSets[type].includes(setName);
        const activeClass = type === 'atk' ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/20' : 'bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-500/20';
        const inactiveClass = 'bg-slate-900 text-slate-500 border-slate-700 hover:bg-slate-800';
        const color = isUnlocked ? activeClass : inactiveClass;
        return `<button class="px-3 py-1.5 border rounded-lg text-[10px] font-bold uppercase transition-all toggle-set-btn ${color}" data-set="${setName}" data-type="${type}">${setName}</button>`;
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
        const activeSlots = state.build[setName].filter(s => s.feather !== '');
        const currentMinTier = activeSlots.length > 0 ? Math.min(...activeSlots.map(f => parseInt(f.tier))) : 1;

        let html = `
        <div class="ro-window ${type === 'atk' ? 'ro-window-atk' : 'ro-window-def'} animate-in mb-8 shadow-2xl">
            <div class="ro-header ${type === 'atk' ? 'ro-header-atk' : 'ro-header-def'}">
                <div class="flex items-center space-x-3">
                    <span class="text-sm font-bold uppercase tracking-widest text-white" id="set-title-${setName}">${setName}</span>
                    <div class="flex items-center bg-black/30 rounded-lg px-2 py-0.5 border border-white/10">
                        <span class="text-[9px] font-bold text-white/50 mr-2 uppercase">SET TIER</span>
                        <select class="text-[10px] bg-transparent text-white font-bold focus:outline-none cursor-pointer set-tier-select border-none" data-set="${setName}">
                            ${[...Array(20).keys()].map(t => `<option value="${t+1}" ${currentMinTier == t+1 ? 'selected' : ''} class="text-slate-200 bg-slate-800">T${t+1}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="flex items-center bg-black/40 rounded-lg px-3 py-1 border border-white/5">
                        <i class="fas fa-coins text-yellow-400 text-[10px] mr-2"></i>
                        <span id="set-eden-${setName}" class="text-[10px] font-bold text-white uppercase tracking-tight">0</span>
                    </div>
                    <button class="clear-set-btn w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors" data-set="${setName}" title="Clear Set">
                        <i class="fas fa-undo-alt text-xs text-white"></i>
                    </button>
                </div>
            </div>
            <div class="p-5 grid grid-cols-1 sm:grid-cols-5 gap-4 bg-slate-800/20">`;

        for (let i = 0; i < 5; i++) {
            const slot = state.build[setName][i];
            const rarity = slot.feather ? state.featherRarities[slot.feather] : '';
            const rarityClass = rarity === 'gold' ? 'ro-slot-gold' : (rarity === 'purple' ? 'ro-slot-purple' : '');
            const rarityDot = rarity === 'gold' ? 'dot-gold' : (rarity === 'purple' ? 'dot-purple' : 'bg-slate-700');
            
            html += `
                <div class="ro-slot ${rarityClass}">
                    <div class="flex justify-between items-center mb-2">
                        <label class="ro-label m-0">Slot ${i + 1}</label>
                        <span class="rarity-dot ${rarityDot}"></span>
                    </div>
                    <select class="w-full text-[10px] border-slate-700 rounded-md bg-slate-900 py-1.5 px-2 mb-3 feather-select font-bold shadow-inner focus:ring-1 focus:ring-blue-500/50" data-set="${setName}" data-slot="${i}">
                        <option value="" class="text-slate-500">-- Empty --</option>
                        ${availableFeathers.map(f => {
                            if (selectedInSet.includes(f) && slot.feather !== f) return '';
                            const selected = slot.feather === f ? 'selected' : '';
                            const rarityLabel = state.featherRarities[f] === 'gold' ? ' (G)' : ' (P)';
                            return `<option value="${f}" ${selected} class="text-slate-200 bg-slate-800">${f}${rarityLabel}</option>`;
                        }).join('')}
                    </select>
                    <label class="ro-label block mb-1">Tier</label>
                    <div class="relative">
                        <select class="w-full text-[10px] border-slate-700 rounded-md bg-slate-900 py-1.5 px-2 tier-select font-semibold shadow-inner focus:ring-1 focus:ring-blue-500/50" data-set="${setName}" data-slot="${i}">
                            ${[...Array(20).keys()].map(t => `<option value="${t+1}" ${slot.tier == t+1 ? 'selected' : ''} class="text-slate-200 bg-slate-800">Tier ${t+1}</option>`).join('')}
                        </select>
                    </div>
                </div>`;
        }
        html += `</div>
            <div class="px-5 py-3 bg-slate-900/30 border-t border-slate-700 flex flex-col space-y-2">
                <div class="flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <i class="fas fa-microchip mr-2"></i> Base Stats Breakdown
                </div>
                <div class="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 font-medium" id="set-feathers-${setName}"></div>
                <div class="pt-2 border-t border-slate-700">
                    <div class="flex items-center text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">
                        <i class="fas fa-chart-line mr-2"></i> Final Set Stats (Inc. Bonus)
                    </div>
                    <div class="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-200 font-bold" id="set-stats-${setName}"></div>
                </div>
            </div>
        </div>`;
        return html;
    };
    state.sets.order.forEach(set => container.innerHTML += renderSet(set.name, set.type));
}

function updateSummary() {
    let totalStats = {}, totalEden = 0, totalFeatherCosts = {};
    
    // Initialise with manual base values
    Object.entries(state.manualStats).forEach(([k, v]) => totalStats[k] = v);
    
    // Add base attribute point bonuses
    const baseBonuses = calculateBaseStatBonuses();
    Object.entries(baseBonuses).forEach(([k, v]) => totalStats[k] = (totalStats[k] || 0) + v);

    const getFeatherStats = (featherName, requestedTier, type) => {
        if (!featherName) return { stats: {}, eden: 0, featherCount: 0, maxReached: 1 };
        const allRows = state.data.feathers[type].filter(f => f.feather === featherName);
        if (allRows.length === 0) return { stats: {}, eden: 0, featherCount: 0, maxReached: 1 };
        const maxCsv = Math.max(...allRows.map(r => parseInt(r.tier)));
        const statTier = Math.min(requestedTier, maxCsv);
        const row = allRows.find(r => parseInt(r.tier) === statTier);
        let stats = {}, eden = 0, featherCount = 0, maxReached = 1;
        if (row) {
            Object.keys(STAT_NAMES).forEach(k => {
                if (row[k]) {
                    let val = parseNumber(row[k]);
                    if (requestedTier > maxCsv) val = (val * requestedTier) / maxCsv;
                    stats[k] = val;
                }
            });
            for(let t = 1; t < requestedTier; t++) {
                const costRow = allRows.find(f => parseInt(f.tier) === t);
                if (costRow) {
                    eden += parseNumber(costRow.eden_to_next);
                    featherCount += parseNumber(costRow.feathers_to_next);
                    maxReached = t + 1;
                }
            }
        }
        return { stats, eden, featherCount, maxReached };
    };

    [...state.sets.atk, ...state.sets.def].forEach(setName => {
        const isAtk = state.sets.atk.includes(setName); const typeCat = isAtk ? 'atk' : 'def';
        if (!state.unlockedSets[isAtk ? 'atk' : 'def'].includes(setName)) return;
        let baseFeatherStats = {}, setEden = 0;
        const slots = state.build[setName]; const activeFeathers = slots.filter(s => s.feather !== '');
        activeFeathers.forEach(s => {
            let cat = state.uniqueFeathers.mix.includes(s.feather) ? 'mix' : typeCat;
            const res = getFeatherStats(s.feather, s.tier, cat);
            setEden += res.eden;
            if (res.featherCount > 0 || s.tier > 1) {
                if (!totalFeatherCosts[s.feather]) totalFeatherCosts[s.feather] = { count: 0, maxReached: 0, requested: 0 };
                totalFeatherCosts[s.feather].count += res.featherCount;
                totalFeatherCosts[s.feather].maxReached = Math.max(totalFeatherCosts[s.feather].maxReached, res.maxReached);
                totalFeatherCosts[s.feather].requested = Math.max(totalFeatherCosts[s.feather].requested, parseInt(s.tier));
            }
            Object.entries(res.stats).forEach(([k, v]) => baseFeatherStats[k] = (baseFeatherStats[k] || 0) + v);
        });

        const titleEl = document.getElementById(`set-title-${setName}`);
        const feathersDisplayEl = document.getElementById(`set-feathers-${setName}`);
        const statsDisplayEl = document.getElementById(`set-stats-${setName}`);
        const edenEl = document.getElementById(`set-eden-${setName}`);
        if (!titleEl) return;

        let mults = { atk: 0, def: 0, pve: 0, pvp: 0 }, flats = {}, bText = '';
        if (activeFeathers.length === 5) {
            const goldCount = activeFeathers.filter(f => state.featherRarities[f.feather] === 'gold').length;
            const purpleCount = activeFeathers.filter(f => state.featherRarities[f.feather] === 'purple').length;
            const minT = Math.min(...activeFeathers.map(f => parseInt(f.tier)));
            const rules = state.data.setBonuses.filter(b => (b.statue_type || b['statue_type,']) === typeCat);
            const possible = rules.filter(r => goldCount >= parseNumber(r.req_gold) && purpleCount >= parseNumber(r.req_purple)).sort((a,b) => (parseNumber(b.req_gold) - parseNumber(a.req_gold)) || (parseNumber(b.req_purple) - parseNumber(a.req_purple)));

            if (possible.length > 0) {
                const best = possible[0];
                let row = state.data.setBonuses.find(b => b.set_name === best.set_name && parseInt(b.tier) === minT && (b.statue_type || b['statue_type,']) === typeCat);
                let est = false; if (!row) { row = state.data.setBonuses.find(b => b.set_name === best.set_name && parseInt(b.tier) === 20 && (b.statue_type || b['statue_type,']) === typeCat); est = minT < 20; }
                bText = `<span class="ml-2 text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold text-white/90 shadow-sm">${best.set_name.replace(/_/g, ' ').toUpperCase()} T${minT}${est ? '*' : ''}</span>`;
                if (row) {
                    Object.keys(row).forEach(key => {
                        const k = key.toLowerCase(); const val = parseNumber(row[key]);
                        if (k.includes('atk_stat_percent')) mults.atk = val / 100;
                        if (k.includes('def_stat_percent')) mults.def = val / 100;
                        if (k.includes('pve_stat_percent')) mults.pve = val / 100;
                        if (k.includes('pvp_stat_percent')) mults.pvp = val / 100;
                        if (k.includes('pvp_dmg_bonus')) flats['pvp_dmg_bonus'] = val;
                        if (k.includes('pvp_dmg_reduction')) flats['pvp_dmg_reduction'] = val;
                    });
                    if (est) { ['atk', 'def', 'pve', 'pvp'].forEach(m => mults[m] = (mults[m] * minT) / 20); ['pvp_dmg_bonus', 'pvp_dmg_reduction'].forEach(f => { if(flats[f]) flats[f] = (flats[f] * minT) / 20; }); }
                }
            } else {
                const next = rules.sort((a,b) => parseNumber(a.req_gold) - parseNumber(b.req_gold)).find(r => parseNumber(r.req_gold) > goldCount || parseNumber(r.req_purple) > purpleCount);
                bText = next ? `<span class="ml-2 text-[9px] text-white/40 font-medium">Need ${Math.max(0, parseNumber(next.req_gold)-goldCount)}G / ${Math.max(0, parseNumber(next.req_purple)-purpleCount)}P</span>` : '';
            }
        } else { bText = '<span class="ml-2 text-[9px] text-white/30 font-medium">Incomplete Statue</span>'; }
        titleEl.innerHTML = `${setName} ${bText}`;

        const finalSetStats = {};
        Object.entries(baseFeatherStats).forEach(([k, v]) => {
            let m = 0;
            if (['patk_matk', 'ignore_pdef', 'ignore_mdef'].includes(k)) m = mults.atk;
            if (['pdef', 'mdef', 'max_hp'].includes(k)) m = mults.def;
            if (['pve_dmg_bonus', 'pve_dmg_reduction'].includes(k)) m = mults.pve;
            if (['pvp_dmg_bonus', 'pvp_dmg_reduction'].includes(k)) m = mults.pvp;
            finalSetStats[k] = v * (1 + m);
        });
        Object.entries(flats).forEach(([k, v]) => finalSetStats[k] = (finalSetStats[k] || 0) + v);
        Object.entries(finalSetStats).forEach(([k, v]) => totalStats[k] = (totalStats[k] || 0) + v);

        feathersDisplayEl.innerHTML = Object.entries(baseFeatherStats).filter(([k,v]) => v > 0).map(([k,v]) => `<span class="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">${STAT_NAMES[k]}: ${v.toFixed(1)}</span>`).join('');
        statsDisplayEl.innerHTML = Object.entries(finalSetStats).filter(([k,v]) => Math.floor(v) > 0).map(([k,v]) => `<span class="text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-800/50 shadow-sm">${STAT_NAMES[k]}: ${Math.floor(v)}</span>`).join('');
        edenEl.innerText = `${setEden.toLocaleString()}`;
        totalEden += setEden;
    });

    const summaryContainer = document.getElementById('stats-summary');
    summaryContainer.innerHTML = '';
    const presetData = state.data.presets.find(p => p.class_id === state.currentPreset && p.mode === state.currentMode) || { priority_stats: '', hidden_stats: '' };
    const priorityStats = presetData.priority_stats.split(',').map(s => s.trim());
    const hiddenStats = presetData.hidden_stats.split(',').map(s => s.trim());

    Object.entries(totalStats).sort((a, b) => (priorityStats.includes(b[0]) - priorityStats.includes(a[0])) || (b[1] - a[1])).forEach(([statKey, value]) => {
        if (hiddenStats.includes(statKey) || Math.floor(value) === 0) return;
        const isPrio = priorityStats.includes(statKey);
        summaryContainer.innerHTML += `
            <div class="stat-card ${isPrio ? 'priority' : ''} mb-2 shadow-sm">
                <div class="flex items-center">
                    <span class="text-[11px] font-bold ${isPrio ? 'text-orange-400' : 'text-slate-400'}">${STAT_NAMES[statKey] || statKey}</span>
                    ${isPrio ? '<i class="fas fa-star text-[8px] text-orange-400 ml-1.5 animate-pulse"></i>' : ''}
                </div>
                <span class="text-sm font-bold ${isPrio ? 'text-orange-100' : 'text-slate-100'}">${Math.floor(value).toLocaleString()}</span>
            </div>`;
    });
    
    document.getElementById('total-eden').innerText = totalEden.toLocaleString();
    const costBreakdownEl = document.getElementById('cost-breakdown');
    costBreakdownEl.innerHTML = '<div class="font-bold text-slate-500 mb-3 uppercase tracking-widest text-[10px]">Material Requirement</div>';
    let hasCost = false;
    Object.entries(totalFeatherCosts).sort((a,b) => b[1].count - a[1].count).forEach(([name, data]) => {
        const owned = state.inventory[name] || 0;
        const needed = Math.max(0, data.count - owned);
        if (needed <= 0 && data.count > 0) return; 
        hasCost = true;
        const rarity = state.featherRarities[name];
        const rangeText = data.maxReached < data.requested ? ` <span class="text-[9px] text-slate-500 font-normal">T${data.maxReached}</span>` : '';
        costBreakdownEl.innerHTML += `
            <div class="flex justify-between items-center py-1.5 border-b border-slate-700 last:border-0">
                <div class="flex items-center">
                    <span class="rarity-dot ${rarity === 'gold' ? 'dot-gold' : 'dot-purple'}"></span>
                    <span class="text-xs font-bold text-slate-300">${name}${rangeText}</span>
                </div>
                <span class="text-xs font-black text-white bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">${needed.toLocaleString()}</span>
            </div>`;
    });
    if (!hasCost) costBreakdownEl.innerHTML += '<div class="text-center py-4 text-xs italic text-green-400 font-bold bg-green-50/10 border border-green-500/20 rounded-lg">All materials acquired!</div>';
    
    updateDerivedStatsUI(totalStats);
    saveToLocal();
}

function updateInventoryModal(filter = '') {
    const container = document.getElementById('inv-inputs');
    const feathers = [...new Set([...state.uniqueFeathers.atk, ...state.uniqueFeathers.def, ...state.uniqueFeathers.mix])]
        .sort()
        .filter(f => f.toLowerCase().includes(filter.toLowerCase()));
        
    container.innerHTML = feathers.map(f => {
        const rarity = state.featherRarities[f];
        return `
        <div class="bg-slate-900 p-3 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors shadow-inner">
            <div class="flex items-center mb-2">
                <span class="rarity-dot ${rarity === 'gold' ? 'dot-gold' : 'dot-purple'}"></span>
                <label class="text-[11px] font-bold uppercase text-slate-300 truncate">${f}</label>
            </div>
            <input type="number" class="w-full border border-slate-700 rounded-md px-3 py-1.5 text-sm inv-input focus:ring-1 focus:ring-blue-500/50 outline-none bg-slate-800 text-white" 
                   data-feather="${f}" value="${state.inventory[f] || 0}" min="0">
        </div>`;
    }).join('');
}

function applyPreset() {
    const presetId = document.getElementById('class-preset').value;
    const mode = document.getElementById('class-mode').value;
    state.currentPreset = presetId; state.currentMode = mode;
    if (presetId === 'none') { renderStatues(); updateSummary(); return; }
    
    const p = state.data.presets.find(x => x.class_id === presetId && x.mode === mode);
    if (!p) return;
    const optAtk = p.optimal_atk_feathers.split(',').map(s => s.trim());
    const optDef = p.optimal_def_feathers.split(',').map(s => s.trim());
    
    [...state.sets.atk, ...state.sets.def].forEach(setName => {
        const type = state.sets.atk.includes(setName) ? 'atk' : 'def';
        if (state.unlockedSets[type].includes(setName)) {
            const list = type === 'atk' ? optAtk : optDef;
            for (let i = 0; i < 5; i++) {
                state.build[setName][i].feather = list[i] || '';
                // Default to T1 if multiple tiers exist in CSV, otherwise use available
                const allF = state.data.feathers[state.uniqueFeathers.mix.includes(list[i]) ? 'mix' : type].filter(f => f.feather === list[i]);
                const hasT1 = allF.some(f => parseInt(f.tier) === 1);
                state.build[setName][i].tier = hasT1 ? 1 : (allF.length > 0 ? Math.min(...allF.map(f => parseInt(f.tier))) : 1);
            }
        }
    });
    renderStatues(); updateSummary();
}

function setupEventListeners() {
    // Desktop Tab Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault(); if(btn.classList.contains('cursor-not-allowed')) return;
            document.querySelectorAll('.tab-btn, .mobile-tab-btn').forEach(b => b.classList.remove('active')); 
            btn.classList.add('active');
            
            // Sync mobile tab btn
            const mobBtn = document.querySelector(`.mobile-tab-btn[data-target="${btn.dataset.target}"]`);
            if(mobBtn) mobBtn.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden')); 
            const target = document.getElementById(btn.dataset.target);
            target.classList.remove('hidden');
            target.classList.add('animate-in');
            window.scrollTo(0, 0);
        };
    });

    // Mobile Bottom Navigation
    document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault(); if(btn.classList.contains('cursor-not-allowed')) return;
            document.querySelectorAll('.tab-btn, .mobile-tab-btn').forEach(b => b.classList.remove('active')); 
            btn.classList.add('active');

            // Sync desktop tab btn
            const deskBtn = document.querySelector(`.tab-btn[data-target="${btn.dataset.target}"]`);
            if(deskBtn) deskBtn.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden')); 
            const target = document.getElementById(btn.dataset.target);
            target.classList.remove('hidden');
            target.classList.add('animate-in');
            window.scrollTo(0, 0);
        };
    });

    // Mobile View Toggle (Statues vs Attributes)
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (btn.dataset.view === 'statues') {
                document.getElementById('view-statues').classList.add('mobile-nav-active');
                document.getElementById('view-statues').classList.remove('mobile-nav-hidden');
                document.getElementById('view-summary').classList.add('mobile-nav-hidden');
                document.getElementById('view-summary').classList.remove('mobile-nav-active');
            } else {
                document.getElementById('view-summary').classList.add('mobile-nav-active');
                document.getElementById('view-summary').classList.remove('mobile-nav-hidden');
                document.getElementById('view-statues').classList.add('mobile-nav-hidden');
                document.getElementById('view-statues').classList.remove('mobile-nav-active');
            }
            window.scrollTo(0, 0);
        };
    });

    // Shared UI Actions
    const clearAll = () => { if (confirm('Are you sure you want to clear the entire build?')) { initBuildState(); document.getElementById('class-preset').value = 'none'; state.currentPreset = 'none'; renderStatues(); updateSummary(); } };
    const openInv = () => {
        const listEl = document.getElementById('inv-list');
        if (!document.getElementById('inv-search')) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'mb-6 sticky top-0 bg-slate-900/80 backdrop-blur-md pt-2 pb-4 z-10 border-b border-slate-700';
            searchContainer.innerHTML = `
                <div class="relative">
                    <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                    <input type="text" id="inv-search" placeholder="Search feathers..." 
                           class="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-1 focus:ring-blue-500/50 outline-none text-white text-sm">
                </div>`;
            listEl.prepend(searchContainer);
            document.getElementById('inv-search').oninput = (e) => updateInventoryModal(e.target.value);
        }
        updateInventoryModal();
        document.getElementById('inv-modal').classList.remove('hidden'); 
        document.getElementById('inv-modal').classList.add('flex', 'animate-in');
    };

    document.getElementById('clear-all-btn').onclick = clearAll;
    document.getElementById('share-btn').onclick = generateShareUrl;
    document.getElementById('share-btn-mob').onclick = generateShareUrl;
    document.getElementById('print-btn').onclick = () => window.print();
    document.getElementById('inv-btn').onclick = openInv;
    document.getElementById('inv-btn-mob').onclick = openInv;

    // Manual Stats Modal Listeners
    document.getElementById('open-manual-stats').onclick = () => {
        updateManualStatsModal();
        document.getElementById('manual-stats-modal').classList.remove('hidden');
        document.getElementById('manual-stats-modal').classList.add('flex', 'animate-in');
    };

    document.getElementById('close-manual-stats').onclick = () => {
        document.getElementById('manual-stats-modal').classList.replace('flex', 'hidden');
    };

    document.getElementById('save-manual-stats').onclick = () => {
        document.querySelectorAll('.manual-stat-input').forEach(input => {
            state.manualStats[input.dataset.stat] = parseFloat(input.value) || 0;
        });
        document.getElementById('manual-stats-modal').classList.replace('flex', 'hidden');
        updateSummary();
    };

    document.getElementById('optimize-btn').onclick = () => {
        if (state.currentPreset === 'none') { alert("Please select a Class Build first."); return; }
        applyPreset();
        const btn = document.getElementById('optimize-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check mr-2"></i>Applied';
        setTimeout(() => btn.innerHTML = originalText, 2000);
    };

    document.getElementById('class-mode').onchange = () => { 
        state.currentMode = document.getElementById('class-mode').value; 
        updatePresetDropdown(); 
        if (state.currentPreset !== 'none') {
            document.getElementById('class-preset').value = state.currentPreset;
            applyPreset();
        }
        updateSummary(); 
    };
    document.getElementById('class-preset').onchange = applyPreset;

    document.getElementById('close-inv').onclick = () => document.getElementById('inv-modal').classList.replace('flex', 'hidden');
    document.getElementById('save-inv').onclick = () => {
        document.querySelectorAll('.inv-input').forEach(input => { 
            state.inventory[input.dataset.feather] = parseInt(input.value) || 0; 
        });
        document.getElementById('inv-modal').classList.replace('flex', 'hidden'); 
        updateSummary();
    };

    // Global click handler for dynamic elements
    document.addEventListener('click', (e) => {
        const clearBtn = e.target.closest('.clear-set-btn');
        if (clearBtn) {
            if (confirm(`Clear all slots in ${clearBtn.dataset.set}?`)) {
                state.build[clearBtn.dataset.set].forEach(s => { s.feather = ''; s.tier = 1; });
                renderStatues(); updateSummary();
            }
        }
        else if (e.target.classList.contains('toggle-set-btn')) {
            const { set, type } = e.target.dataset; const idx = state.unlockedSets[type].indexOf(set);
            if (idx > -1) state.unlockedSets[type].splice(idx, 1); else state.unlockedSets[type].push(set);
            renderSetToggles(); renderStatues(); updateSummary();
        }
    });

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('base-stat-input')) {
            state.baseStats[e.target.dataset.stat] = parseInt(e.target.value) || 1;
            updateSummary();
        }
        else if (e.target.classList.contains('feather-select')) { 
            state.build[e.target.dataset.set][e.target.dataset.slot].feather = e.target.value; 
            renderStatues(); updateSummary(); 
        }
        else if (e.target.classList.contains('tier-select')) { 
            state.build[e.target.dataset.set][e.target.dataset.slot].tier = parseInt(e.target.value); 
            renderStatues(); updateSummary(); 
        }
        else if (e.target.classList.contains('set-tier-select')) { 
            state.build[e.target.dataset.set].forEach(slot => { slot.tier = parseInt(e.target.value); }); 
            renderStatues(); updateSummary(); 
        }
    });
}

window.onload = loadData;
