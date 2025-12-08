const modal = document.getElementById("modal");
const editFields = document.getElementById("editFields");
const editStatus = document.getElementById("editStatus");
const pageTitle = document.getElementById("page-title"); // Element for dynamic desktop title

// ===== GLOBAL FILTER STATE ADDED (FOR TABLE FILTERING) =====
let currentFilter = { roblox: 'ALL', ml: 'ALL' }; // ALL is the default filter

// ===== AUTH =====
if (localStorage.getItem("login") !== "true") {
  location.href = "login.html";
}

function logout() {
  localStorage.removeItem("login");
  location.href = "index.html";
}

// ===== DARK MODE LOGIC (UPDATED) =====
const htmlElement = document.documentElement; // Target <html> element
const darkModeToggleBtn = document.getElementById('darkModeToggle'); // Sidebar button
const mobileDarkModeToggleBtn = document.getElementById('mobileDarkModeToggle'); // Topbar button

function updateDarkModeIcon(isDark) {
    const iconClass = `fa fa-${isDark ? 'sun' : 'moon'}`;
    
    // Update Sidebar Button (full text + icon)
    if (darkModeToggleBtn) {
        darkModeToggleBtn.innerHTML = `<i class="${iconClass}"></i> <span>Toggle Dark Mode</span>`;
    }
    
    // Update Topbar Button (icon only)
    if (mobileDarkModeToggleBtn) {
        mobileDarkModeToggleBtn.innerHTML = `<i class="${iconClass}"></i>`;
    }
}

function toggleDarkMode() {
    const isDark = htmlElement.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateDarkModeIcon(isDark);
}

// Initial theme check
(function() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    let isDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
    
    if (isDark) {
        htmlElement.classList.add('dark-mode');
    }
    updateDarkModeIcon(isDark);
})();


// ===== SIDEBAR LOGIC (UPDATED) =====
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("main");
const navItems = document.querySelectorAll(".nav-item");

function toggleSidebar() {
    const isMobile = window.innerWidth <= 900;

    if (isMobile) {
        // Toggle the mobile-open class on the sidebar
        sidebar.classList.toggle('mobile-open');
        // On mobile, the collapsed class is usually removed when opening, but we toggle the 'mobile-open'
    } else {
        // Toggle the collapsed class on the sidebar and body for desktop view
        sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed');
    }
}

// Close mobile sidebar on navigation
navItems.forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
            sidebar.classList.remove('mobile-open');
        }
    });
});

// Sidebar collapse handling on window resize
window.addEventListener('resize', () => {
    const isMobile = window.innerWidth <= 900;
    
    // If resizing to desktop, ensure the mobile-open class is removed
    if (!isMobile) {
        sidebar.classList.remove('mobile-open');
        // Ensure desktop state is correctly applied based on body class
        if (document.body.classList.contains('sidebar-collapsed')) {
             sidebar.classList.add('collapsed');
        } else {
             sidebar.classList.remove('collapsed');
        }
    } else {
        // On mobile, ensure the desktop collapsed class is removed if sidebar is closed
        if (!sidebar.classList.contains('mobile-open')) {
            sidebar.classList.remove('collapsed');
            document.body.classList.remove('sidebar-collapsed');
        }
    }
});
// Initial check to ensure correct state on load
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth > 900) {
        // Only apply desktop collapse state if not on mobile
        sidebar.classList.toggle('collapsed', localStorage.getItem('sidebar-collapsed') === 'true');
        document.body.classList.toggle('sidebar-collapsed', localStorage.getItem('sidebar-collapsed') === 'true');
    }
});


// ===== PAGE SWITCHING & TITLE UPDATE =====
const pages = document.querySelectorAll(".page");

function showPage(pageId) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");

  navItems.forEach(item => item.classList.remove('active'));
  const activeNavItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  }

  // Update Page Title
  if (pageTitle) {
      pageTitle.textContent = activeNavItem ? activeNavItem.querySelector('span').textContent : 'Dashboard';
  }

  // Reset filters when switching main pages (optional, but safer)
  if (pageId === 'roblox') {
      setFilter('roblox', currentFilter.roblox);
  } else if (pageId === 'ml') {
      setFilter('ml', currentFilter.ml);
  }
}

// ===== FILTER LOGIC =====
function setFilter(game, status) {
    currentFilter[game] = status;

    // Update active state on the filter buttons
    const filterButtons = document.querySelectorAll(`#${game}-filters .btn-filter`);
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === status) {
            btn.classList.add('active');
        }
    });

    // Re-render the relevant table
    render();
}


// ===== TRANSACTION DATA & RENDER =====
let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");

const statusMap = {
    UNPENDING: "UNPENDING",
    PROCESSING: "PROCESSING",
    DONE: "DONE",
    DELAYED: "DELAYED",
    CANCELLED: "CANCELLED"
};

