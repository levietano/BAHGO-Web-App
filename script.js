// ==================== MOCK DATA - DELETE WHEN BACKEND READY ====================
const mockStations = [
    { id: 1, name: "Peach St. Corner A", level: 25, precip: 5.0, rate: 8, status: "warning", timestamp: "2026-04-09T08:00:00", history: [12, 14, 18, 20, 22, 25, 24, 25] },
    { id: 2, name: "Apple St. Corner A", level: 16, precip: 3.0, rate: 0, status: "safe", timestamp: "2026-04-09T08:00:00", history: [16, 16, 17, 16, 15, 16, 16, 16] },
    { id: 3, name: "Lime St. Corner B", level: 35, precip: 8.2, rate: 12, status: "critical", timestamp: "2026-04-09T08:00:00", history: [20, 23, 26, 28, 30, 32, 34, 35] },
    { id: 4, name: "Orange Ave. Main", level: 18, precip: 2.1, rate: 1, status: "safe", timestamp: "2026-04-09T08:00:00", history: [18, 18, 19, 18, 17, 18, 18, 18] }
];

async function apiGetStations() {
    return Promise.resolve(mockStations);
}

async function apiGetHistory(id) {
    const station = mockStations.find(s => s.id === id);
    return Promise.resolve({ history: station.history });
}
// ==================== END MOCK DATA ====================
let stations = [];
let stationChart = null;
// Backend developer: Edit this list to add/remove valid users and their passwords
const defaultUsers = [
    { email: 'admin@bahgo.com', password: 'admin123', name: 'Admin' },
    { email: 'kaye.01012@gmail.com', password: 'kaye123', name: 'Kaye' }
];

function getUser(email) {
    // Find the original email for this user
    let originalEmail = null;
    for (let user of defaultUsers) {
        const storedEmail = localStorage.getItem(`user_${user.email}_email`);
        if (storedEmail === email || user.email === email) {
            originalEmail = user.email;
            break;
        }
    }
    if (originalEmail) {
        const storedName = localStorage.getItem(`user_${originalEmail}_name`);
        const storedEmail = localStorage.getItem(`user_${originalEmail}_email`);
        const defaultUser = defaultUsers.find(u => u.email === originalEmail);
        return {
            email: storedEmail || defaultUser.email,
            password: defaultUser.password,
            name: storedName || defaultUser.name
        };
    }
    return null;
}

let currentUserEmail = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    document.getElementById('loginBtn').addEventListener('click', function() {
        console.log('Login clicked');
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPass').value;
        const emailErrorDiv = document.getElementById('emailError');
        const passwordErrorDiv = document.getElementById('passwordError');
        emailErrorDiv.style.display = 'none';
        passwordErrorDiv.style.display = 'none';
        
        if (!email) {
            emailErrorDiv.textContent = 'Please enter an email';
            emailErrorDiv.style.display = 'block';
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            emailErrorDiv.textContent = 'Please enter a valid email address';
            emailErrorDiv.style.display = 'block';
            return;
        }
        const user = getUser(email);
        if (!user) {
            emailErrorDiv.textContent = 'Email not recognized. Please contact support.';
            emailErrorDiv.style.display = 'block';
            return;
        }
        if (!password) {
            passwordErrorDiv.textContent = 'Please enter a password';
            passwordErrorDiv.style.display = 'block';
            return;
        }
        if (user.password !== password) {
            passwordErrorDiv.textContent = 'Incorrect password.';
            passwordErrorDiv.style.display = 'block';
            return;
        }
        // Successful login
        currentUserEmail = user.email;
        localStorage.setItem('bahgoUserName', user.name);
        localStorage.setItem('bahgoUserEmail', user.email);
        document.getElementById('userName').textContent = user.name;
        document.getElementById('settingsName').value = user.name;
        document.getElementById('settingsEmail').value = user.email;
        if (document.getElementById('rem').checked) {
            localStorage.setItem('bahgoEmail', email);
        }
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('dashboardScreen').classList.add('active');
        switchPage('overview');
        loadStations();
    });

    document.getElementById('logoutBtn').addEventListener('click', function() {
        currentUserEmail = null;
        document.getElementById('dashboardScreen').classList.remove('active');
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPass').value = '';
    });

    document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', function() {
            switchPage(this.dataset.page);
        });
    });

    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('stationModal').classList.remove('active');
    });

    document.getElementById('saveProfile').addEventListener('click', function() {
        const name = document.getElementById('settingsName').value;
        const email = document.getElementById('settingsEmail').value;
        if (currentUserEmail) {
            localStorage.setItem(`user_${currentUserEmail}_name`, name);
            localStorage.setItem(`user_${currentUserEmail}_email`, email);
            // Update current user email if changed
            if (email !== currentUserEmail) {
                currentUserEmail = email;
            }
        }
        localStorage.setItem('bahgoUserName', name);
        localStorage.setItem('bahgoUserEmail', email);
        document.getElementById('userName').textContent = name;
        alert('Profile saved!');
    });

    document.getElementById('saveNotif').addEventListener('click', function() {
        const prefs = {
            crit: document.getElementById('crit').checked,
            warn: document.getElementById('warn').checked,
            email: document.getElementById('email').checked
        };
        localStorage.setItem('bahgoNotif', JSON.stringify(prefs));
        alert('Preferences updated!');
    });

    document.getElementById('searchInput').addEventListener('input', function(e) {
        renderTable(e.target.value);
    });

    if (localStorage.getItem('bahgoEmail')) {
        document.getElementById('loginEmail').value = localStorage.getItem('bahgoEmail');
        document.getElementById('rem').checked = true;
    }
    if (localStorage.getItem('bahgoUserName')) {
        document.getElementById('userName').textContent = localStorage.getItem('bahgoUserName');
        document.getElementById('settingsName').value = localStorage.getItem('bahgoUserName');
    }
    if (localStorage.getItem('bahgoUserEmail')) {
        document.getElementById('settingsEmail').value = localStorage.getItem('bahgoUserEmail');
    }
    if (localStorage.getItem('bahgoNotif')) {
        const prefs = JSON.parse(localStorage.getItem('bahgoNotif'));
        document.getElementById('crit').checked = prefs.crit;
        document.getElementById('warn').checked = prefs.warn;
        document.getElementById('email').checked = prefs.email;
    }

    updateClock();
    setInterval(updateClock, 1000);
});

