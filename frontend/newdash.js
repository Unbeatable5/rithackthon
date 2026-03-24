const API_BASE = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    loadComplaintDetail();
});

async function loadComplaintDetail() {
    const id = localStorage.getItem("currentComplaintId");
    try {
        const result = await apiClient.get(`/authority/complaints/${id}`);
        
        if (result.error) {
            alert("Error: " + result.error);
            return;
        }

        const c = result;

        // --- SENTINEL DATA ARCHITECTURE ---
        document.getElementById("f-complaintId").innerText = c.complaintId || "---";
        
        // Priority Badge Level Logic
        const priorityVal = (c.priority || "medium").toLowerCase();
        const priorityEl = document.getElementById("f-priority");
        const priorityBadge = document.getElementById("priority-badge");
        if (priorityEl) priorityEl.innerText = priorityVal.toUpperCase();
        if (priorityBadge) {
            priorityBadge.innerText = `LEVEL: ${priorityVal.toUpperCase()}`;
            if (priorityVal === 'high') {
                priorityBadge.style.background = 'rgba(239, 68, 68, 0.1)';
                priorityBadge.style.color = '#ef4444';
                priorityBadge.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            } else if (priorityVal === 'low') {
                priorityBadge.style.background = 'rgba(16, 185, 129, 0.1)';
                priorityBadge.style.color = '#10b981';
                priorityBadge.style.borderColor = 'rgba(16, 185, 129, 0.2)';
            }
        }

        document.getElementById("f-category").innerText = (c.category || "---").toUpperCase();
        document.getElementById("f-date").innerText = new Date(c.submittedAt).toLocaleDateString();
        document.getElementById("descText").innerText = c.description || "Intelligence log is empty.";

        // Citizen Forensics
        const citizenInfo = document.querySelector(".citizen-info");
        if (citizenInfo && c.citizen) {
            citizenInfo.innerHTML = `<span class="material-icons-outlined" style="font-size:16px; vertical-align:middle;">account_circle</span> CITIZEN: ${c.citizen.phone || c.citizen.email || 'N/A'}`;
        }
        
        // Evidence Visualization
        const img = document.getElementById("complaintImage");
        if (c.images && c.images.length > 0) {
            img.src = `http://localhost:5000/uploads/${c.images[0]}`;
        } else {
            img.src = "https://via.placeholder.com/600x400?text=NO+IMAGE+IN+ARCHIVE";
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
        document.getElementById("statusSelect").value = c.status || "pending";
        document.getElementById("citizenMessage").value = c.departmentMessage || "";
        
        const dateInput = document.querySelector("input[type='date']");
        if (c.deadline && dateInput) {
            dateInput.value = new Date(c.deadline).toISOString().split('T')[0];
        }

        // --- Role-Based Personnel Badge ---
        const workerBox = document.getElementById("workerProfile");
        const noWorkerMsg = document.getElementById("noWorkerMsg");
        
        if (c.assignedTo) {
            if (workerBox) workerBox.style.display = "block";
            if (noWorkerMsg) noWorkerMsg.style.display = "none";
            
            const nameEl = document.getElementById("workerName");
            if (nameEl) nameEl.innerText = c.assignedTo.name;
            
            const idEl = document.getElementById("workerId");
            if (idEl) idEl.innerText = "ID: " + (c.assignedTo.employeeId || "N/A");
            
            const phoneEl = document.getElementById("workerPhone");
            if (phoneEl) phoneEl.innerText = c.assignedTo.phone || "N/A";
            
            const sectorEl = document.getElementById("workerSector");
            if (sectorEl) sectorEl.innerText = (c.assignedDept || "GLOBAL").toUpperCase();
            
            const initialEl = document.getElementById("workerInitials");
            if (initialEl) initialEl.innerText = c.assignedTo.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        } else {
            if (workerBox) workerBox.style.display = "none";
            if (noWorkerMsg) noWorkerMsg.style.display = "block";
        }

        // Fetch operational personnel
        loadPersonnelDropdown();

    } catch (error) {
        console.error("Failed to load complaint:", error);
    }
}

async function saveStatus() {
    const id = localStorage.getItem("currentComplaintId");
    const status = document.getElementById("statusSelect").value;
    const departmentMessage = document.getElementById("citizenMessage").value;
    const deadline = document.querySelector("input[type='date']").value;
    const proofFile = document.getElementById("proofFileInput").files[0];

    const formData = new FormData();
    formData.append("status", status);
    formData.append("departmentMessage", departmentMessage);
    formData.append("deadline", deadline);
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
        alert("Server error during update.");
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
    window.open(img.src, '_blank');
}

function toggleMessageInput() {
    const msgGroup = document.getElementById('messageInputGroup');
    msgGroup.style.display = msgGroup.style.display === 'none' ? 'block' : 'none';
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
        if (!select || !workers || workers.error) return;

        // Keep the first option
        const firstOption = select.options[0];
        select.innerHTML = "";
        select.appendChild(firstOption);

        workers.forEach(w => {
            const opt = document.createElement("option");
            opt.value = w._id;
            opt.innerText = `${w.name} (${w.employeeId})`;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Failed to load workers:", err);
    }
}

async function reassignWorker() {
    const workerId = document.getElementById("reassignSelect").value;
    if (!workerId) return;

    const id = localStorage.getItem("currentComplaintId");
    try {
        const res = await apiClient.put(`/authority/complaints/${id}/assign`, { workerId });
        if (res.success) {
            alert("Agent reassigned successfully! Refreshing view...");
            loadComplaintDetail();
        } else {
            alert("Reassignment failed: " + res.error);
        }
    } catch (err) {
        console.error(err);
    }
}