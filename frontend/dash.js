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

        // Update Notifications
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
        const workerName = c.assignedTo ? c.assignedTo.name : '<span style="color:#d97706; font-size:11px;">🤖 AI Assigning...</span>';

        return `
            <tr data-submitted="${hoursAgo.toFixed(2)}" data-id="${c.complaintId}">
                <td><input type="checkbox"></td>
                <td><strong>${c.complaintId || 'N/A'}</strong></td>
                <td>${cat}</td>
                <td><span class="badge badge-${c.status || 'pending'}">${statusText}</span></td>
                <td>${workerName}</td>
                <td>${c.area || 'N/A'}</td>
                <td>${dateStr}</td>
                <td><span class="pri-${c.priority || 'medium'}">${pri}</span></td>
                <td class="sla-cell"></td>
                <td><button class="btn-view" onclick="viewComplaint('${c.complaintId}')">Inspect <span class="material-icons-outlined" style="font-size:16px;">chevron_right</span></button></td>
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
}