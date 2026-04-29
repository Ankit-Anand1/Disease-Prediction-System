let trendChartInstance = null;
let breakdownChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser')) || { email: 'guest', name: 'Guest' };
    const history = JSON.parse(localStorage.getItem(`history_${user.email}`) || '[]');
    
    // Fill Edit Profile Modal
    document.getElementById('editName').value = user.name;

    if (history.length === 0) {
        document.getElementById('emptyState').classList.remove('hidden');
        return;
    }

    document.getElementById('dashboardContent').classList.remove('hidden');

    window.renderDashboard();
    
    // 5. Rotating Health Tips Feed
    const tips = [
        "Daily Tip: Staying hydrated can reduce blood pressure and improve overall heart function.",
        "Daily Tip: A 30-minute brisk walk daily lowers the risk of Type 2 Diabetes by 30%.",
        "Daily Tip: Avoid processed foods high in sodium to maintain a healthy cardiovascular system.",
        "Daily Tip: Quality sleep (7-8 hours) is crucial for regulating blood glucose levels.",
        "Daily Tip: Eating fiber-rich foods helps prevent blood sugar spikes after meals."
    ];
    let tipIdx = 0;
    const tipsFeed = document.getElementById('tipsFeed');
    if (tipsFeed) {
        setInterval(() => {
            tipIdx = (tipIdx + 1) % tips.length;
            tipsFeed.textContent = tips[tipIdx];
        }, 10000); 
    }
});

// Click outside to close dropdowns
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});

