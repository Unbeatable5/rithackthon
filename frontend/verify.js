/**
 * CIVICSENSE - CITIZEN VERIFICATION (ADHAAR + EMAIL OTP)
 * Integrated with EmailJS for real email delivery.
 */

// 1. EmailJS Configuration - USER MUST FILL THESE
const EMAILJS_CONFIG = {
    PUBLIC_KEY: "16UYtK9UcGeWLzTRi",    // Replace with your EmailJS Public Key
    SERVICE_ID: "service_wwlyg6x",    // Replace with your EmailJS Service ID
    TEMPLATE_ID: "template_tqllo7l"   // Replace with your EmailJS Template ID
};

// Initialize EmailJS
(function () {
    if (EMAILJS_CONFIG.PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    }
})();

let generatedEmailOtp = null;
let isEmailVerified = false;

// UI Elements
const aadhaarInput = document.getElementById("userInput");
const emailInput = document.getElementById("emailInput");
const sendEmailBtn = document.getElementById("sendEmailOtpBtn");
const emailWrapper = document.getElementById("emailOtpWrapper");
const emailOtpInput = document.getElementById("emailOtpInput");
const verifyEmailBtn = document.getElementById("verifyEmailOtpBtn");
const emailMsg = document.getElementById("emailOtpMsg");

const generateBtn = document.getElementById("generateBtn"); // Aadhaar OTP Button
const otpWrapper = document.getElementById("otpWrapper");
const otpInput = document.getElementById("otpInput");
const verifyBtn = document.getElementById("verifyBtn"); // Final Submit Button
const boxes = document.querySelectorAll(".otp-boxes div");
const mainMsg = document.getElementById("msg"); // Renamed from msg for clarity
const loading = document.getElementById("loading");

// --- EMAIL OTP LOGIC ---

sendEmailBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    if (EMAILJS_CONFIG.PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
        alert("EmailJS is not configured. Please see the 'Real Email OTP Setup Guide' artifact for instructions.");
        return;
    }

    sendEmailBtn.innerText = "Sending...";
    sendEmailBtn.disabled = true;

    // Generate 6-digit OTP
    generatedEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            {
                to_email: email,
                otp: generatedEmailOtp
            }
        );

        if (response.status === 200) {
            emailMsg.style.color = "#489c4c";
            emailMsg.innerText = "OTP sent to your email! Check your inbox.";
            emailWrapper.classList.remove("hidden");
            sendEmailBtn.innerText = "Resend";
            sendEmailBtn.disabled = false;
        } else {
            throw new Error(`EmailJS Error: ${response.text || "Unknown error"}`);
        }
    } catch (error) {
        console.error("Email Error:", error);

        // Provide specific advice based on common EmailJS errors
        let advice = "Check your console for details.";
        if (error.text) advice = error.text;
        else if (error.message) advice = error.message;

        alert(`Email Failed: ${advice}\n\nTroubleshooting:\n1. Verify your Service ID & Template ID.\n2. Ensure your Public Key is correct.\n3. Check your EmailJS monthly quota.`);

        sendEmailBtn.innerText = "Send OTP";
        sendEmailBtn.disabled = false;
    }
};

verifyEmailBtn.onclick = () => {
    const enteredOtp = emailOtpInput.value.trim();

    if (enteredOtp === generatedEmailOtp) {
        isEmailVerified = true;
        emailMsg.style.color = "#489c4c";
        emailMsg.innerText = "Email Verified Successfully! ✅";

        // Disable email editing
        emailInput.disabled = true;
        emailOtpInput.disabled = true;
        sendEmailBtn.style.display = "none";
        verifyEmailBtn.style.display = "none";

        // Enable Aadhaar phase
        generateBtn.disabled = false;
        generateBtn.classList.remove("disabled");
        generateBtn.title = "Proceed with Aadhaar verification";
    } else {
        emailMsg.style.color = "red";
        emailMsg.innerText = "Invalid OTP. Please try again.";
    }
};

// --- AADHAAR OTP LOGIC (Existing) ---

generateBtn.onclick = async () => {
    if (!isEmailVerified) return;

    let aadhaar = aadhaarInput.value.trim().replace(/\s/g, '');

    if (!/^\d{12}$/.test(aadhaar)) {
        mainMsg.style.color = "red";
        mainMsg.innerText = "Enter a valid 12-digit Aadhaar number";
        return;
    }

    mainMsg.innerText = "";
    loading.classList.remove("hidden");
    otpWrapper.classList.add("hidden");
    verifyBtn.classList.add("hidden");

    try {
        const response = await fetch("http://localhost:5000/api/auth/citizen/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aadhaar })
        });
        const result = await response.json();

        loading.classList.add("hidden");
        if (response.ok) {
            mainMsg.style.color = "#489c4c";
            mainMsg.innerText = `Aadhaar OTP sent for suffix ${aadhaar.slice(-4)}`;

            generateBtn.innerText = "Resend Aadhaar OTP";
            generateBtn.style.background = "#dc2626";

            otpWrapper.classList.remove("hidden");
            verifyBtn.classList.remove("hidden");
            otpInput.value = "";
            boxes.forEach(b => b.innerText = "");
            otpInput.focus();
        } else {
            mainMsg.style.color = "red";
            mainMsg.innerText = result.error || "Failed to initiate Aadhaar verification";
        }
    } catch (error) {
        loading.classList.add("hidden");
        mainMsg.style.color = "red";
        mainMsg.innerText = "Server unreachable";
    }
};

// OTP Input Visuals
otpInput.addEventListener("input", () => {
    otpInput.value = otpInput.value.replace(/\D/g, "").slice(0, 6);
    boxes.forEach((box, i) => {
        box.innerText = otpInput.value[i] || "";
    });
});

function focusOTP() {
    otpInput.focus();
}

// FINAL VERIFICATION & SUBMIT
verifyBtn.onclick = async () => {
    const aadhaar = aadhaarInput.value.trim().replace(/\s/g, '');
    const otp = otpInput.value;

    if (otp.length !== 6) {
        mainMsg.style.color = "red";
        mainMsg.innerText = "Enter 6-digit Aadhaar OTP";
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/auth/citizen/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aadhaar, otp })
        });
        const result = await response.json();

        if (response.ok) {
            mainMsg.style.color = "#489c4c";
            mainMsg.innerText = "Identity Verified Successfully! Finalizing complaint...";

            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.citizen));
            localStorage.setItem('isVerified', 'true');

            setTimeout(() => {
                window.location.href = "submit.html";
            }, 1000);
        } else {
            mainMsg.style.color = "red";
            mainMsg.innerText = result.error || "Invalid Aadhaar OTP";
        }
    } catch (error) {
        mainMsg.style.color = "red";
        mainMsg.innerText = "Server connection error";
    }
};
