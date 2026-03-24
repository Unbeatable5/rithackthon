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

verifyEmailBtn.onclick = async () => {
    const enteredOtp = emailOtpInput.value.trim();

    if (enteredOtp === generatedEmailOtp) {
        isEmailVerified = true;
        emailMsg.style.color = "#489c4c";
        emailMsg.innerText = "Email Verified! Finalizing Secure Link...";

        // Logic for Direct Aadhaar Login after Email Verification
        let aadhaar = aadhaarInput.value.trim().replace(/\s/g, '');
        const email = emailInput.value.trim();

        if (!/^\d{12}$/.test(aadhaar)) {
            emailMsg.style.color = "red";
            emailMsg.innerText = "Please enter a valid 12-digit Aadhaar first.";
            return;
        }

        try {
            const response = await fetch(`${apiClient.BASE}/api/auth/citizen/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ aadhaar, email })
            });
            const result = await response.json();

            if (response.ok && result.token) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.citizen));
                localStorage.setItem('isVerified', 'true');
                
                emailMsg.innerText = "Identity Verified! Redirecting...";
                setTimeout(() => {
                    window.location.href = "submit.html";
                }, 800);
            } else {
                emailMsg.style.color = "red";
                emailMsg.innerText = result.error || "Failed to link Aadhaar identity.";
            }
        } catch (error) {
            emailMsg.style.color = "red";
            emailMsg.innerText = "Server connection error.";
        }
    } else {
        emailMsg.style.color = "red";
        emailMsg.innerText = "Invalid OTP. Please try again.";
    }
};

// --- AADHAAR OTP LOGIC REMOVED ---
// Login now happens automatically after Email OTP verification.
