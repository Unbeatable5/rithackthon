const toggle = document.getElementById("chat-toggle");
const chatWindow = document.getElementById("chat-window");
const closeBtn = document.getElementById("chat-close");
const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("user-input");
const chatBody = document.getElementById("chat-body");

if (toggle && chatWindow && closeBtn && sendBtn && input && chatBody) {
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
}

async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user-msg");
    input.value = "";

    const typingMsg = addMessage("", "bot-msg-typing");
    typingMsg.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

    try {
        const response = await fetch(`${apiClient.ML_BASE}/ml/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });
        const result = await response.json();
        
        typingMsg.remove();
        addMessage(result.response || "Something went wrong.", "bot-msg");
    } catch (error) {
        typingMsg.remove();
        addMessage("I'm currently disconnected from my neural core. Please try again later.", "bot-msg");
    }
}

function addMessage(text, className) {
    const msg = document.createElement("div");
    msg.className = className;
    msg.textContent = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
    return msg;
}

function quickReply(text) {
    input.value = text;
    sendMessage();
}

function handleMainAction() {
    if (localStorage.getItem('token')) {
        window.location.href = 'submit.html';
    } else {
        window.location.href = 'verify.html';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem('token')) {
        const navBtn = document.getElementById("nav-action-btn");
        if (navBtn) navBtn.innerText = "Submit Complaint";
    }
});
