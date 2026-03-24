async function checkStatus(paramId = null) {
    const idInput = document.getElementById("complaintId");
    const id = paramId || idInput.value.trim();
    if (!id) {
        alert("Please enter a Complaint ID");
        return;
    }

    // Use robust apiClient for consistency and cache-busting
    try {
        const token = localStorage.getItem("token");
        const endpoint = token ? `/complaints/${id}` : `/complaints/track/${id}`;
        
        console.log(`Trace: Fetching status for [${id}] via ${token ? 'Auth' : 'Public'} link`);
        const c = await apiClient.get(`${endpoint}?t=${Date.now()}`);
        console.log("Trace: Backend Response for Complaint:", c);

        if (!c || c.error) {
            console.warn("Tracking Data Unavailable:", c?.error);
            alert("Complaint ID not found or Access Denied");
            return;
        }

        // Reveal and reset
        const card = document.getElementById("resultCard");
        if (card) {
            card.style.display = "block";
            card.scrollIntoView({ behavior: 'smooth' });
        }

        // --- DEFENSIVE DATA MAPPING (Prevents Crashes on Missing Fields) ---
        const safeText = (val, fallback = "---") => (val ? String(val).toUpperCase() : fallback);
        
        const setEl = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        setEl("f-id", safeText(c.complaintId));
        setEl("f-priority", safeText(c.priority, "MEDIUM"));
        setEl("f-title", c.title || "Civic Issue");
        setEl("f-category", safeText(c.category, "OTHER"));
        setEl("f-area", c.area || "Area Not Specified");
        setEl("f-date", c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : "---");
        setEl("f-deadline", c.deadline ? new Date(c.deadline).toLocaleDateString() : "CALCULATING...");
        
        // Status with split/replace safety
        const rawStatus = c.status || "pending";
        setEl("f-status", rawStatus.toUpperCase().replace('_', ' '));
        setEl("f-dept", safeText(c.assignedDept, "GENERAL QUEUE"));
        setEl("f-desc", c.description || "No additional description provided.");

        // Status Badge Color
        const statusBadge = document.getElementById("status-badge");
        if (statusBadge) {
            statusBadge.className = "status-badge";
            if (rawStatus === 'resolved') statusBadge.classList.add('status-resolved');
            else if (rawStatus === 'pending') statusBadge.classList.add('status-pending');
            else statusBadge.classList.add('status-active');
        }

        // SLA
        const slaBadge = document.getElementById("sla-badge");
        if (slaBadge) slaBadge.style.display = c.slaBreached ? "flex" : "none";

        // Stepper Logic
        const statusMap = { "pending": 1, "viewed": 2, "in_progress": 3, "resolved": 4, "delayed": 3, "escalated": 3 };
        const currentStep = statusMap[rawStatus] || 1;
        
        for (let i = 1; i <= 4; i++) {
            const node = document.getElementById(`step-${i}`);
            if (node) {
                if (i <= currentStep) node.classList.add('active');
                else node.classList.remove('active');
            }
        }

        // Active Line Height
        const activeLine = document.getElementById("active-line");
        if (activeLine) {
            const linePercent = ((currentStep - 1) / 3) * 100;
            activeLine.style.height = `${linePercent}%`;
        }

        // Images (Citizen Evidence)
        const citImg = document.querySelector("#citizen-evidence img");
        const citBox = document.getElementById("citizen-evidence");
        
        if (citImg && citBox) {
            console.log("Trace: Citizen Image Component Found. Data Images:", c.images);
            if (c.images && Array.isArray(c.images) && c.images.length > 0) {
                const imgName = c.images[0];
                const finalSrc = imgName.startsWith('http') ? imgName : `${apiClient.BASE}/uploads/${imgName}`;
                console.log("Trace: Setting Hero Image Source:", finalSrc);
                
                citImg.src = finalSrc;
                citImg.style.display = "block";
                citBox.style.display = "block";
                citImg.onload = () => console.log("Trace: Hero Image loaded successfully.");
                citImg.onerror = (e) => {
                    console.error("Trace: Hero Image Failed to Load. Final Src:", finalSrc);
                    citImg.src = "https://via.placeholder.com/600x400?text=IMAGE+UNAVAILABLE";
                };
            } else {
                console.log("Trace: No images found in complaint data.");
                citBox.style.display = "none";
            }
        }

        const proofBox = document.getElementById("f-proof");
        if (proofBox) {
            if (rawStatus === 'resolved' && c.resolvedImages && Array.isArray(c.resolvedImages) && c.resolvedImages.length > 0) {
                proofBox.style.display = "block";
                const resImg = proofBox.querySelector("img");
                if (resImg) {
                    const resName = c.resolvedImages[0];
                    const resSrc = resName.startsWith('http') ? resName : `${apiClient.BASE}/uploads/${resName}`;
                    resImg.src = resSrc;
                    resImg.style.display = "block";
                    resImg.onerror = () => resImg.src = "https://via.placeholder.com/600x400?text=PROOF+UNAVAILABLE";
                }
            } else {
                proofBox.style.display = "none";
            }
        }

        // Message Hub
        const msgCard = document.getElementById("f-message-card");
        const msgText = document.getElementById("f-dept-msg");
        if (msgCard && msgText) {
            if (c.departmentMessage && c.departmentMessage.trim() !== "") {
                msgText.innerText = c.departmentMessage;
                msgCard.style.display = "block";
            } else {
                msgCard.style.display = "none";
            }
        }

        updateTrace(c);

    } catch (error) {
        console.error("Tracking Engine Error:", error);
        // Remove intrusive alert, replaced with console log for stability
    }
}

function updateTrace(c) {
    const box = document.getElementById("trace-box");
    if (!box) return;
    const ts = () => new Date().toLocaleTimeString();
    
    // Safety for Trace Content
    const category = (c.category || "General").toUpperCase();
    const priority = (c.priority || "Medium").toUpperCase();
    const dept = (c.assignedDept || "General Queue").toUpperCase();
    
    let html = `
        <div class="trace-line"><span class="trace-time">[${ts()}]</span> <span class="trace-cmd">> CLASSIFIER:</span> <span class="trace-msg">Match confirmed (${category})</span></div>
        <div class="trace-line"><span class="trace-time">[${ts()}]</span> <span class="trace-cmd">> ANALYTICS:</span> <span class="trace-msg">Priority set to ${priority}</span></div>
    `;

    if (c.assignedTo) {
        html += `<div class="trace-line"><span class="trace-time">[${ts()}]</span> <span class="trace-cmd">> ROUTER:</span> <span class="trace-msg">Assigned to Field Worker: FW-${c.assignedTo.employeeId || 'ID-MISSING'}</span></div>`;
    } else {
        html += `<div class="trace-line"><span class="trace-time">[${ts()}]</span> <span class="trace-cmd">> ROUTER:</span> <span class="trace-msg">Escalated to Dept Queue: ${dept}</span></div>`;
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
        const input = document.getElementById("complaintId");
        if (input) input.value = id;
        checkStatus(id);
    }
};

function goHome() {
    window.location.href = "index.html";
}