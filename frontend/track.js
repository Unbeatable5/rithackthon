function checkStatus() {
  const id = document.getElementById("complaintId").value;
  const result = document.getElementById("result");

  if (id === "WI4526") {
    result.classList.remove("hidden");
  } else {
    alert("Complaint ID not found");
    result.classList.add("hidden");
  }
}