const statusSelect = document.getElementById("status");
// Populate status dropdown for Add Transaction
Object.values(statusMap).forEach(status => {
    const opt = document.createElement("option");
    opt.value = status;
    opt.textContent = status;
    statusSelect.appendChild(opt);
});


// Helper function to calculate time difference
function getTimeDifference(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;

    // Check if the difference is negative (date in future)
    if (diffInMs < 0) return "0 Days"; 

    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffInDays > 0) {
        return `${diffInDays} Days`;
    } else if (diffInHours > 0) {
        return `${diffInHours} Hrs`;
    } else if (diffInMinutes > 0) {
        return `${diffInMinutes} Mins`;
    } else {
        return "Now";
    }
}


function render() {
  const robloxBody = document.getElementById("robloxTable");
  const mlBody = document.getElementById("mlTable");
  robloxBody.innerHTML = "";
  mlBody.innerHTML = "";

  let totalCount = 0;
  let unpendingCount = 0;
  let processingCount = 0;

  transactions.forEach((t, index) => {
    totalCount++;
    if (t.status === "UNPENDING") unpendingCount++;
    if (t.status === "PROCESSING") processingCount++;

    // Apply filtering before rendering
    if (t.game === 'Roblox' && currentFilter.roblox !== 'ALL' && t.status !== currentFilter.roblox) {
        return;
    }
    if (t.game === 'ML' && currentFilter.ml !== 'ALL' && t.status !== currentFilter.ml) {
        return;
    }

    const row = document.createElement("tr");
    const date = new Date(t.date).toLocaleDateString();
    
    // Calculate time passed
    let timePassedText = 'N/A';
    if (t.status === 'DONE' && t.completionDate) {
        // If done, calculate days since order date to completion date
        const orderDate = new Date(t.date);
        const completionDate = new Date(t.completionDate);
        const diffInMs = completionDate - orderDate;
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
        timePassedText = `${diffInDays} Day${diffInDays !== 1 ? 's' : ''}`;
    } else if (t.status !== 'DONE' && t.status !== 'CANCELLED') {
        // If not done, calculate time since order date to now
        timePassedText = getTimeDifference(t.date);
    }
    
    const statusBadge = `<span class="${t.status}"><i class="fa fa-circle-dot"></i> ${t.status}</span>`;
    const actionButton = `<button onclick="openEditModal(${index})"><i class="fa fa-pen-to-square"></i></button>`;

    if (t.game === "Roblox") {
      row.innerHTML = `
        <td>${date}</td>
        <td>${t.facebook}</td>
        <td>${t.username}</td>
        <td>${t.amount}</td>
        <td>${t.payment}</td>
        <td>${t.speed}</td>
        <td>₱${t.price}</td>
        <td>${statusBadge}</td>
        <td>${timePassedText}</td>
        <td>${actionButton}</td>
      `;
      robloxBody.appendChild(row);
    } else if (t.game === "ML") {
      row.innerHTML = `
        <td>${date}</td>
        <td>${t.facebook}</td>
        <td>${t.username}</td>
        <td>${t.id}</td>
        <td>${t.server}</td>
        <td>${t.type}</td>
        <td>${t.paymentStatus}</td>
        <td>₱${t.price}</td>
        <td>${statusBadge}</td>
        <td>${timePassedText}</td>
        <td>${actionButton}</td>
      `;
      mlBody.appendChild(row);
    }
  });

  // Update Dashboard Stats
  document.getElementById("stat-total").textContent = totalCount;
  document.getElementById("stat-unpending").textContent = unpendingCount;
  document.getElementById("stat-processing").textContent = processingCount;
}

render(); // Initial render on load


// ===== ADD TRANSACTION LOGIC =====
const gameType = document.getElementById("gameType");
const gameFields = document.getElementById("gameFields");
const robloxForm = document.getElementById("robloxForm");
const mlForm = document.getElementById("mlForm");

gameType.onchange = () => {
  gameFields.classList.remove("hidden");
  robloxForm.classList.add("hidden");
  mlForm.classList.add("hidden");

  if (gameType.value === "Roblox") {
    robloxForm.classList.remove("hidden");
  } else if (gameType.value === "ML") {
    mlForm.classList.remove("hidden");
  } else {
    gameFields.classList.add("hidden");
  }
};

