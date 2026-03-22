let step = 0;

function handleClick() {
    let btn = document.getElementById("actionBtn");
    let desc = document.getElementById("desc").value;

    if (desc.trim() === "") {
        alert("Please enter a description of the issue.");
        return;
        btn.innerText = "";
    }

    if (step === 1) {
        btn.innerText = "Try with AI";
        btn.classList.replace("green", "orange");
        step++;
        return;
    }

    startAI();
}

function startAI() {
    const loading = document.getElementById("loading");
    const aiText = document.getElementById("aiText");
    const desc = document.getElementById("desc").value.toLowerCase();

    loading.style.display = "flex";

    setTimeout(() => { aiText.innerText = "CivicSense AI Assigning Category..."; }, 800);
    setTimeout(() => { aiText.innerText = "CivicSense AI Determining Priority..."; }, 1600);

    setTimeout(() => {
        loading.style.display = "none";
        
        let rightBox = document.getElementById("rightBox");
        rightBox.classList.remove("hidden");
        setTimeout(() => rightBox.classList.add("show"), 50);

        // Generate Random ID
        let generatedID = "4F6RHIG" + Math.floor(1000 + Math.random() * 9000) + "GF";
        document.getElementById("cid_input").value = generatedID;
        document.getElementById("displayID").innerText = generatedID;

        // Simple AI Logic
        let category = "General Maintenance";
        let priority = "Medium";

        if (desc.includes("water")) {
            category = "Water Supply";
            priority = "High";
        } else if (desc.includes("light") || desc.includes("bulb")) {
            category = "Street Lighting";
            priority = "Medium";
        } else if (desc.includes("road") || desc.includes("pothole")) {
            category = "Road & Infrastructure";
            priority = "High";
        }

        document.getElementById("category").value = category;
        document.getElementById("priority").value = priority;
    }, 2500);
}

function submitComplaint() {
    let area = document.getElementById("area").value;
    if (area.trim() === "") {
        alert("Please enter the area/locality.");
        return;
    }
    
    // Show the Success Popup (Image 2)
    document.getElementById("popup").style.display = "flex";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
    location.reload(); // Refresh page to reset
}

function copyID() {
    let idText = document.getElementById("displayID").innerText;
    navigator.clipboard.writeText(idText);
    alert("Complaint ID copied: " + idText);
}