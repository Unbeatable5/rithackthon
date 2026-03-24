async function checkStatus(paramId = null) {
    const id = paramId || document.getElementById("complaintId").value.trim();
    if (!id) {
        alert("Please enter a Complaint ID");
        return;
    }

    const token = localStorage.getItem("token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    const url = token ? `${apiClient.BASE}/api/complaints/${id}` : `${apiClient.BASE}/api/complaints/track/${id}`;

    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            alert("Complaint ID not found or Access Denied");
            return;
        }

        const c = await response.json();

        // Show card and update fields
        document.getElementById("resultCard").style.display = "block";
        document.getElementById("f-id").textContent = c.complaintId;
        document.getElementById("f-priority").textContent = c.priority.toUpperCase();
        document.getElementById("f-title").textContent = c.title || "Civic Issue";
        document.getElementById("f-category").textContent = c.category.toUpperCase();
        document.getElementById("f-area").textContent = c.area || "City Wide";
        document.getElementById("f-date").textContent = new Date(c.submittedAt).toLocaleDateString();
        document.getElementById("f-deadline").textContent = c.deadline ? new Date(c.deadline).toLocaleDateString() : "PENDING";
        document.getElementById("f-status").textContent = c.status.toUpperCase().replace('_', ' ');
        document.getElementById("f-dept").textContent = (c.assignedDept || 'General').toUpperCase();
        document.getElementById("f-desc").textContent = c.description;

        // Citizen Info (if available)
        const citizenBox = document.getElementById("citizen-info");
        if (c.citizen) {
            citizenBox.style.display = "block";
            document.getElementById("f-citizen-name").textContent = c.citizen.name || "N/A";
            document.getElementById("f-citizen-contact").textContent = c.citizen.phone || c.citizen.email || "N/A";
        } else {
            citizenBox.style.display = "none";
        }


        // Stepper logic - improved mapping
        const statusSteps = { "pending": 1, "viewed": 2, "in_progress": 3, "resolved": 4, "delayed": 3, "escalated": 3 };
        const currentStep = statusSteps[c.status] || 1;


        const boxes = document.querySelectorAll('.step-box');
        const lines = document.querySelectorAll('.step-line');

        boxes.forEach((b, i) => {
            if (i < currentStep) b.classList.add('active');
            else b.classList.remove('active');
        });

        lines.forEach((l, i) => {
            if (i < currentStep - 1) l.classList.add('active-line');
            else l.classList.remove('active-line');
        });

        // Evidence and Messages
        const citImg = document.querySelector("#citizen-evidence img");
        const citBox = document.getElementById("citizen-evidence");
        
        console.log("Trace: Track.js Data:", { images: c.images, resolved: c.resolvedImages });

        if (citImg && citBox) {
            if (c.images && Array.isArray(c.images) && c.images.length > 0) {
                const imgName = c.images[0];
                const finalSrc = imgName.startsWith('http') ? imgName : `${apiClient.BASE}/uploads/${imgName}`;
                console.log("Trace: Setting Citizen Image Src (track.js):", finalSrc);
                citImg.src = finalSrc;
                citImg.onerror = () => { 
                    console.error("Trace: Citizen Image failed (track.js):", finalSrc);
                    citImg.src = "https://via.placeholder.com/600x400?text=IMAGE+UNAVAILABLE"; 
                };
            } else {
                citImg.src = "https://via.placeholder.com/600x400?text=NO+IMAGE+UPLOADED";
            }
        }

        const msgBox = document.getElementById("f-message");
        if (msgBox) {
            if (c.departmentMessage && c.departmentMessage.trim() !== "") {
                msgBox.style.display = "block";
                document.getElementById("f-msg-text").textContent = c.departmentMessage;
                console.log("Trace: Track.js Message Sync Complete.");
            } else {
                msgBox.style.display = "none";
            }
        }

        const proofBox = document.getElementById("f-proof");
        if (c.status === 'resolved') {
            if (proofBox) proofBox.style.display = "block";
            if (c.resolvedImages && Array.isArray(c.resolvedImages) && c.resolvedImages.length > 0) {
                const resImg = document.querySelector("#f-proof img");
                if (resImg) {
                    const resName = c.resolvedImages[0];
                    const resSrc = resName.startsWith('http') ? resName : `${apiClient.BASE}/uploads/${resName}`;
                    console.log("Trace: Setting Resolved Image Src (track.js):", resSrc);
                    resImg.src = resSrc;
                    resImg.onerror = () => { resImg.src = "https://via.placeholder.com/600x400?text=PROOF+UNAVAILABLE"; };
                }
            }
        } else {
            if (proofBox) proofBox.style.display = "none";
        }

        // SLA
        const slaBadge = document.querySelector(".sla-badge");
        if (c.slaBreached) {
            slaBadge.style.display = "flex";
        } else {
            slaBadge.style.display = "none";
        }

    } catch (error) {
        console.error(error);
        alert("Server connection failed.");
    }
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
