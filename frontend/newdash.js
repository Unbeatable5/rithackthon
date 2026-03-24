// newdash.js - Authority Detail Logic

document.addEventListener("DOMContentLoaded", () => {
    loadComplaintDetail();
});

async function loadComplaintDetail() {
    const id = localStorage.getItem("currentComplaintId");
    if (!id) {
        alert("Operational ID missing. Please return to Strategic Map.");
        return;
    }

    try {
        // Add Cache Buster to ensure authority sees the absolute latest state
        const result = await apiClient.get(`/authority/complaints/${id}?t=${Date.now()}`);
        
        if (result.error) {
            console.error("API Error:", result.error);
            alert("Error retrieving intel: " + result.error);
            return;
        }

        const c = result;
        const safeText = (val, fallback = "---") => (val ? String(val).toUpperCase() : fallback);

        // --- SENTINEL DATA ARCHITECTURE ---
        document.getElementById("f-complaintId").innerText = safeText(c.complaintId);
        
        // Priority Badge Level Logic
        const priorityVal = (c.priority || "medium").toLowerCase();
        const priorityEl = document.getElementById("f-priority");
        if (priorityEl) {
            priorityEl.innerText = priorityVal.toUpperCase();
            if (priorityVal === 'high' || priorityVal === 'urgent') priorityEl.style.color = '#ef4444';
            else if (priorityVal === 'low') priorityEl.style.color = '#10b981';
            else priorityEl.style.color = '#1E3A8A';
        }

        document.getElementById("f-category").innerText = safeText(c.category, "OTHER");
        document.getElementById("f-date").innerText = c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : "PENDING LOG";
        
        // Important: Description Fix
        const descEl = document.getElementById("descText");
        if (descEl) {
            descEl.innerText = c.description || "Transmitted description was empty or corrupted.";
        }

        // Citizen Forensics
        const citizenInfo = document.querySelector(".citizen-info");
        if (citizenInfo) {
            const contact = (c.citizen && (c.citizen.phone || c.citizen.email)) || 'SECURE_CHANNEL';
            citizenInfo.innerHTML = `<span class="material-icons-outlined" style="font-size:16px; vertical-align:middle;">account_circle</span> Citizen Contact: ${contact}`;
        }
        
        // Evidence Visualization (Adaptive Pathing)
        const img = document.getElementById("complaintImage");
        console.log("Trace: Dashboard Evidence Images:", c.images);
        
        if (img) {
            if (c.images && Array.isArray(c.images) && c.images.length > 0) {
                const imgName = encodeURIComponent(c.images[0]);
                const finalSrc = `${apiClient.BASE}/uploads/${imgName}`;
                console.log("Trace: Setting Dashboard Image Src:", finalSrc);
                
                img.src = finalSrc;
                img.onerror = () => { 
                    console.error("Trace: Dashboard image failed:", finalSrc);
                    img.src = "https://via.placeholder.com/600x400?text=IMAGE+UNAVAILABLE"; 
                };
            } else {
                console.log("Trace: No evidence images in complaint.");
                img.src = "https://via.placeholder.com/600x400?text=NO+IMAGE+IN+ARCHIVE";
            }
        }

        // --- SENTINEL STEPPER LOGIC ---
        const statusSteps = { "pending": 1, "viewed": 2, "in_progress": 3, "resolved": 4 };
        const currentStep = statusSteps[c.status || "pending"] || 1;
        const boxes = document.querySelectorAll('.step-box');
        const lines = document.querySelectorAll('.step-line');

        boxes.forEach((box, i) => {
            if (i < currentStep) {
                box.classList.remove('empty');
                box.classList.add('active');
                if (i === currentStep - 1) box.classList.add('anim-pulse');
                else box.classList.remove('anim-pulse');
            } else {
                box.classList.add('empty');
                box.classList.remove('active', 'anim-pulse');
            }
        });

        lines.forEach((line, i) => {
            if (i < currentStep - 1) line.classList.add('active-line');
            else line.classList.remove('active-line');
        });

        // Control Hub State
        const statusSelect = document.getElementById("statusSelect");
        if (statusSelect) statusSelect.value = c.status || "pending";
        
        const msgInput = document.getElementById("citizenMessage");
        if (msgInput) msgInput.value = c.departmentMessage || "";
        
        const dateInput = document.querySelector("input[type='date']");
        if (c.deadline && dateInput) {
            try {
                dateInput.value = new Date(c.deadline).toISOString().split('T')[0];
            } catch(e) {}
        }

        // --- Role-Based Personnel Badge ---
        const workerBox = document.getElementById("workerProfile");
        const noWorkerMsg = document.getElementById("noWorkerMsg");
        
        if (c.assignedTo) {
            if (workerBox) workerBox.style.display = "block";
            if (noWorkerMsg) noWorkerMsg.style.display = "none";
            
            const nameEl = document.getElementById("workerName");
            if (nameEl) nameEl.innerText = c.assignedTo.name || "Unknown Agent";
            
            const idEl = document.getElementById("workerId");
            if (idEl) idEl.innerText = "ID: " + (c.assignedTo.employeeId || "N/A");
            
            const phoneEl = document.getElementById("workerPhone");
            if (phoneEl) phoneEl.innerText = c.assignedTo.phone || "N/A";
            
            const sectorEl = document.getElementById("workerSector");
            if (sectorEl) sectorEl.innerText = (c.assignedDept || "GLOBAL").toUpperCase();
            
            const initialEl = document.getElementById("workerInitials");
            if (initialEl && c.assignedTo.name) {
                initialEl.innerText = c.assignedTo.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            }
        } else {
            if (workerBox) workerBox.style.display = "none";
            if (noWorkerMsg) noWorkerMsg.style.display = "block";
        }

        // Fetch operational personnel
        loadPersonnelDropdown();

    } catch (error) {
        console.error("Critical Sentinel Load Error:", error);
    }
}

