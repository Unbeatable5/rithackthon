console.log("[DASH DEBUG] dash.js loaded");
loadDashboard();



async function loadDashboard() {
    try {
        console.log("[DASH DEBUG] Fetching dashboard data...");
        const result = await apiClient.get("/authority/dashboard");
        console.log("[DASH DEBUG] API Result:", result);

        if (result.error) {
            console.error("[DASH DEBUG] Dashboard error:", result.error);
            const metrics = document.querySelectorAll(".metric-card h2");
            if (metrics.length > 0) metrics[0].innerText = "ERR";
            if (metrics.length > 1) metrics[1].innerText = result.error.substring(0, 15);
            return;
        }


        // Update Dept Name in Header
        const deptLabel = document.getElementById("deptName");
        if (deptLabel) {
            const dept = result.department || (result.recent && result.recent.length > 0 ? result.recent[0].assignedDept : "Authority") || "OFFICER";
            console.log("[DASH DEBUG] Identified Dept:", dept);
            deptLabel.innerText = (dept || "Authority").toUpperCase() + " DEPARTMENT";
        }



        // Update Stats
        const totalEl = document.getElementById("total-logged");
        const pendingEl = document.getElementById("pending-logged");
        const highEl = document.getElementById("high-logged");
        const slaEl = document.getElementById("sla-logged");

        if (totalEl) totalEl.innerText = result.total || 0;
        if (pendingEl) pendingEl.innerText = result.pending || 0;
        if (highEl) highEl.innerText = result.high || 0;
        if (slaEl) slaEl.innerText = result.slaBreached || 0;





        // Update Tables
        renderTable(result.recent, "complaintTableBody");
        renderTable(result.recent, "complaintTableBody2");

        // Update Analytics Tab
        if (result.resolutionRate !== undefined) {
             const rateEl = document.querySelector("#tab-analytics .metric-card:nth-child(1) h2");
             if (rateEl) rateEl.innerText = result.resolutionRate + "%";
             
             const avgEl = document.querySelector("#tab-analytics .metric-card:nth-child(2) h2");
             if (avgEl) avgEl.innerText = result.avgResolutionTime + "d";
             
             const breachEl = document.querySelector("#tab-analytics .metric-card:nth-child(3) h2");
             if (breachEl) breachEl.innerText = result.slaBreached || 0;
             
             const servedEl = document.querySelector("#tab-analytics .metric-card:nth-child(4) h2");
             if (servedEl) servedEl.innerText = result.citizensServed || 0;
        }

        // Update Category Bars
        if (result.categoryCounts) {
            result.categoryCounts.forEach(cat => {
                const countEl = document.getElementById(`bar-count-${cat.name}`);
                const fillEl = document.getElementById(`bar-fill-${cat.name}`);
                if (countEl) countEl.innerText = `${cat.count} complaints`;
                if (fillEl) {
                    const percent = result.total > 0 ? (cat.count / result.total) * 100 : 0;
                    fillEl.style.width = percent + "%";
                }
            });
        }

        // --- NEW: Restore Notifications ---
        const notifDropdown = document.getElementById("notifDropdown");
        if (notifDropdown && result.notifications) {
            const header = '<div class="notif-header">System Notifications</div>';
            const items = result.notifications.map(n => `
                <div class="notif-item"><strong>${n.type}</strong>: ${n.text}</div>
            `).join("");
            notifDropdown.innerHTML = header + (items || '<div class="notif-item">No new notifications</div>');
        }


        
    } catch (error) {
        console.error("Failed to load dashboard:", error);
    }
}




