// function checkStatus() {
//   const id = document.getElementById("complaintId").value;
//   const result = document.getElementById("result");

//   if (id === "WI4526") {
//     result.classList.remove("hidden");
//   } else {
//     alert("Complaint ID not found");
//     result.classList.add("hidden");
//   }
// }

   function checkStatus(paramId = null) {
            const id = paramId || document.getElementById("complaintId").value.trim();

            if (id === "") {
                alert("Please enter Complaint ID");
                return;
            }

            fetch('http://localhost:5000/api/complaints/track/' + id)
                .then(res => {
                    if (!res.ok) throw new Error("Not found");
                    return res.json();
                })
                .then(complaint => {
                    document.getElementById("result").style.display = "block";
                    document.getElementById("cid").innerText = complaint._id;

                    const statusEl = document.getElementById("status");
                    const delayEl = document.getElementById("delay");

                    statusEl.innerHTML = complaint.status;
                    if (complaint.status.toLowerCase() === "pending") {
                        statusEl.className = "status-pending";
                        delayEl.innerText = "No";
                    } else {
                        statusEl.className = "status-resolved";
                        delayEl.innerText = "No";
                    }

                    document.querySelector(".section-title").innerText = complaint.description || "Complaint Details";
                    document.querySelector("tbody td:nth-child(3)").innerText = complaint.category || "General Issue";
                })
                .catch(err => {
                    alert("Complaint ID not found");
                    document.getElementById("result").style.display = "none";
                });
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
            window.location.href = "submit.html";
        }


         const complaints = {
    "ew8debg3uy3b": {
      id: "ew8debg3uy3b",
      priority: "High",
      title: "Water Issue",
      category: "Water",
      dateSubmitted: "12-04-2024",
      deadline: "14-04-2024",
      status: "Solved",
      dept: "Water",
      desc: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
      step: 4
    }
  };

  function trackComplaint() {
    const id = document.getElementById('complaintInput').value.trim();
    const data = complaints[id] || complaints["ew8debg3uy3b"]; // fallback to demo

    document.getElementById('f-id').textContent       = data.id;
    document.getElementById('f-priority').textContent = data.priority;
    document.getElementById('f-title').textContent    = data.title;
    document.getElementById('f-category').textContent = data.category;
    document.getElementById('f-date').textContent     = data.dateSubmitted;
    document.getElementById('f-deadline').textContent = data.deadline;
    document.getElementById('f-status').textContent   = data.status;
    document.getElementById('f-dept').textContent     = data.dept;
    document.getElementById('f-desc').textContent     = data.desc;

    // update stepper
    const boxes = document.querySelectorAll('.step-box');
    boxes.forEach((b, i) => {
      b.classList.toggle('active', i < data.step);
    });
  }