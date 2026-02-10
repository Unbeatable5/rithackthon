document.getElementById("verifyForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const msg = document.getElementById("msg");

  msg.style.color = "green";
  msg.innerText = "Authority verified successfully! Redirecting...";

  setTimeout(() => {
    window.location.href = "dash.html";
  }, 1000);
});