function switchPage(pageId) {
    document.querySelectorAll('.nav-btn[data-page]').forEach(btn => btn.classList.toggle('active', btn.dataset.page === pageId));
    document.querySelectorAll('.page-content').forEach(page => page.classList.toggle('active', page.id === pageId));
}

function updateCounts() {
    document.getElementById('criticalCount').textContent = stations.filter(s => s.status === 'critical').length;
    document.getElementById('warningCount').textContent = stations.filter(s => s.status === 'warning').length;
    document.getElementById('normalCount').textContent = stations.filter(s => s.status === 'safe').length;
    document.getElementById('activeCount').textContent = stations.length;
    document.getElementById('offlineCount').textContent = 0;
}

function renderStations() {
    const grid = document.getElementById('stationGrid');
    grid.innerHTML = stations.map(s => `
        <div class="station-card" onclick="openStationModal(${s.id})">
            <div class="s-header">
                <div>
                    <h3>${s.name}</h3>
                    <p style="font-size: 0.75rem; color: #888;">${new Date(s.timestamp).toLocaleString()}</p>
                </div>
                <span class="dot ${s.status === 'safe' ? 'green' : s.status === 'warning' ? 'yellow' : 'red'}"></span>
            </div>
            <div class="s-stats">
                <div class="s-row"><span>Water Level:</span><span class="val">${s.level} cm</span></div>
                <div class="s-row"><span>Precipitation:</span><span class="val">${s.precip} mm/hr</span></div>
                <div class="s-row"><span>Rise Rate:</span><span class="val">${s.rate} cm/hr</span></div>
            </div>
            <div class="s-label ${s.status}">${s.status.toUpperCase()}</div>
        </div>
    `).join('');
}

function renderTable(filter = '') {
    const tbody = document.getElementById('stationTableBody');
    const filtered = stations.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()));
    tbody.innerHTML = filtered.map(s => `
        <tr onclick="openStationModal(${s.id})">
            <td>${s.name}</td>
            <td>${s.level} cm</td>
            <td>${s.precip} mm/hr</td>
            <td>${s.rate} cm/hr</td>
            <td>${new Date(s.timestamp).toLocaleString()}</td>
            <td><span class="status-badge ${s.status}">${s.status.toUpperCase()}</span></td>
        </tr>
    `).join('');
}

window.openStationModal = async function(id) {
    const s = stations.find(st => st.id === id);
    document.getElementById('modalTitle').textContent = s.name;
    document.getElementById('modalBody').innerHTML = `
        <div class="s-stats">
            <div class="s-row"><span>Current Water Level:</span><span class="val">${s.level} cm</span></div>
            <div class="s-row"><span>Precipitation:</span><span class="val">${s.precip} mm/hr</span></div>
            <div class="s-row"><span>Rise Rate:</span><span class="val">${s.rate} cm/hr</span></div>
            <div class="s-row"><span>Status:</span><span class="val">${s.status.toUpperCase()}</span></div>
            <div class="s-row"><span>Last Updated:</span><span class="val">${new Date(s.timestamp).toLocaleString()}</span></div>
        </div>
        <p style="margin-top: 20px; font-weight: 600; color: var(--text-muted);">24-Hour Water Level Trend</p>
    `;
    
    document.getElementById('stationModal').classList.add('active');
    
    const { history } = await apiGetHistory(id);
    
    if (stationChart) stationChart.destroy();
    
    const ctx = document.getElementById('stationChart').getContext('2d');
    const hours = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'];
    stationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'Water Level (cm)',
                data: history,
                borderColor: s.status === 'critical' ? '#EF4444' : s.status === 'warning' ? '#F59E0B' : '#22C55E',
                backgroundColor: s.status === 'critical' ? 'rgba(239, 68, 68, 0.1)' : s.status === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateClock() {
    const now = new Date();
    const dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    document.getElementById('currentDate').innerText = now.toLocaleDateString('en-US', dateOptions);
    document.getElementById('currentTime').innerText = now.toLocaleTimeString('en-US', timeOptions).toLowerCase();
}

async function loadStations() {
    stations = await apiGetStations();
    renderStations();
    renderTable();
    updateCounts();
}