window.renderDashboard = function() {
    const user = JSON.parse(localStorage.getItem('currentUser')) || { email: 'guest', name: 'Guest' };
    const rawHistory = JSON.parse(localStorage.getItem(`history_${user.email}`) || '[]');
    if (rawHistory.length === 0) {
        document.getElementById('dashboardContent').classList.add('hidden');
        document.getElementById('emptyState').classList.remove('hidden');
        return;
    }
    
    // Time filter for charts
    const timeFilter = document.getElementById('timeFilter') ? document.getElementById('timeFilter').value : 'all';
    let chartHistory = rawHistory;
    if (timeFilter !== 'all') {
        const days = parseInt(timeFilter);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        chartHistory = rawHistory.filter(h => new Date(h.timestamp) >= cutoff);
    }
    if (chartHistory.length === 0) chartHistory = rawHistory; // Fallback if filter is empty

    // 1. Stats & Health Score (always use full history for stats)
    document.getElementById('statTotal').textContent = rawHistory.length;
    const highRiskCount = rawHistory.filter(h => parseFloat(h.risk_prob) >= 70).length;
    document.getElementById('statHighRisk').textContent = highRiskCount;
    
    const totalRisk = rawHistory.reduce((sum, h) => sum + parseFloat(h.risk_prob), 0);
    const avgRisk = totalRisk / rawHistory.length;
    const healthScore = Math.max(0, 100 - avgRisk).toFixed(0);
    document.getElementById('statHealthScore').textContent = healthScore;

    const badge = document.getElementById('healthBadge');
    if (healthScore > 80) { badge.textContent = "Healthy"; badge.style.color = "#10B981"; badge.style.background = "#ECFDF5"; badge.style.borderColor = "#A7F3D0"; }
    else if (healthScore > 50) { badge.textContent = "Moderate"; badge.style.color = "#F59E0B"; badge.style.background = "#FFFBEB"; badge.style.borderColor = "#FDE68A"; }
    else { badge.textContent = "High Risk"; badge.style.color = "#EF4444"; badge.style.background = "#FEF2F2"; badge.style.borderColor = "#FECACA"; }

    // AI Insight
    const latest = rawHistory[0];
    const insightEl = document.getElementById('smartInsight');
    const textEl = document.getElementById('insightText');
    insightEl.style.display = 'block';
    
    if (latest.type === 'diabetes' && latest.factors) {
        const glucose = latest.factors.find(f => f.label.toLowerCase().includes('glucose'));
        if (glucose && glucose.value >= 70) {
            textEl.textContent = "Your latest glucose levels are elevated. Please monitor your sugar intake.";
            insightEl.style.borderLeftColor = '#EF4444';
        } else {
            textEl.textContent = "Your latest diabetes metrics look stable. Keep up the good work!";
            insightEl.style.background = '#ECFDF5'; insightEl.style.borderLeftColor = '#10B981';
        }
    } else if (parseFloat(latest.risk_prob) >= 70) {
        textEl.textContent = "Your recent assessment indicates high risk. Consider scheduling a checkup soon.";
        insightEl.style.background = '#FEF2F2'; insightEl.style.borderLeftColor = '#EF4444';
    } else {
        textEl.textContent = "Overall health trends are positive based on your latest inputs.";
        insightEl.style.background = '#ECFDF5'; insightEl.style.borderLeftColor = '#10B981';
    }
    
    // Mini Insights Grid
    const grid = document.getElementById('miniInsightsGrid');
    if (latest.factors && latest.factors.length >= 3) {
        grid.innerHTML = latest.factors.slice(0, 3).map(f => {
            let color = f.value >= 70 ? '#EF4444' : (f.value >= 40 ? '#F59E0B' : '#10B981');
            let text = f.value >= 70 ? `${f.label} is heavily elevated` : (f.value >= 40 ? `${f.label} is slightly elevated` : `${f.label} is stable`);
            return `
            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1.25rem; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <div style="font-size: 0.85rem; color: #64748B; font-weight: 600; margin-bottom: 0.25rem;">${f.label}</div>
                <div style="font-size: 1.1rem; font-weight: 800; color: ${color};">${text}</div>
            </div>`;
        }).join('');
    }

    window.renderHistory();

    // 3. Modern Neon-Style Trend Chart
    Chart.defaults.font.family = "'Outfit', sans-serif";
    const chronological = [...chartHistory].reverse();
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    
    if (trendChartInstance) trendChartInstance.destroy();
    
    const gradient = trendCtx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)'); // Vivid Purple
    gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

    const dataPoints = chronological.map(h => parseFloat(h.risk_prob));
    const pointColors = dataPoints.map(val => val >= 70 ? '#EF4444' : val >= 30 ? '#F59E0B' : '#10B981');

    trendChartInstance = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: chronological.map(h => new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Risk Score %',
                data: dataPoints,
                borderColor: '#8B5CF6', 
                backgroundColor: gradient, 
                borderWidth: 4,
                pointBackgroundColor: pointColors, 
                pointBorderColor: '#FFFFFF', 
                pointBorderWidth: 3, 
                pointRadius: 6, 
                pointHoverRadius: 9,
                pointHoverBackgroundColor: pointColors,
                pointHoverBorderColor: '#FFFFFF',
                pointHoverBorderWidth: 4,
                fill: true, 
                tension: 0.45,
                clip: false
            }]
        },
        options: {
            responsive: true, 
            maintainAspectRatio: false,
            layout: { padding: { top: 20, right: 10, bottom: 10, left: 10 } },
            plugins: { 
                legend: { display: false }, 
                tooltip: { 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { size: 13, family: "'Outfit', sans-serif", weight: '600' },
                    bodyFont: { size: 14, family: "'Outfit', sans-serif", weight: '700' },
                    padding: 12, 
                    cornerRadius: 12,
                    displayColors: false,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) { return 'Risk Score: ' + context.parsed.y + '%'; }
                    }
                } 
            },
            scales: { 
                y: { 
                    beginAtZero: true, 
                    max: 105, 
                    border: { display: false }, 
                    grid: { color: 'rgba(226, 232, 240, 0.6)', drawTicks: false },
                    ticks: { padding: 10, color: '#64748B', font: { size: 11, weight: '600' }, stepSize: 20 }
                }, 
                x: { 
                    border: { display: false }, 
                    grid: { display: false },
                    ticks: { color: '#64748B', font: { size: 11, weight: '600' } }
                } 
            },
            interaction: { mode: 'index', intersect: false }
        }
    });

    // 4. Donut Chart
    const cLow = chartHistory.filter(h => parseFloat(h.risk_prob) < 30).length;
    const cMed = chartHistory.filter(h => parseFloat(h.risk_prob) >= 30 && parseFloat(h.risk_prob) < 70).length;
    const cHigh = chartHistory.filter(h => parseFloat(h.risk_prob) >= 70).length;

    if (breakdownChartInstance) breakdownChartInstance.destroy();
    breakdownChartInstance = new Chart(document.getElementById('breakdownChart'), {
        type: 'doughnut',
        data: {
            labels: ['Low Risk', 'Medium Risk', 'High Risk'],
            datasets: [{
                data: [cLow, cMed, cHigh],
                backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                borderWidth: 0, hoverOffset: 5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '75%',
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } },
            animation: { animateScale: true, animateRotate: true }
        }
    });
};

