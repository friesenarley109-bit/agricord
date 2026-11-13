/**
 * Agricord - Core Logic & Data Management (v3.2.0)
 * Handles LocalStorage, Season Management, Blend Units, and Prescription Settings
 */

const DB_KEY = 'agricord_data';

function initDB() {
    let db = JSON.parse(localStorage.getItem(DB_KEY));
    if (!db || !db.seasons || !Array.isArray(db.seasons)) {
        const defaultSeasonId = generateId();
        db = {
            activeSeasonId: defaultSeasonId,
            seasons: [{
                id: defaultSeasonId,
                name: '2026',
                settings: {
                    growers: [], farms: [], fields: [], crops: [], seedBrands: [], 
                    seedVarieties: [], jobTypes: [], chemicalCategories: [], 
                    chemicals: [], units: [], fertilizers: []
                }
            }],
            plantings: [],
            applications: [],
            harvests: [],
            prescriptions: []
        };
        saveDB(db);
    }
}

function getDB() { return JSON.parse(localStorage.getItem(DB_KEY)); }
function saveDB(data) { localStorage.setItem(DB_KEY, JSON.stringify(data)); }
function generateId() { return '_' + Math.random().toString(36).substr(2, 9); }

function getActiveSeason() {
    const db = getDB();
    if (!db || !db.seasons || db.seasons.length === 0) return null;
    let season = db.seasons.find(s => s.id === db.activeSeasonId);
    if (!season) {
        season = db.seasons[0];
        db.activeSeasonId = season.id;
        saveDB(db);
    }
    return season;
}

function getSettings() {
    const season = getActiveSeason();
    return season ? season.settings : null;
}

function copySettingsToNewSeason(newName) {
    const db = getDB();
    const currentSeason = getActiveSeason();
    const copiedSettings = JSON.parse(JSON.stringify(currentSeason.settings));
    const newSeasonId = generateId();
    db.seasons.push({ id: newSeasonId, name: newName, settings: copiedSettings });
    db.activeSeasonId = newSeasonId;
    saveDB(db);
    location.reload();
}

function convertToGallons(amount, unit) {
    if (!amount || !unit) return 0;
    const u = unit.toLowerCase().trim();
    if (u.startsWith('qt') || u.includes('quart')) {
        return amount * 0.25;
    }
    return amount;
}

function deletePrescription(id) {
    if (confirm("Permanently delete this prescription template?")) {
        const db = getDB();
        db.prescriptions = db.prescriptions.filter(p => p.id !== id);
        saveDB(db);
        location.reload();
    }
}

function renamePrescription(id) {
    const db = getDB();
    const rx = db.prescriptions.find(p => p.id === id);
    if (!rx) return;
    const newName = prompt("Edit Prescription Name:", rx.name);
    if (newName && newName.trim() !== "") {
        rx.name = newName.trim();
        saveDB(db);
        location.reload();
    }
}

function populateSelect(selectId, items, placeholder = "Select...", valueKey = 'id', textKey = 'name') {
    const el = (typeof selectId === 'string') ? document.getElementById(selectId) : selectId;
    if (!el) return;
    el.innerHTML = `<option value="">${placeholder}</option>`;
    if (!items) return;
    items.forEach(item => {
        el.innerHTML += `<option value="${item[valueKey]}">${item[textKey]}</option>`;
    });
}

function calcAge(dateStr) {
    if (!dateStr) return 'N/A';
    const diff = new Date() - new Date(dateStr);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Future';
    return `${Math.floor(days / 7)}w ${days % 7}d`;
}

function setupRxModal(type, loadCallback) {
    const modal = document.getElementById('rxModal');
    const list = document.getElementById('rxModalList');
    if (!modal || !list) return;

    document.getElementById('btnOpenRx').addEventListener('click', () => {
        const db = getDB();
        const rxs = db.prescriptions.filter(p => p.seasonId === db.activeSeasonId && p.type === type);
        list.innerHTML = '';
        if (rxs.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-muted);">No prescriptions found.</p>';
        }
        rxs.forEach(rx => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-primary';
            btn.style = 'width:100%; margin-bottom:10px; text-align:left; padding: 12px; display:block;';
            btn.textContent = rx.name;
            btn.onclick = () => { loadCallback(rx.data); modal.style.display = 'none'; };
            list.appendChild(btn);
        });
        modal.style.display = 'flex';
    });

    document.getElementById('btnCloseRx').addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

initDB();