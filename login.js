function login() {
  const u = (document.getElementById("username") || {}).value || "";
  const p = (document.getElementById("password") || {}).value || "";
  const errorMsg = document.getElementById("errorMsg");
  if (u === "admin" && p === "admin123") {
    localStorage.setItem("login", "true");
    // redirect to main dashboard
    location.href = "index.html";
  } else {
    if (errorMsg) errorMsg.textContent = "Invalid username or password";
  }
}