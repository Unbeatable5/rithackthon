function saveStatus() {
    const status = document.getElementById('statusSelect').value;
    alert("Status updated to: " + status);
    // In a real app, you would use fetch() to send this to your backend
}