const API_BASE = window.location.origin;

// ================= LOGIN FUNCTION =================
async function login(username, password) {
  try {
    const res = await fetch(API_BASE + "/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    const data = await res.json();

    if (data.success) {
      alert("Login successful");
      window.location.href = "/admin/dashboard";
    } else {
      alert("Invalid username or password");
    }

  } catch (err) {
    console.error("Login error:", err);
    alert("Server error");
  }
}

// ================= FORM SUBMIT =================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  if (form) {
    form.addEventListener("submit", function(e) {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      login(username, password);
    });
  }
});