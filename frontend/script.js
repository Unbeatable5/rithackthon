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
        addMessage(result.response || "I am currently processing high-priority data. How else can I assist?", "bot-msg");
    } catch (error) {
        typingMsg.remove();
        console.warn("[*] Neural Core Offline. Activating Autonomous Protocol.");

        // --- AUTONOMOUS HEURISTIC BRAIN ---
        const t = text.toLowerCase();
        let reply = "I understand. I'm here to help you navigate our city's services. What specific issue are you facing?";

        if (t.includes("status") || t.includes("track")) {
            reply = "You can track any complaint by entering your Strategic ID in the **Track Status** portal.";
        } else if (t.includes("report") || t.includes("file") || t.includes("complaint")) {
            reply = "To report a new issue, go to the **Report Issue** section. I will automatically route it to the correct department.";
        } else if (t.includes("water") || t.includes("leak")) {
            reply = "Water pipe or leakage issues are handled by the Water Department. Please provide the exact location for deployment.";
        } else if (t.includes("hello") || t.includes("hi")) {
            reply = "Hello! I am CivicSense AI. I can help you report issues or track your grievances. What's on your mind?";
        } else if (t.includes("who") || t.includes("you")) {
            reply = "I am the CivicSense AI Assistant, designed to ensure transparent and fast governance for every citizen.";
        }
        
        addMessage(reply, "bot-msg");
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
