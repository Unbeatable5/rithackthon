let step = 0;

function handleClick() {

  let btn = document.getElementById("actionBtn");
  let desc = document.getElementById("desc").value;

  if (desc === "") {
    alert("Please enter description");
    return;
  }

  // STEP 1 → Continue
  if (step === 0) {
    btn.innerText = "Try with AI";
    btn.classList.remove("green");
    btn.classList.add("orange");
    step++;
    return;
  }

  // STEP 2 → AI START
  startAI();
}

function startAI() {

  let desc = document.getElementById("desc").value;
  let loading = document.getElementById("loading");
  let aiText = document.getElementById("aiText");

  loading.style.display = "flex";

  setTimeout(() => {
    aiText.innerText = "CivicSense AI Assigning Category...";
  }, 2000);

  setTimeout(() => {
    aiText.innerText = "CivicSense AI Giving Priority...";
  }, 4000);

  setTimeout(() => {

    loading.style.display = "none";

    let rightBox = document.getElementById("rightBox");
    rightBox.classList.remove("hidden");

    setTimeout(() => {
      rightBox.classList.add("show");
    }, 100);

    // Generate ID
    document.getElementById("cid").value =
      "CS" + Math.floor(Math.random() * 100000);

    let text = desc.toLowerCase();

    let category = "General";
    let priority = "Low";

    if (text.includes("water")) {
      category = "Water Supply Issue";
      priority = "High";
    }
    else if (text.includes("road")) {
      category = "Road Damage";
      priority = "Medium";
    }

    document.getElementById("category").value = category;
    document.getElementById("priority").value = priority;

  }, 6000);
}

function submitComplaint() {

  let area = document.getElementById("area").value;

  if (area === "") {
    alert("Please fill Area");
    return;
  }

  alert("Complaint Submitted Successfully!");
}