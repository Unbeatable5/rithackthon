// Check if we are running on the backend port or a different dev server
const SERVER_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") 
    ? "http://localhost:5000" 
    : "https://rithackthon-2.onrender.com";
const ML_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5001"
    : "https://rithackthon-2.onrender.com"; // Adjust if ML is on a separate Render service

const API_BASE = SERVER_URL + "/api";

const apiClient = {
    BASE: SERVER_URL,
    ML_BASE: ML_URL,

    async post(endpoint, data, isFormData = false) {
        const token = localStorage.getItem("token");
        const headers = {};
        if (!isFormData) headers["Content-Type"] = "application/json";
        if (token) headers["Authorization"] = `Bearer ${token}`;

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: "POST",
                headers: headers,
                body: isFormData ? data : JSON.stringify(data)
            });

            if (!response.ok) {
                let errData;
                try {
                    errData = await response.json();
                } catch(e) {
                    errData = { error: `Server response: ${response.status} ${response.statusText}` };
                }
                console.error(`API Error [${response.status}]:`, errData);
                return { success: false, error: errData.error || "Server failure" };
            }

            return await response.json();
        } catch (err) {
            console.error("Fetch Failure:", err);
            return { success: false, error: "Network connection failed. Ensure backend is running on 5000." };
        }
    },

    async get(endpoint) {
        const token = localStorage.getItem("token");
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: "GET",
                headers: headers
            });

            if (!response.ok) {
                let errData;
                try {
                    errData = await response.json();
                } catch(e) {
                    errData = { error: `Status ${response.status}` };
                }
                console.error(`API GET Error [${response.status}]:`, errData);
                return { success: false, error: errData.error || `Fetch failed (${response.status})` };
            }

            return await response.json();
        } catch (err) {
            console.error("GET Failure:", err);
            return { success: false, error: "Network error. Check server console." };
        }
    },

    async put(endpoint, data, isFormData = false) {
        const token = localStorage.getItem("token");
        const headers = {};
        if (!isFormData) headers["Content-Type"] = "application/json";
        if (token) headers["Authorization"] = `Bearer ${token}`;

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: "PUT",
                headers: headers,
                body: isFormData ? data : JSON.stringify(data)
            });

            if (!response.ok) {
                let errData;
                try {
                    errData = await response.json();
                } catch(e) {
                    errData = { error: `Status ${response.status}` };
                }
                console.error(`API PUT Error [${response.status}]:`, errData);
                return { success: false, error: errData.error || "Update sync failed" };
            }

            return await response.json();
        } catch (err) {
            console.error("PUT Failure:", err);
            return { success: false, error: "Communication link unstable." };
        }
    },

    async patch(endpoint, data = {}) {
        const token = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: "PATCH",
                headers: headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                return { success: false, error: errData.error || `Update failed (${response.status})` };
            }

            return await response.json();
        } catch (err) {
            console.error("PATCH Failure:", err);
            return { success: false, error: "Cloud sync failed. Check connectivity." };
        }
    }
};
