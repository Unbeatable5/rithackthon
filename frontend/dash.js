function searchTable() {

  let input = document.getElementById("searchInput").value.toLowerCase();
  let rows = document.querySelectorAll("#complaintTable tbody tr");

  rows.forEach(row => {

    let text = row.innerText.toLowerCase();

    row.style.display = text.includes(input) ? "" : "none";

  });

}


function viewComplaint() {

  window.location.href = "compR.html";

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

    let status = row.querySelector(".status").innerText.toLowerCase();

    if (type === "all") {
      row.style.display = "";
    }
    else if (status === type) {
      row.style.display = "";
    }
    else {
      row.style.display = "none";
    }

  });

}


function filterPriority(type) {

  let rows = document.querySelectorAll("#complaintTable tbody tr");

  rows.forEach(row => {

    let priority = row.children[7].innerText.toLowerCase();

    if (priority === type) {
      row.style.display = "";
    }
    else {
      row.style.display = "none";
    }

  });

}


let page = 1;

function nextPage() {

  page++;
  document.getElementById("pageInfo").innerText = page + " / 2";

}

function prevPage() {

  if (page > 1) {
    page--;
    document.getElementById("pageInfo").innerText = page + " / 2";
  }

}