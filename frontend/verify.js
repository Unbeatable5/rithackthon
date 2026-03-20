let otp = "";
let countdown;
let timeLeft = 30;

const generateBtn = document.getElementById("generateBtn");
const verifyBtn = document.getElementById("verifyBtn");
const otpInput = document.getElementById("otpInput");
const boxes = document.querySelectorAll(".otp-boxes div");
const msg = document.getElementById("msg");
const loading = document.getElementById("loading");
const otpWrapper = document.getElementById("otpWrapper");
const timerText = document.getElementById("timer");
const userInput = document.getElementById("userInput");

function focusOTP() {
  otpInput.focus();
}

// VALIDATION
function isValid(input) {
  const phone = /^\d{10}$/;
  const email = /^\S+@\S+\.\S+$/;
  return phone.test(input) || email.test(input);
}

// GENERATE OTP
generateBtn.onclick = () => {
  let input = userInput.value.trim();

  if (!isValid(input)) {
    msg.style.color = "red";
    msg.innerText = "Enter valid phone number or email";
    return;
  }

  msg.innerText = "";
  loading.classList.remove("hidden");
  otpWrapper.classList.add("hidden");
  verifyBtn.classList.add("hidden");

  setTimeout(() => {
    loading.classList.add("hidden");

    otp = Math.floor(100000 + Math.random() * 900000).toString();
    alert("Demo OTP: " + otp);

    generateBtn.innerText = "Resend OTP";
    generateBtn.classList.remove("green");
    generateBtn.classList.add("red");

    otpWrapper.classList.remove("hidden");
    verifyBtn.classList.remove("hidden");

    startTimer();

    otpInput.value = "";
    boxes.forEach(b => b.innerText = "");
    otpInput.focus();
  }, 2000);
};

// OTP INPUT DISPLAY
otpInput.addEventListener("input", () => {
  otpInput.value = otpInput.value.replace(/\D/g, "").slice(0, 6);

  boxes.forEach((box, i) => {
    box.innerText = otpInput.value[i] || "";
  });
});

// VERIFY OTP (manual only)
verifyBtn.onclick = () => {
  if (otpInput.value === otp) {
    msg.style.color = "#489c4c";
    msg.innerText = "✅ OTP Verified Successfully";

    setTimeout(() => {
      window.location.href = "submit.html";
    }, 1500);
  } else {
    msg.style.color = "red";
    msg.innerText = "❌ Invalid OTP";
  }
};

// TIMER
function startTimer() {
  timeLeft = 30;
  timerText.classList.remove("hidden");

  countdown = setInterval(() => {
    timeLeft--;
    timerText.innerText = "Resend OTP in " + timeLeft + "s";

    if (timeLeft <= 0) {
      clearInterval(countdown);
      timerText.innerText = "You can resend OTP";
    }
  }, 1000);
}