window.renderHistory = function() {
    const user = JSON.parse(localStorage.getItem('currentUser')) || { email: 'guest' };
    const rawHistory = JSON.parse(localStorage.getItem(`history_${user.email}`) || '[]');
    const filter = document.getElementById('historyFilter') ? document.getElementById('historyFilter').value : 'all';
    const history = filter === 'all' ? rawHistory : rawHistory.filter(h => h.type === filter);
    
    const tbody = document.getElementById('historyBody');
    if (history.length === 0) {
        tbody.innerHTML = `<div style="text-align:center; padding: 2rem; color:#64748B;">No tests found for this category.</div>`;
        return;
    }
    
    tbody.innerHTML = history.map((item) => {
        const rawIndex = rawHistory.indexOf(item);
        const date = new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const typeHtml = item.type === 'diabetes' ? `<span style="color:#6366F1"><i class="fa-solid fa-vial"></i> Diabetes Test</span>` : `<span style="color:#EC4899"><i class="fa-solid fa-heart-pulse"></i> Heart Test</span>`;
        const riskVal = parseFloat(item.risk_prob);
        let status = riskVal >= 70 ? ['#EF4444', 'High Risk', '#FEF2F2'] : riskVal >= 30 ? ['#F59E0B', 'Moderate', '#FFFBEB'] : ['#10B981', 'Low Risk', '#ECFDF5'];
        
        return `
            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="display:flex; flex-direction:column; gap:0.25rem;">
                    <div style="font-size: 1.05rem; font-weight: 700; color: #0F172A; display:flex; align-items:center; gap:0.5rem;">
                        <div style="width:10px; height:10px; border-radius:50%; background:${status[0]};"></div>
                        ${typeHtml}
                    </div>
                    <div style="color: #64748B; font-size: 0.85rem;">${date} • <span style="font-weight:700; color:#0F172A;">${riskVal.toFixed(1)}%</span> <span style="font-size:0.75rem; padding:0.15rem 0.5rem; background:${status[2]}; color:${status[0]}; border-radius:99px; margin-left:0.25rem;">${status[1]}</span></div>
                </div>
                <div class="dropdown" style="position:relative;">
                    <button class="btn btn-ghost" onclick="toggleDropdown(event, ${rawIndex})" style="padding:0.5rem; background:none; border:none; cursor:pointer; color:#64748B;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                    <div id="dropdown-${rawIndex}" class="dropdown-menu hidden" style="position:absolute; right:0; top:100%; background:white; border:1px solid #E2E8F0; border-radius:8px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); z-index:10; min-width:140px; display:none; overflow:hidden;">
                        <button onclick="viewReport(${rawIndex})" style="width:100%; padding:0.6rem 1rem; text-align:left; background:none; border:none; cursor:pointer; font-size:0.85rem; color:#0F172A; border-bottom:1px solid #F1F5F9;"><i class="fa-solid fa-eye" style="width:20px; color:#64748B;"></i> View Report</button>
                        <button onclick="downloadReport(${rawIndex})" style="width:100%; padding:0.6rem 1rem; text-align:left; background:none; border:none; cursor:pointer; font-size:0.85rem; color:#0F172A; border-bottom:1px solid #F1F5F9;"><i class="fa-solid fa-download" style="width:20px; color:#64748B;"></i> Download</button>
                        <button onclick="showDeleteModal(${rawIndex})" style="width:100%; padding:0.6rem 1rem; text-align:left; background:none; border:none; color:#EF4444; cursor:pointer; font-size:0.85rem;"><i class="fa-solid fa-trash" style="width:20px;"></i> Delete</button>
                    </div>
                </div>
            </div>`;
    }).join('');
};

window.toggleDropdown = function(event, index) {
    event.stopPropagation();
    const allMenus = document.querySelectorAll('.dropdown-menu');
    const targetMenu = document.getElementById(`dropdown-${index}`);
    const isVisible = targetMenu.style.display === 'block';
    
    allMenus.forEach(menu => menu.style.display = 'none'); // Close others
    
    if (!isVisible) {
        targetMenu.style.display = 'block';
    }
};

let deleteTargetIndex = -1;
let deletedRecord = null;
let deleteTimeout = null;

window.showDeleteModal = function(index) {
    deleteTargetIndex = index;
    document.getElementById('deleteModal').classList.add('active');
    document.querySelectorAll('.dropdown-menu').forEach(menu => menu.style.display = 'none');
};

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (deleteTargetIndex === -1) return;
    
    const user = JSON.parse(localStorage.getItem('currentUser')) || { email: 'guest' };
    const historyKey = `history_${user.email}`;
    let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    deletedRecord = { index: deleteTargetIndex, data: history[deleteTargetIndex] };
    history.splice(deleteTargetIndex, 1);
    localStorage.setItem(historyKey, JSON.stringify(history));
    
    document.getElementById('deleteModal').classList.remove('active');
    
    window.renderDashboard();
    
    const toast = document.getElementById('toast');
    toast.style.bottom = '20px';
    
    if (deleteTimeout) clearTimeout(deleteTimeout);
    deleteTimeout = setTimeout(() => {
        toast.style.bottom = '-100px';
        deletedRecord = null; // Cannot undo anymore
    }, 5000);
});