async function saveStatus() {
    const id = localStorage.getItem("currentComplaintId");
    const statusSelect = document.getElementById("statusSelect");
    const msgInput = document.getElementById("citizenMessage");
    const dateInput = document.querySelector("input[type='date']");
    const proofFile = document.getElementById("proofFileInput")?.files[0];

    if (!id) return;

    const formData = new FormData();
    formData.append("status", statusSelect?.value || "pending");
    formData.append("departmentMessage", msgInput?.value || "");
    if (dateInput?.value) formData.append("deadline", dateInput.value);
    if (proofFile) formData.append("resolvedImages", proofFile);

    try {
        const result = await apiClient.put(`/authority/complaints/${id}`, formData, true);
        
        if (result.success || !result.error) {
            document.getElementById('savePopupOverlay').style.display = 'flex';
        } else {
            alert("Update failed: " + result.error);
        }
    } catch (error) {
        console.error(error);
        alert("Server error during update sync.");
    }
}

function confirmSave() {
    window.location.href = "dash.html";
}

function closePopup() {
    confirmSave();
}

function downloadImage() {
    const img = document.getElementById('complaintImage');
    if (img && img.src) window.open(img.src, '_blank');
}

function toggleMessageInput() {
    const msgGroup = document.getElementById('messageInputGroup');
    if (msgGroup) msgGroup.style.display = msgGroup.style.display === 'none' ? 'block' : 'none';
}

function toggleUploadInput() {
    const statusSelect = document.getElementById('statusSelect');
    const uploadGroup = document.getElementById('uploadProofGroup');
    if (statusSelect && uploadGroup) {
        uploadGroup.style.display = statusSelect.value.toLowerCase() === 'resolved' ? 'block' : 'none';
    }
}

async function loadPersonnelDropdown() {
    try {
        const workers = await apiClient.get("/authority/workers");
        const select = document.getElementById("reassignSelect");
        if (!select || !workers || workers.error || !Array.isArray(workers)) return;

        // Keep the first option
        const firstOption = select.options[0];
        select.innerHTML = "";
        select.appendChild(firstOption);

        workers.forEach(w => {
            const opt = document.createElement("option");
            opt.value = w._id;
            const sectorInfo = w.sectors && w.sectors.length > 0 ? ` [${w.sectors.join(", ")}]` : " [No Sectors]";
            opt.innerText = `${w.name}${sectorInfo}`;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Failed to load workers:", err);
    }
}

async function reassignWorker() {
    const select = document.getElementById("reassignSelect");
    const workerId = select?.value;
    if (!workerId) {
        alert("Please select a valid personnel from the roster.");
        return;
    }

    const id = localStorage.getItem("currentComplaintId");
    console.log(`Trace: Reassigning Complaint ${id} to Worker ${workerId}`);
    
    try {
        const res = await apiClient.put(`/authority/complaints/${id}/assign`, { workerId });
        if (res.success || !res.error) {
            alert("Strategic Reassignment Successful! The field agent has been dispatched.");
            loadComplaintDetail(); // Reload to update the personnel card
        } else {
            alert("Reassignment failed: " + res.error);
        }
    } catch (err) {
        console.error("Reassignment Error:", err);
        alert("Communication failed with the core server.");
    }
}