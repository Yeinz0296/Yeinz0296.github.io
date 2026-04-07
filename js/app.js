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
    currentPreset: 'none', currentMode: 'pve'
};

const STAT_NAMES = {
    'patk_matk': 'PATK/MATK', 'pdef': 'PDEF', 'mdef': 'MDEF', 'max_hp': 'Max HP',
    'pve_dmg_bonus': 'PvE DMG Bonus', 'pve_dmg_reduction': 'PvE DMG Reduction',
    'pvp_dmg_bonus': 'PvP DMG Bonus', 'pvp_dmg_reduction': 'PvP DMG Reduction',
    'ignore_pdef': 'Ignore PDEF', 'ignore_mdef': 'Ignore MDEF',
    'vit': 'VIT', 'str': 'STR', 'int': 'INT', 'dex': 'DEX',
    'atk_stat_percent': 'Atk Stat %', 'def_stat_percent': 'Def Stat %',
    'pve_stat_percent': 'PvE Stat %', 'pvp_stat_percent': 'PvP Stat %'
};

function parseNumber(str) { if (!str || str === '') return 0; return parseFloat(str.toString().replace(/,/g, '')) || 0; }

function initBuildState() {
    [...state.sets.atk, ...state.sets.def].forEach(setName => {
        state.build[setName] = [{ feather: '', tier: 1 }, { feather: '', tier: 1 }, { feather: '', tier: 1 }, { feather: '', tier: 1 }, { feather: '', tier: 1 }];
    });
}

function saveToLocal() {
    const data = { build: state.build, unlockedSets: state.unlockedSets, preset: state.currentPreset, mode: state.currentMode, inventory: state.inventory };
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
            return true;
        } catch (e) { return false; }
    }
    return false;
}

