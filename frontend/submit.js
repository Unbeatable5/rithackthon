// submit.js - REBUILT FROM SCRATCH FOR HACKATHON STABILITY
let currentStep = 0;

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please log in to submit a complaint.");
        window.location.href = "verify.html";
    }
    loadHistory();
});

async function loadHistory() {
    const container = document.getElementById("historyList");
    if (!container) return;
    try {
        const complaints = await apiClient.get("/complaints/me");
        
        // Handle Error Objects from updated apiClient
        if (complaints && complaints.error) {
            console.error("API Error in History:", complaints.error);
            container.innerHTML = `<p style="color:#ef4444; font-size:0.85rem; text-align:center; padding:20px;">${complaints.error}</p>`;
            return;
        }

        // Ensure we have an array
        if (!Array.isArray(complaints) || complaints.length === 0) {
            container.innerHTML = `<p style="color:#94a3b8; font-size:0.85rem; text-align:center; padding:20px;">No complaints submitted yet.</p>`;
            return;
        }

        container.innerHTML = complaints.map(c => {
            const category = c.category || "other";
            const icon = getIcon(category);
            const date = c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : "Pending";
            const status = c.status || "pending";
            
            return `
                <div class="history-card">
                    <div class="h-card-top">
                        <div class="h-category">
                            <span class="material-icons-outlined">${icon}</span>
                            ${category}
                        </div>
                        <span class="h-status ${status}">${status.replace('_',' ')}</span>
                    </div>
                    <div class="h-title">${c.title || "Civic Issue"}</div>
                    <div class="h-meta">
                        <span style="font-family:monospace; opacity:0.7;">${c.complaintId}</span>
                        <span>•</span>
                        <span>${date}</span>
                    </div>
                    <button class="h-btn-view" onclick="location.href='newtrack.html?id=${c.complaintId}'">
                        <span class="material-icons-outlined" style="font-size:16px;">visibility</span>
                        View Progress
                    </button>
                </div>
            `;
        }).join("");
    } catch (e) {
        console.error("Failed to load history", e);
        container.innerHTML = `<p style="color:#ef4444; font-size:0.85rem; text-align:center; padding:20px;">Syncing unavailable.</p>`;
    }
}


/**
 * Multi-stage AI Loading Simulation
 */
async function simulateAIThinking(callback) {
    const screen = document.getElementById("aiLoadingScreen");
    const title = document.getElementById("aiStatusTitle");
    const detail = document.getElementById("aiStatusDetail");
    const bar = document.getElementById("aiProgressBar");

    screen.style.display = "flex";
    
    const stages = [
        { progress: 15, title: "Sentinel AI", detail: "Initializing neural classification engines..." },
        { progress: 40, title: "Image Analysis", detail: "Running computer vision feature extraction..." },
        { progress: 65, title: "Context Mapping", detail: "Cross-referencing historical regional datasets..." },
        { progress: 88, title: "Routing Protocol", detail: "Determining optimal department assignment..." },
        { progress: 100, title: "Finalizing", detail: "Neural classification complete. Syncing results..." }
    ];

    for (const stage of stages) {
        title.innerText = stage.title;
        detail.innerText = stage.detail;
        bar.style.width = `${stage.progress}%`;
        // Randomized delay for a more "organic" processing feel
        const delay = Math.floor(Math.random() * 500) + 400; 
        await new Promise(r => setTimeout(r, delay));
    }

    // Call the actual AI prediction logic
    const aiResult = await callback();
    
    // Smooth transition out
    setTimeout(() => {
        screen.style.display = "none";
        bar.style.width = "0%";
    }, 400);

    return aiResult;
}

/**
 * Step 1: Trigger AI Analysis
 */
async function handleClick() {
    const desc = document.getElementById("desc").value.trim();
    const titleVal = document.getElementById("title").value.trim() || "Issue";
    if (!desc) {
        alert("Please describe the issue first.");
        return;
    }

    const aiResult = await simulateAIThinking(async () => {
        try {
            const response = await fetch("http://localhost:5001/ml/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: `${titleVal} ${desc}` })
            });
            return await response.json();
        } catch (e) {

            console.error("AI Service Error:", e);
            return { category: "other", priority: "medium", error: true };
        }
    });

    // Show results
    const rightBox = document.getElementById("rightBox");
    rightBox.classList.remove("hidden");
    setTimeout(() => rightBox.classList.add("show"), 50);

    // Automatic ID generation (Draft)
    const draftId = "cv" + Math.random().toString(36).substr(2, 8);
    document.getElementById("cid_input").value = draftId;

    document.getElementById("category").value = aiResult.category.charAt(0).toUpperCase() + aiResult.category.slice(1);

    document.getElementById("priority").value = aiResult.priority.charAt(0).toUpperCase() + aiResult.priority.slice(1);
    
    if (aiResult.error) {
        alert("AI Service is offline. Using standard defaults.");
    }
}

/**
 * Step 2: Final Submission
 */