document.getElementById("addBtn").onclick = () => {
  const game = gameType.value;
  const status = document.getElementById("status").value;

  let newTransaction = {
    game: game,
    status: status,
    date: new Date().toISOString()
  };

  if (game === "Roblox") {
    newTransaction.facebook = document.getElementById("rbFacebook").value;
    newTransaction.username = document.getElementById("rbUsername").value;
    newTransaction.amount = document.getElementById("rbAmount").value;
    newTransaction.payment = document.getElementById("rbPayment").value;
    newTransaction.speed = document.getElementById("rbSpeed").value;
    newTransaction.price = document.getElementById("rbPrice").value;
  } else if (game === "ML") {
    newTransaction.facebook = document.getElementById("mlFacebook").value;
    newTransaction.username = document.getElementById("mlUsername").value;
    newTransaction.id = document.getElementById("mlID").value;
    newTransaction.server = document.getElementById("mlServer").value;
    newTransaction.type = document.getElementById("mlType").value;
    newTransaction.paymentStatus = document.getElementById("mlPayment").value;
    newTransaction.price = document.getElementById("mlPrice").value;
  } else {
    alertToast("Please select a game.");
    return;
  }

  // Simple validation
  if (!newTransaction.facebook || !newTransaction.price) {
    alertToast("Please fill out all required fields.");
    return;
  }

  // If initial status is DONE, set the completion date immediately
  if (status === 'DONE') {
      newTransaction.completionDate = new Date().toISOString();
  }


  transactions.unshift(newTransaction);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  
  // Clear fields and reset form
  document.querySelectorAll('#robloxForm input, #mlForm input').forEach(input => input.value = '');
  document.getElementById("rbAmount").value = '';
  document.getElementById("rbPrice").value = '';
  document.getElementById("mlPrice").value = '';

  render();
  alertToast("Transaction Added! 🚀");
};


// ===== EDIT MODAL LOGIC =====
let editIndex = -1;

function openEditModal(index) {
  editIndex = index;
  const t = transactions[index];
  editFields.innerHTML = "";
  editStatus.value = t.status;

  // Fields to dynamically generate in the modal
  let fields = [];
  if (t.game === "Roblox") {
    fields = [
      { key: "facebook", label: "Facebook" },
      { key: "username", label: "Roblox Username" },
      { key: "amount", label: "Robux Amount", type: "number" },
      { key: "payment", label: "Payment (CT/NCT)", type: "select", options: ["CT", "NCT"] },
      { key: "speed", label: "Processing Speed", type: "select", options: ["FAST", "SLOW", "MINS"] },
      { key: "price", label: "Price (₱)", type: "number" }
    ];
  } else if (t.game === "ML") {
    fields = [
      { key: "facebook", label: "Facebook" },
      { key: "username", label: "IGN" },
      { key: "id", label: "ML ID" },
      { key: "server", label: "Server" },
      { key: "type", label: "Type", type: "select", options: ["Skin", "Starlight", "Emotes", "Others"] },
      { key: "paymentStatus", label: "Payment Status", type: "select", options: ["PAID", "HALF", "NOT PAID"] },
      { key: "price", label: "Price (₱)", type: "number" }
    ];
  }

  fields.forEach(field => {
    const div = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = field.label;
    label.setAttribute("for", `edit-${field.key}`);

    let input;
    if (field.type === "select") {
        input = document.createElement("select");
        field.options.forEach(optVal => {
            const opt = document.createElement("option");
            opt.value = opt.textContent = optVal;
            input.appendChild(opt);
        });
    } else {
        input = document.createElement("input");
        input.type = field.type || "text";
        input.placeholder = field.label;
    }

    input.id = `edit-${field.key}`;
    input.value = t[field.key];
    input.setAttribute("data-key", field.key); // For easy save retrieval

    div.appendChild(label);
    div.appendChild(input);
    editFields.appendChild(div);
  });

  modal.style.display = "flex";
}

const saveEditBtn = document.getElementById("saveEditBtn");
const deleteBtn = document.getElementById("deleteBtn");
const cancelBtn = document.getElementById("cancelBtn");

saveEditBtn.onclick = () => {
  document.querySelectorAll("#editFields [data-key]").forEach(inp => {
    const key = inp.getAttribute("data-key");
    if (transactions[editIndex] && transactions[editIndex][key] !== undefined) {
        transactions[editIndex][key] = inp.value;
    }
  });
  
  // NEW LOGIC: Record or clear completion date based on status change
  const newStatus = editStatus.value;
  const currentTransaction = transactions[editIndex];

  // 1. If status is set to DONE, record the completion date if it wasn't already done.
  if (newStatus === 'DONE' && currentTransaction.status !== 'DONE') {
      currentTransaction.completionDate = new Date().toISOString();
  } 
  // 2. If status is changed away from DONE, remove the completion date.
  else if (newStatus !== 'DONE') {
      delete currentTransaction.completionDate;
  }

  // Set the new status
  currentTransaction.status = newStatus;


  localStorage.setItem("transactions", JSON.stringify(transactions));
  modal.style.display = "none";
  render();
  alertToast("Transaction Updated ✨");
};

deleteBtn.onclick = () => {
  transactions.splice(editIndex, 1);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  modal.style.display = "none";
  render();
  alertToast("Transaction Deleted 🗑️");
};


cancelBtn.onclick = () => modal.style.display = "none";

// ===== TOAST =====
function alertToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(() => {
    t.style.display = "none";
  }, 3000);
}