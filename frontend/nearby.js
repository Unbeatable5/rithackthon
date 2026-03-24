async function searchNearby() {
    const area = document.getElementById('areaInput').value.trim();
    const category = document.getElementById('categorySelect').value;
    const status = document.getElementById('statusFilter').value;
    
    if (!area) {
        alert("Please enter a locality or area.");
        return;
    }

    // document.getElementById('resultsArea').style.display = 'none'; // Don't hide existing results yet
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('emptyTitle').innerText = "Scanning " + area + "...";
    document.getElementById('emptyDesc').innerText = "Checking historical logs and real-time feeds.";

    try {
        const query = `area=${encodeURIComponent(area)}&category=${category}&status=${status}`;
        // Using apiClient for robustness
        const complaints = await apiClient.get(`/complaints/nearby?${query}`);

        if (Array.isArray(complaints) && complaints.length > 0) {
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('resultsArea').style.display = 'block';
            document.getElementById('resultsTitle').innerText = `Community reports near ${area}`;
            document.getElementById('resultCount').innerText = `${complaints.length} reports found`;
            
            renderCards(complaints);
        } else {
            document.getElementById('emptyState').style.display = 'block';
            document.getElementById('emptyTitle').innerText = "Clear Skies! No reports nearby.";
            document.getElementById('emptyDesc').innerText = `We couldn't find any matching active complaints in ${area}.`;
        }
    } catch (error) {
        console.error(error);
    }
}

function renderCards(complaints) {
    const grid = document.getElementById('complaintGrid');
    grid.innerHTML = complaints.map((c, i) => {
        const categoryIcon = getIcon(c.category);
        const supports = c.supportCount || 0;
        
        return `
            <div class="complaint-card" style="opacity:0; transform:translateY(20px); transition: all 0.4s ease; transition-delay: ${i * 50}ms">
                <div class="card-top">
                    <div class="cat-badge cat-${c.category}"><span class="material-icons-outlined">${categoryIcon}</span> ${c.category.toUpperCase()}</div>
                    <span class="status-chip chip-${c.status}">${c.status.replace('_',' ')}</span>
                </div>
                <h3>${c.title || 'Civic Issue'}</h3>
                <p class="card-address"><span class="material-icons-outlined">place</span> ${c.area}</p>
                <p class="card-desc">${c.description.slice(0, 120)}...</p>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0;">
                    <div style="display:flex; align-items:center; gap:8px; color:var(--sentinel-primary); font-weight:700;">
                        <span class="material-icons-outlined" style="font-size:20px;">volunteer_activism</span>
                        <span>${supports} Supports</span>
                    </div>
                    <button class="btn-support" onclick="supportIssue('${c.complaintId}')">
                        <span class="material-icons-outlined">add</span> Support Case
                    </button>
                </div>

                <div class="card-footer">
                    <span class="material-icons-outlined" style="font-size:14px; color:#94a3b8;">schedule</span>
                    <span class="date-text">Reported: ${new Date(c.submittedAt).toLocaleDateString()}</span>
                    <span class="priority-tag p-${c.priority}">${c.priority.toUpperCase()}</span>
                </div>
            </div>
        `;
    }).join('');

    setTimeout(() => {
        document.querySelectorAll('.complaint-card').forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    }, 50);
}

async function supportIssue(id) {
    try {
        const res = await apiClient.patch(`/complaints/${id}/support`);
        if (res.success) {
            // Re-search to refresh counts and potential priority escalation
            searchNearby();
        } else {
            alert("Support failed: " + (res.error || "Unknown error"));
        }
    } catch (err) {
        console.error(err);
    }
}

function getIcon(cat) {
    const icons = { water: 'water_drop', road: 'road', electrical: 'bolt', sanitation: 'delete_sweep' };
    return icons[cat] || 'info';
}

function useMyLocation() {
    const areaInput = document.getElementById('areaInput');
    areaInput.value = "Locating...";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            // Pre-fill a realistic area name for demo purposes since we search by text
            areaInput.value = "Civil Lines"; 
            searchNearby();
        }, () => {
            areaInput.value = "Location Access Denied";
        });
    }
}

// Auto-load nearby issues on page ready
window.addEventListener('DOMContentLoaded', () => {
    // If field is empty, pre-fill Civil Lines for the demo
    const areaInput = document.getElementById('areaInput');
    if (!areaInput.value) {
        areaInput.value = "Civil Lines";
    }
    searchNearby();
});