function generateShareUrl() {
    const data = { b: state.build, u: state.unlockedSets, p: state.currentPreset, m: state.currentMode, i: state.inventory };
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
            window.location.hash = ''; return true;
        } catch (e) { return false; }
    }
    return false;
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

        updatePresetDropdown();
        renderApp();
        
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('tab-feather').classList.remove('hidden');
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
        const color = isUnlocked ? (type === 'atk' ? 'bg-red-500 text-white border-red-500' : 'bg-blue-500 text-white border-blue-500') : 'bg-white text-gray-500 border-gray-300';
        return `<button class="px-3 py-1 border rounded text-[10px] font-bold uppercase toggle-set-btn ${color}" data-set="${setName}" data-type="${type}">${setName}</button>`;
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
        <div class="ro-window ${type === 'atk' ? 'ro-window-atk' : 'ro-window-def'} overflow-hidden mb-6">
            <div class="ro-header ${type === 'atk' ? 'ro-header-atk' : 'ro-header-def'} flex justify-between items-center">
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-bold uppercase tracking-wider" id="set-title-${setName}">${setName}</span>
                    <select class="text-[10px] bg-white/20 text-white border border-white/30 rounded px-1 py-0.5 set-tier-select focus:outline-none hover:bg-white/30 cursor-pointer" data-set="${setName}">
                        ${[...Array(20).keys()].map(t => `<option value="${t+1}" ${currentMinTier == t+1 ? 'selected' : ''} class="text-slate-800">T${t+1}</option>`).join('')}
                    </select>
                </div>
                <div class="flex items-center space-x-4">
                    <span id="set-eden-${setName}" class="text-[10px] font-bold text-white opacity-90 uppercase">0 EDEN</span>
                    <button class="clear-set-btn text-white hover:text-ro-accent transition-colors" data-set="${setName}"><i class="fas fa-undo-alt text-xs"></i></button>
                </div>
            </div>
            <div class="p-4 grid grid-cols-1 sm:grid-cols-5 gap-4">`;

        for (let i = 0; i < 5; i++) {
            const slot = state.build[setName][i];
            const rarity = slot.feather ? state.featherRarities[slot.feather] : '';
            const rarityClass = rarity === 'gold' ? 'ro-slot-gold' : (rarity === 'purple' ? 'ro-slot-purple' : '');
            html += `
                <div class="ro-slot p-3 ${rarityClass}">
                    <label class="ro-label block mb-1">Slot ${i + 1}</label>
                    <select class="w-full text-[10px] border-ro-border rounded bg-white py-1 px-1 mb-2 feather-select font-bold" data-set="${setName}" data-slot="${i}">
                        <option value="">-- Empty --</option>
                        ${availableFeathers.map(f => {
                            if (selectedInSet.includes(f) && slot.feather !== f) return '';
                            const selected = slot.feather === f ? 'selected' : '';
                            const rarityIcon = state.featherRarities[f] === 'gold' ? '🟡 ' : '🟣 ';
                            return `<option value="${f}" ${selected}>${rarityIcon}${f}</option>`;
                        }).join('')}
                    </select>
                    <label class="ro-label block mb-1">Tier</label>
                    <select class="w-full text-[10px] border-ro-border rounded bg-white py-1 px-1 tier-select" data-set="${setName}" data-slot="${i}">
                        ${[...Array(20).keys()].map(t => `<option value="${t+1}" ${slot.tier == t+1 ? 'selected' : ''}>T${t+1}</option>`).join('')}
                    </select>
                </div>`;
        }
        html += `</div>
            <div class="px-4 py-3 bg-slate-50 border-t flex flex-col space-y-2">
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500 uppercase font-bold" id="set-feathers-${setName}"></div>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ro-blue font-bold border-t pt-2" id="set-stats-${setName}"></div>
            </div>
        </div>`;
        return html;
    };
    state.sets.order.forEach(set => container.innerHTML += renderSet(set.name, set.type));
}

function updateSummary() {
    let totalStats = {}, totalEden = 0, totalFeatherCosts = {};
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
                bText = `(${best.set_name.replace(/_/g, ' ').toUpperCase()} T${minT}${est ? '*' : ''})`;
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
                bText = next ? `(NEED ${Math.max(0, parseNumber(next.req_gold)-goldCount)} GOLD / ${Math.max(0, parseNumber(next.req_purple)-purpleCount)} PURPLE)` : '(NO BONUS)';
            }
        } else { bText = '(INCOMPLETE)'; }
        titleEl.innerText = `${setName} ${bText}`;

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

        feathersDisplayEl.innerHTML = 'Base: ' + Object.entries(baseFeatherStats).filter(([k,v]) => v > 0).map(([k,v]) => `${STAT_NAMES[k]}: ${v.toFixed(1)}`).join(' | ');
        statsDisplayEl.innerHTML = 'Final: ' + Object.entries(finalSetStats).filter(([k,v]) => Math.floor(v) > 0).map(([k,v]) => `<span>${STAT_NAMES[k]}: ${Math.floor(v)}</span>`).join(' | ');
        edenEl.innerText = `${setEden.toLocaleString()} EDEN`;
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
        summaryContainer.innerHTML += `<div class="flex justify-between items-center py-1 ${isPrio ? 'bg-yellow-50 px-2 rounded font-semibold text-yellow-800' : 'text-gray-700'}"><span>${STAT_NAMES[statKey] || statKey} ${isPrio ? '<i class="fas fa-star text-[10px]"></i>' : ''}</span><span>${Math.floor(value)}</span></div>`;
    });
    
    document.getElementById('total-eden').innerText = totalEden.toLocaleString();
    const costBreakdownEl = document.getElementById('cost-breakdown');
    costBreakdownEl.innerHTML = '<div class="font-bold text-gray-700 mb-2 uppercase tracking-tight text-xs border-b pb-1">Still Needed:</div>';
    let hasCost = false;
    Object.entries(totalFeatherCosts).sort((a,b) => b[1].count - a[1].count).forEach(([name, data]) => {
        const owned = state.inventory[name] || 0;
        const needed = Math.max(0, data.count - owned);
        if (needed <= 0 && data.count > 0) return; 
        hasCost = true;
        const rangeText = data.maxReached < data.requested ? ` <span class="text-[10px] text-gray-400">(T1-T${data.maxReached})</span>` : '';
        costBreakdownEl.innerHTML += `<div class="flex justify-between items-center py-1 text-sm"><span class="${state.featherRarities[name] === 'gold' ? 'text-yellow-600' : 'text-purple-600'} font-bold">${name}${rangeText}:</span><span class="font-bold text-slate-800">${needed.toLocaleString()}</span></div>`;
    });
    if (!hasCost) costBreakdownEl.innerHTML += '<p class="text-xs italic text-gray-400">All owned!</p>';
    saveToLocal();
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
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault(); if(btn.classList.contains('cursor-not-allowed')) return;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden')); document.getElementById(btn.dataset.target).classList.remove('hidden');
        };
    });

    document.getElementById('clear-all-btn').onclick = () => { if (confirm('Clear all?')) { initBuildState(); document.getElementById('class-preset').value = 'none'; state.currentPreset = 'none'; renderStatues(); updateSummary(); } };
    document.getElementById('share-btn').onclick = generateShareUrl;
    document.getElementById('print-btn').onclick = () => window.print();
    document.getElementById('optimize-btn').onclick = () => {
        if (state.currentPreset === 'none') { alert("Please select a Class Build first."); return; }
        applyPreset();
        alert("Build optimized based on Class and Mode!");
    };

    document.getElementById('class-mode').onchange = () => { 
        state.currentMode = document.getElementById('class-mode').value; 
        updatePresetDropdown(); 
        // Auto-reapply preset if a class is already selected
        if (state.currentPreset !== 'none') {
            document.getElementById('class-preset').value = state.currentPreset;
            applyPreset();
        }
        updateSummary(); 
    };
    document.getElementById('class-preset').onchange = applyPreset;

    document.getElementById('inv-btn').onclick = () => {
        const container = document.getElementById('inv-inputs');
        const feathers = [...new Set([...state.uniqueFeathers.atk, ...state.uniqueFeathers.def, ...state.uniqueFeathers.mix])].sort();
        container.innerHTML = feathers.map(f => `
            <div class="flex flex-col">
                <label class="text-[10px] font-bold uppercase ${state.featherRarities[f] === 'gold' ? 'text-yellow-600' : 'text-purple-600'}">${f}</label>
                <input type="number" class="border rounded px-2 py-1 text-sm inv-input" data-feather="${f}" value="${state.inventory[f] || 0}" min="0">
            </div>`).join('');
        document.getElementById('inv-modal').classList.remove('hidden'); document.getElementById('inv-modal').classList.add('flex');
    };
    document.getElementById('close-inv').onclick = () => document.getElementById('inv-modal').classList.replace('flex', 'hidden');
    document.getElementById('save-inv').onclick = () => {
        document.querySelectorAll('.inv-input').forEach(input => { state.inventory[input.dataset.feather] = parseInt(input.value) || 0; });
        document.getElementById('inv-modal').classList.replace('flex', 'hidden'); updateSummary();
    };

    document.onclick = (e) => {
        if (e.target.closest('.clear-set-btn')) { state.build[e.target.closest('.clear-set-btn').dataset.set].forEach(s => { s.feather = ''; s.tier = 1; }); renderStatues(); updateSummary(); }
        else if (e.target.classList.contains('toggle-set-btn')) {
            const { set, type } = e.target.dataset; const idx = state.unlockedSets[type].indexOf(set);
            if (idx > -1) state.unlockedSets[type].splice(idx, 1); else state.unlockedSets[type].push(set);
            renderSetToggles(); renderStatues(); updateSummary();
        }
    };

    document.onchange = (e) => {
        if (e.target.classList.contains('feather-select')) { state.build[e.target.dataset.set][e.target.dataset.slot].feather = e.target.value; renderStatues(); updateSummary(); }
        else if (e.target.classList.contains('tier-select')) { state.build[e.target.dataset.set][e.target.dataset.slot].tier = parseInt(e.target.value); renderStatues(); updateSummary(); }
        else if (e.target.classList.contains('set-tier-select')) { state.build[e.target.dataset.set].forEach(slot => { slot.tier = parseInt(e.target.value); }); renderStatues(); updateSummary(); }
    };
}
window.onload = loadData;