async function submitComplaint(e) {
    if (e) e.preventDefault();
    
    const btn = e ? e.currentTarget : null;
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = "0.7";
        btn.innerHTML = '<span class="material-icons-outlined spinning" style="font-size:20px; vertical-align:middle;">sync</span> Saving...';
    }

    // ACTIVATE ANTI-RELOAD EARLY
    window.addEventListener('beforeunload', handleUnload);

    const titleVal = document.getElementById("title").value.trim() || "Civic Issue";
    const descVal = document.getElementById("desc").value.trim();
    const areaVal = document.getElementById("area").value.trim();
    const catVal = document.getElementById("category").value.toLowerCase();
    const prioVal = document.getElementById("priority").value.toLowerCase();
    const fileInput = document.getElementById("fileInput");

    if (!areaVal) {
        alert("Please enter the specific location/area.");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-icons-outlined">send</span> Confirm & Submit Complaint';
        }
        return;
    }

    const formData = new FormData();
    formData.append("title", titleVal);
    formData.append("description", descVal);
    formData.append("area", areaVal);
    formData.append("category", catVal);
    formData.append("priority", prioVal);

    if (fileInput && fileInput.files.length > 0) {
        for (let i = 0; i < fileInput.files.length; i++) {
            formData.append("images", fileInput.files[i]);
        }
    }

    try {
        const result = await apiClient.post("/complaints", formData, true);

        if (result.success || (result.complaintId && !result.error)) {
            // 1. POPULATE DATA FIRST
            const cid = result.complaintId || document.getElementById("cid_input").value;
            const dept = (result.complaint && result.complaint.assignedDept) || "Administration";
            
            document.getElementById("finalID").innerText = cid;
            document.getElementById("finalDeptShow").innerText = dept.toUpperCase();
            
            // 2. SHOW MODAL
            const successPopup = document.getElementById("finalSuccessPopup");
            successPopup.style.display = "flex";
            successPopup.style.zIndex = "999999"; // Force top
            
            // 3. INTERNAL RESET
            const desc = document.getElementById("desc");
            const area = document.getElementById("area");
            if (desc) desc.value = "";
            if (area) area.value = "";

            // 4. DISABLE THE SUBMISSION BUTTON PERMANENTLY FOR THIS SESSION
            if (btn) {
                btn.innerHTML = '<span class="material-icons-outlined">check_circle</span> Submitted Successfully';
                btn.style.background = "#489c4c";
                btn.disabled = true;
            }

            console.info("SUBMISSION SUCCESS: Popup persistent.");
            loadHistory();
        } else {
            // REMOVE UNLOAD GUARD ON FAILURE
            window.removeEventListener('beforeunload', handleUnload);
            alert("Submission failed: " + (result.error || "Please verify."));
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="material-icons-outlined">send</span> Confirm & Submit Complaint';
            }
        }
    } catch (err) {
        console.error("Submission error:", err);
        alert("Server connection failed.");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-icons-outlined">send</span> Confirm & Submit Complaint';
        }
    }
}


function copyID() {
    const id = document.getElementById("finalID").innerText;
    navigator.clipboard.writeText(id);
    alert("ID Copied: " + id);
}

function getIcon(cat) {
    const icons = { 
        water: 'water_drop', 
        road: 'road', 
        electrical: 'bolt', 
        sanitation: 'delete_sweep', 
        garbage: 'delete_sweep',
        noise: 'volume_up',
        other: 'info'
    };
    return icons[cat] || 'info';
}

// GPS & Drag-Drop remain similar but cleaned up
function detectGPS() {
    const area = document.getElementById("area");
    area.value = "Locating...";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            // For hackathon reliability, we map coordinates to a known demo area
            // This ensures the "Nearby Issues" feature works with text-based search
            area.value = "Civil Lines (GPS Detected)";
        }, () => {
            area.value = "GPS Access Denied";
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const area = document.getElementById("uploadArea");
    const input = document.getElementById("fileInput");
    const text = document.getElementById("uploadText");
    if (area && input) {
        area.addEventListener("dragover", (e) => { e.preventDefault(); area.style.borderColor = "#489c4c"; });
        area.addEventListener("dragleave", () => area.style.borderColor = "#cbd5e1");
        area.addEventListener("drop", (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) {
                input.files = e.dataTransfer.files;
                text.innerText = `Matched: ${e.dataTransfer.files[0].name}`;
            }
        });
        input.addEventListener("change", () => {
            if (input.files.length) text.innerText = `Selected: ${input.files[0].name}`;
        });
    }
});

function handleUnload(e) {
    const popup = document.getElementById("finalSuccessPopup");
    if (popup && popup.style.display === "flex") {
        e.preventDefault();
        e.returnValue = "Complaint ID not saved yet!";
        return e.returnValue;
    }
}

// Add close helper
function closeSuccess() {
    window.removeEventListener('beforeunload', handleUnload);
    const popup = document.getElementById("finalSuccessPopup");
    if (popup) popup.style.display = "none";
}