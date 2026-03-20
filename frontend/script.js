const toggle = document.getElementById("chat-toggle");
const chatWindow = document.getElementById("chat-window");
const closeBtn = document.getElementById("chat-close");
const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("user-input");
const chatBody = document.getElementById("chat-body");

toggle.onclick = () => {
    chatWindow.style.display = "flex";
    toggle.style.display = "none";
};

closeBtn.onclick = () => {
    chatWindow.style.display = "none";
    toggle.style.display = "flex";
};

sendBtn.onclick = sendMessage;
input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});

function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user-msg");
    input.value = "";

    setTimeout(() => {
        addMessage(botReply(text), "bot-msg");
    }, 700);
}

function addMessage(text, className) {
    const msg = document.createElement("div");
    msg.className = className;
    msg.textContent = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function quickReply(text) {
    input.value = text;
    sendMessage();
}

function botReply(input) {
    input = input.toLowerCase();

    if (input.includes("complaint"))
        return "Sure! Click the 'Complaint Now' button on the homepage to submit your issue.";
    if (input.includes("track"))
        return "You can track your complaint status in the 'Track Complaints' section using your ID.";
    if (input.includes("emergency"))
        return "For urgent civic issues, please call your local emergency helpline immediately.";
    
    return "I'm here to help with civic complaints, tracking, and services. Could you give more details?";
}
