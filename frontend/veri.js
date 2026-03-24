const verifyForm = document.getElementById("verifyForm");
const msg = document.getElementById("msg");

if (verifyForm) {
    verifyForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const email = document.getElementById("authId").value;
        const password = document.getElementById("password").value;
        const department = document.getElementById("department").value;

        msg.style.color = "#1E3A8A";
        msg.innerText = "Authenticating with Government Server...";

        try {
            const result = await apiClient.post("/auth/authority/login", { email, password });
            
            if (result.token) {
                msg.style.color = "#489c4c";
                msg.innerText = "Authentication Successful. Redirecting...";
                
                localStorage.setItem("token", result.token);
                localStorage.setItem("authority", JSON.stringify(result.authority));
                
                setTimeout(() => {
                    window.location.href = "dash.html";
                }, 1200);
            } else {
                msg.style.color = "#ef4444";
                msg.innerText = (result.error || "Invalid Credentials");
            }
        } catch (error) {
            msg.style.color = "#ef4444";
            msg.innerText = "Server Connection Error";
        }
    };
}