document.getElementById('undoBtn').addEventListener('click', () => {
    if (!deletedRecord) return;
    
    const user = JSON.parse(localStorage.getItem('currentUser')) || { email: 'guest' };
    const historyKey = `history_${user.email}`;
    let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    history.splice(deletedRecord.index, 0, deletedRecord.data);
    localStorage.setItem(historyKey, JSON.stringify(history));
    
    document.getElementById('toast').style.bottom = '-100px';
    deletedRecord = null;
    if (deleteTimeout) clearTimeout(deleteTimeout);
    
    window.renderDashboard();
});

window.viewReport = function(index) {
    const user = JSON.parse(localStorage.getItem('currentUser')) || { email: 'guest' };
    const history = JSON.parse(localStorage.getItem(`history_${user.email}`) || '[]');
    localStorage.setItem('predictionResult', JSON.stringify(history[index]));
    window.location.href = 'result.html';
};

window.downloadReport = function(index) {
    // Navigate to result and trigger PDF download automatically
    const user = JSON.parse(localStorage.getItem('currentUser')) || { email: 'guest' };
    const history = JSON.parse(localStorage.getItem(`history_${user.email}`) || '[]');
    if (history.length === 0) return;
    localStorage.setItem('predictionResult', JSON.stringify(history[index]));
    // Small hack: set a flag to auto-download on result page
    localStorage.setItem('autoDownloadPdf', 'true');
    window.location.href = 'result.html';
};

window.saveProfile = function() {
    const newName = document.getElementById('editName').value.trim();
    if (newName) {
        let user = JSON.parse(localStorage.getItem('currentUser'));
        if (user) {
            user.name = newName;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            let users = JSON.parse(localStorage.getItem('medUsers') || '{}');
            if (users[user.email]) {
                users[user.email].name = newName;
                localStorage.setItem('medUsers', JSON.stringify(users));
            }
            window.location.reload();
        }
    }
};

window.logout = function() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
};

window.toggleCoach = function(cb) {
    const isCoach = cb.checked;
    if (isCoach) {
        document.getElementById('tipsFeed').innerText = "AI Coach: I'll be tracking your metrics daily. Let's start by reducing your top risk factor this week!";
        document.getElementById('tipsFeed').style.color = "#8B5CF6";
        document.getElementById('tipsFeed').parentElement.style.borderLeft = "4px solid #8B5CF6";
    } else {
        document.getElementById('tipsFeed').innerText = "Daily Tip: Staying hydrated can reduce blood pressure and improve overall heart function.";
        document.getElementById('tipsFeed').style.color = "#475569";
        document.getElementById('tipsFeed').parentElement.style.borderLeft = "1px solid #E2E8F0";
    }
};

window.showImproveModal = function() {
    const user = JSON.parse(localStorage.getItem('currentUser')) || { email: 'guest' };
    const history = JSON.parse(localStorage.getItem(`history_${user.email}`) || '[]');
    
    let actions = [
        { icon: '<i class="fa-solid fa-shoe-prints" style="color: #10B981;"></i>', title: "10k Steps Challenge", desc: "Start walking 10,000 steps daily to improve cardiovascular health." },
        { icon: '<i class="fa-solid fa-apple-whole" style="color: #EF4444;"></i>', title: "Sugar Detox", desc: "Cut out refined sugars for 7 days to stabilize glucose levels." },
        { icon: '<i class="fa-solid fa-bed" style="color: #6366F1;"></i>', title: "Sleep Optimization", desc: "Get 8 hours of sleep to reduce stress hormones and lower BP." }
    ];
    
    if (history.length > 0) {
        const latest = history[0];
        if (latest.type === 'diabetes') {
            actions[0] = { icon: '<i class="fa-solid fa-bowl-food" style="color: #F59E0B;"></i>', title: "Low Glycemic Diet", desc: "Swap white rice/bread for quinoa and oats." };
        } else {
            actions[0] = { icon: '<i class="fa-solid fa-heart-pulse" style="color: #EC4899;"></i>', title: "Zone 2 Cardio", desc: "Do 30 mins of light jogging to strengthen heart muscle." };
        }
    }
    
    document.getElementById('actionPlanList').innerHTML = actions.map(a => `
        <div style="display: flex; gap: 1rem; align-items: flex-start; padding: 1rem; background: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0;">
            <div style="font-size: 1.5rem; background: white; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">${a.icon}</div>
            <div>
                <h4 style="font-size: 1.05rem; color: #0F172A; margin-bottom: 0.25rem;">${a.title}</h4>
                <p style="font-size: 0.85rem; color: #64748B;">${a.desc}</p>
            </div>
        </div>
    `).join('');
    
    document.getElementById('improveModal').classList.add('active');
};