function renderTable(complaints, tbodyId) {
    console.log(`[DASH DEBUG] Rendering table ${tbodyId} with ${complaints?.length || 0} rows`, complaints);
    const tbody = document.getElementById(tbodyId);
    if (!tbody) {
        console.warn(`[DASH DEBUG] Tbody ${tbodyId} not found!`);
        return;
    }
    if (!complaints || complaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px;">No complaints found for this department.</td></tr>';
        return;
    }


    
    tbody.innerHTML = complaints.map(c => {
        const dateStr = c.submittedAt ? new Date(c.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
        const hoursAgo = c.submittedAt ? (Date.now() - new Date(c.submittedAt)) / 3600000 : 0;

        
        const cat = (c.category || 'other').charAt(0).toUpperCase() + (c.category || 'other').slice(1);
        const pri = (c.priority || 'medium').charAt(0).toUpperCase() + (c.priority || 'medium').slice(1);
        const statusText = (c.status || 'pending').replace('_',' ').toUpperCase();
        const workerName = c.assignedTo ? c.assignedTo.name : '<span style="color:#d97706; font-size:11px;">AI Assigning...</span>';

        const isViewed = c.viewedAt ? "true" : "false";
        const cleanStatus = (c.status || 'pending').toLowerCase();

        return `
            <tr data-submitted="${hoursAgo.toFixed(2)}" data-id="${c.complaintId}" data-status="${cleanStatus}" data-viewed="${isViewed}">
                <td><strong>${c.complaintId || 'N/A'}</strong></td>
                <td>${cat}</td>
                <td><span class="badge badge-${c.status || 'pending'}">${statusText}</span></td>
                <td>${c.area || 'N/A'}</td>
                <td>${workerName}</td>
                <td class="sla-cell"></td>
                <td style="text-align:right;"><button class="btn-view" onclick="viewComplaint('${c.complaintId}')">Inspect <span class="material-icons-outlined" style="font-size:16px;">chevron_right</span></button></td>
            </tr>
        `;
    }).join("");

    
    // Re-run SLA timer engine if defined
    if (typeof updateSLATimers === "function") updateSLATimers();
}

function viewComplaint(id) {
    localStorage.setItem("currentComplaintId", id);
    window.location.href = "newdash.html";
}

function searchTable() {
    let input = document.getElementById("searchInput").value.toLowerCase();
    let rows = document.querySelectorAll("#complaintTable tbody tr");
    rows.forEach(row => {
        let text = row.innerText.toLowerCase();
        row.style.display = text.includes(input) ? "" : "none";
    });
}

function deleteSelected() {
    let boxes = document.querySelectorAll("tbody input[type='checkbox']:checked");
    boxes.forEach(box => {
        box.closest("tr").remove();
    });
}

function filterStatus(type) {
  let rows = document.querySelectorAll("#complaintTable tbody tr");
  rows.forEach(row => {
    let status = row.querySelector(".badge").innerText.toLowerCase();
    if (type === "all" || status === type) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

function filterPriority(type) {

  let rows = document.querySelectorAll("#complaintTable tbody tr");
  rows.forEach(row => {
    let priText = row.querySelector(".pri-" + (row.querySelector("span[class^='pri-']")?.classList[0]?.split('-')[1] || "") )?.innerText.toLowerCase();
    // Simpler way: check the data-id OR the span directly
    let priSpan = row.querySelector("span[class^='pri-']");
    let priority = priSpan ? priSpan.innerText.toLowerCase() : "";
    
    if (type === "all" || priority === type) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}let currentWorkers = [];

async function loadPersonnel() {
    console.log("[DASH DEBUG] Fetching field personnel...");
    const grid = document.getElementById("personnelGrid");
    if (!grid) return;

    try {
        const workers = await apiClient.get("/authority/workers");
        console.log("[DASH DEBUG] Workers fetched:", workers);

        if (workers.error) {
            grid.innerHTML = `<div style="grid-column: span 3; padding: 40px; text-align: center; color: #ef4444;">
                <span class="material-icons-outlined" style="font-size: 48px;">error_outline</span>
                <p>Failed to load personnel: ${workers.error}</p>
            </div>`;
            return;
        }

        currentWorkers = workers;
        renderPersonnel(workers);
    } catch (err) {
        console.error("Failed to fetch workers:", err);
    }
}

function renderPersonnel(workers) {
    const grid = document.getElementById("personnelGrid");
    if (!grid) return;

    if (!workers || workers.length === 0) {
        grid.innerHTML = `<div style="grid-column: span 3; padding: 40px; text-align: center; color: #64748b;">
            <p>No field personnel found for this department.</p>
        </div>`;
        return;
    }

    grid.innerHTML = workers.map(w => {
        const initials = w.name.split(' ').map(n => n[0]).join('').toUpperCase();
        const sectors = w.sectors && w.sectors.length > 0 ? w.sectors : ["Unassigned"];
        
        return `
            <div class="worker-card">
                <div class="worker-card-header">
                    <div class="worker-avatar-md">${initials}</div>
                    <div class="worker-meta">
                        <h3>${w.name}</h3>
                        <span>ID: ${w.employeeId}</span>
                    </div>
                </div>
                <div class="worker-details">
                    <div class="detail-item">
                        <span class="material-icons-outlined">call</span>
                        <p>${w.phone || 'No phone'}</p>
                    </div>
                    <div class="detail-item">
                        <span class="material-icons-outlined">location_on</span>
                        <p style="font-weight:600;">Assigned Areas:</p>
                    </div>
                    <div class="tag-container">
                        ${sectors.map(s => `<span class="sector-tag">${s}</span>`).join('')}
                    </div>
                </div>
                <div style="display:flex; gap:10px; margin-top:5px;">
                    <button class="btn-filter" style="flex:1; padding:8px; font-size:0.75rem;" onclick="openPersonnelModal('${w._id}')"><span class="material-icons-outlined" style="font-size:14px;">edit</span> Edit</button>
                    <button class="btn-delete" style="padding:8px; font-size:0.75rem;" onclick="deletePersonnel('${w._id}')"><span class="material-icons-outlined" style="font-size:14px;">block</span></button>
                </div>
            </div>
        `;
    }).join("");
}

// ── PERSONNEL MODAL LOGIC ──

function openPersonnelModal(workerId = null) {
    const modal = document.getElementById("personnelModal");
    const title = document.getElementById("modalTitle");
    const form = document.getElementById("personnelForm");
    
    form.reset();
    document.getElementById("workerId").value = "";

    if (workerId) {
        const worker = currentWorkers.find(w => w._id === workerId);
        if (worker) {
            title.innerText = "Edit Field Personnel";
            document.getElementById("workerId").value = worker._id;
            document.getElementById("workerNameInput").value = worker.name;
            document.getElementById("workerEmpIdInput").value = worker.employeeId;
            document.getElementById("workerPhoneInput").value = worker.phone || "";
            document.getElementById("workerSectorsInput").value = worker.sectors ? worker.sectors.join(", ") : "";
        }
    } else {
        title.innerText = "Add Field Personnel";
    }

    modal.style.display = "flex";
}

function closePersonnelModal() {
    document.getElementById("personnelModal").style.display = "none";
}

async function handlePersonnelSubmit(event) {
    event.preventDefault();
    const id = document.getElementById("workerId").value;
    const name = document.getElementById("workerNameInput").value;
    const employeeId = document.getElementById("workerEmpIdInput").value;
    const phone = document.getElementById("workerPhoneInput").value;
    const sectors = document.getElementById("workerSectorsInput").value.split(",").map(s => s.trim()).filter(s => s !== "");

    const payload = { name, employeeId, phone, sectors };

    try {
        let res;
        if (id) {
            // Update
            res = await apiClient.put(`/authority/workers/${id}`, payload);
        } else {
            // Create
            res = await apiClient.post("/authority/workers", payload);
        }

        if (res.success || !res.error) {
            closePersonnelModal();
            loadPersonnel();
        } else {
            alert("Action failed: " + res.error);
        }
    } catch (err) {
        console.error("Personnel submission error:", err);
    }
}

async function deletePersonnel(id) {
    if (!confirm("Are you sure you want to deactivate this field agent? they will be removed from future assignments.")) return;

    try {
        const res = await apiClient.delete(`/authority/workers/${id}`);
        if (res.success || !res.error) {
            loadPersonnel();
        } else {
            alert("Deactivation failed: " + res.error);
        }
    } catch (err) {
        console.error("Personnel deletion error:", err);
    }
}