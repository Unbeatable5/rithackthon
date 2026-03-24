async function checkStatus(paramId = null) {
    const idInput = document.getElementById("complaintId");
    const id = paramId || idInput.value.trim();
    if (!id) {
        alert("Please enter a Complaint ID");
        return;
    }

    const token = localStorage.getItem("token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    const url = token ? `http://localhost:5000/api/complaints/${id}` : `http://localhost:5000/api/complaints/track/${id}`;

    try {
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
            alert("Complaint ID not found or Access Denied");
            return;
        }

        const c = await response.json();

        // Reveal and reset
        const card = document.getElementById("resultCard");
        card.style.display = "block";
        card.scrollIntoView({ behavior: 'smooth' });

        // Basic Data
        document.getElementById("f-id").textContent = c.complaintId.toUpperCase();
        document.getElementById("f-priority").textContent = c.priority.toUpperCase();
        document.getElementById("f-title").textContent = c.title || "Civic Issue";
        document.getElementById("f-category").textContent = c.category.toUpperCase();
        document.getElementById("f-area").textContent = c.area || "City Wide";
        document.getElementById("f-date").textContent = new Date(c.submittedAt).toLocaleDateString();
        document.getElementById("f-deadline").textContent = c.deadline ? new Date(c.deadline).toLocaleDateString() : "CALCULATING...";
        document.getElementById("f-status").textContent = c.status.toUpperCase().replace('_', ' ');
        document.getElementById("f-dept").textContent = (c.assignedDept || 'General').toUpperCase();
        document.getElementById("f-desc").textContent = c.description;

        // Status Badge Color
        const statusBadge = document.getElementById("status-badge");
        statusBadge.className = "status-badge";
        if (c.status === 'resolved') statusBadge.classList.add('status-resolved');
        else if (c.status === 'pending') statusBadge.classList.add('status-pending');
        else statusBadge.classList.add('status-active');

        // SLA
        document.getElementById("sla-badge").style.display = c.slaBreached ? "flex" : "none";

        // Stepper Logic
        const statusMap = { "pending": 1, "viewed": 2, "in_progress": 3, "resolved": 4, "delayed": 3, "escalated": 3 };
        const currentStep = statusMap[c.status] || 1;
        
        for (let i = 1; i <= 4; i++) {
            const node = document.getElementById(`step-${i}`);
            if (i <= currentStep) node.classList.add('active');
            else node.classList.remove('active');
        }

        // Active Line Height
        const linePercent = ((currentStep - 1) / 3) * 100;
        document.getElementById("active-line").style.height = `${linePercent}%`;

        // Images
        const citImg = document.querySelector("#citizen-evidence img");
        if (c.images && c.images.length > 0) {
            citImg.src = `http://localhost:5000/uploads/${c.images[0]}`;
            citImg.style.display = "block";
        } else {
            citImg.style.display = "none";
        }

        const proofBox = document.getElementById("f-proof");
        if (c.status === 'resolved') {
            proofBox.style.display = "block";
            const resImg = proofBox.querySelector("img");
            if (c.resolvedImages && c.resolvedImages.length > 0) {
                resImg.src = `http://localhost:5000/uploads/${c.resolvedImages[0]}`;
                resImg.style.display = "block";
            } else {
                resImg.style.display = "none";
            }
        } else {
            proofBox.style.display = "none";
        }

        // System Trace Simulation
        updateTrace(c);

    } catch (error) {
        console.error(error);
        alert("Failed to sync with AI Core.");
    }
}

function updateTrace(c) {
    const box = document.getElementById("trace-box");
    const ts = () => new Date().toLocaleTimeString();
    
    let html = `
        <div class="trace-line"><span class="trace-time">[${ts()}]</span> <span class="trace-cmd">> CLASSIFIER:</span> <span class="trace-msg">Match confirmed (${c.category.toUpperCase()})</span></div>
        <div class="trace-line"><span class="trace-time">[${ts()}]</span> <span class="trace-cmd">> ANALYTICS:</span> <span class="trace-msg">Priority set to ${c.priority.toUpperCase()}</span></div>
    `;

    if (c.assignedTo) {
        html += `<div class="trace-line"><span class="trace-time">[${ts()}]</span> <span class="trace-cmd">> ROUTER:</span> <span class="trace-msg">Assigned to Field Worker: FW-${c.assignedTo.employeeId || 'ID-MISSING'}</span></div>`;
    } else {
        html += `<div class="trace-line"><span class="trace-time">[${ts()}]</span> <span class="trace-cmd">> ROUTER:</span> <span class="trace-msg">Escalated to Dept Queue: ${c.assignedDept.toUpperCase()}</span></div>`;
    }

    if (c.slaBreached) {
        html += `<div class="trace-line"><span class="trace-time">[${ts()}]</span> <span class="trace-cmd">> WATCHDOG:</span> <span class="trace-msg" style="color:#ef4444">CRITICAL: SLA Breach detected. Escalation route active.</span></div>`;
    } else if (c.status === 'resolved') {
        html += `<div class="trace-line"><span class="trace-time">[${ts()}]</span> <span class="trace-cmd">> VERIFIER:</span> <span class="trace-msg" style="color:#22c55e">SUCCESS: Resolution pattern verified by AI.</span></div>`;
    } else {
        html += `<div class="trace-line"><span class="trace-time">[${ts()}]</span> <span class="trace-cmd">> WATCHDOG:</span> <span class="trace-msg">Nominal tracking. Deadline: ${c.deadline ? new Date(c.deadline).toLocaleDateString() : 'Pending'}</span></div>`;
    }

    box.innerHTML = html;
}

window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
        document.getElementById("complaintId").value = id;
        checkStatus(id);
    }
};

function goHome() {
    window.location.href = "index.html";
}