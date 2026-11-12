
// FOOD SAVER SYSTEM

let foods = JSON.parse(localStorage.getItem("foods")) || [];

// SAVE DATA
function saveData() {
    localStorage.setItem("foods", JSON.stringify(foods));
}

// CHECK EXPIRATION STATUS
function getStatus(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(date + "T00:00:00");
    const days = Math.ceil((expiry - today) / 86400000);

    if (days < 0) {
        return { status: "Expired", days: days };
    } else if (days <= 7) {
        return { status: "Expiring Soon", days: days };
    } else {
        return { status: "Safe", days: days };
    }
}

// ESCAPE TEXT
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ADD AND UPDATE PRODUCT
document.addEventListener("DOMContentLoaded", function() {

    const foodForm = document.getElementById("foodForm");

    foodForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const name = document.getElementById("foodName").value.trim();
        const category = document.getElementById("category").value;
        const quantity = Number(document.getElementById("quantity").value);
        const expiration = document.getElementById("expirationDate").value;

        const editIndex = document.getElementById("editIndex").value;

        if (!name || !category || !expiration || quantity < 1) {
            alert("Please complete all fields correctly!");
            return;
        }

        const product = {
            name: name,
            category: category,
            quantity: quantity,
            expiration: expiration
        };

        if (editIndex === "") {
            foods.push(product);
            alert("Food product added successfully!");
        } else {
            foods[Number(editIndex)] = product;
            alert("Food product updated successfully!");
        }

        saveData();

        foodForm.reset();

        document.getElementById("editIndex").value = "";
        document.getElementById("saveButton").textContent = "Add Product";

        updateSystem();
    });

    updateSystem();
});

// DISPLAY INVENTORY
function renderInventory() {

    const list = document.getElementById("inventoryList");
    const searchElement = document.getElementById("searchInput");

    const search = searchElement ? searchElement.value.toLowerCase() : "";

    list.innerHTML = "";

    foods.forEach((food, index) => {

        if (!food.name.toLowerCase().includes(search)) return;

        const info = getStatus(food.expiration);

        const statusClass = info.days < 0
            ? "expired"
            : info.days <= 7
            ? "soon"
            : "safe";

        list.innerHTML += `
            <tr>
                <td>${escapeHTML(food.name)}</td>
                <td>${escapeHTML(food.category)}</td>
                <td>${food.quantity}</td>
                <td>${food.expiration}</td>
                <td>
                    <span class="status ${statusClass}">
                        ${info.status}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit"
                    onclick="editFood(${index})">Edit</button>

                    <button class="action-btn delete"
                    onclick="deleteFood(${index})">Delete</button>
                </td>
            </tr>
        `;
    });
}

// EDIT PRODUCT
function editFood(index) {

    const food = foods[index];

    document.getElementById("foodName").value = food.name;
    document.getElementById("category").value = food.category;
    document.getElementById("quantity").value = food.quantity;
    document.getElementById("expirationDate").value = food.expiration;

    document.getElementById("editIndex").value = index;

    document.getElementById("saveButton").textContent = "Update Product";

    showPage("inventory", document.querySelectorAll(".sidebar a")[1]);

    window.scrollTo(0, 0);
}

// DELETE PRODUCT
function deleteFood(index) {

    if (confirm("Are you sure you want to delete this product?")) {

        foods.splice(index, 1);

        saveData();

        updateSystem();

        alert("Product deleted successfully!");
    }
}

// DASHBOARD
function updateDashboard() {

    document.getElementById("totalProducts").textContent = foods.length;

    const stocks = foods.reduce((total, food) => {
        return total + Number(food.quantity);
    }, 0);

    document.getElementById("totalStocks").textContent = stocks;

    const soon = foods.filter(food => {
        const info = getStatus(food.expiration);
        return info.days >= 0 && info.days <= 7;
    });

    document.getElementById("expiringSoon").textContent = soon.length;

    const expired = foods.filter(food => {
        return getStatus(food.expiration).days < 0;
    });

    document.getElementById("expiredProducts").textContent = expired.length;

    const recent = document.getElementById("recentProducts");

    if (foods.length === 0) {

        recent.innerHTML = "<p>No food products available.</p>";

    } else {

        recent.innerHTML = foods.slice(-5).reverse().map(food => {

            return `
                <p>
                    ${escapeHTML(food.name)}
                    - ${food.quantity} stocks
                </p>
                <hr style="margin:10px 0">
            `;

        }).join("");
    }
}

// EXPIRATION TRACKER
function renderExpiration() {

    const list = document.getElementById("expirationList");

    list.innerHTML = "";

    const sorted = [...foods].sort((a, b) => {
        return a.expiration.localeCompare(b.expiration);
    });

    sorted.forEach(food => {

        const info = getStatus(food.expiration);

        const statusClass = info.days < 0
            ? "expired"
            : info.days <= 7
            ? "soon"
            : "safe";

        let remaining;

        if (info.days < 0) {
            remaining = Math.abs(info.days) + " days overdue";
        } else if (info.days === 0) {
            remaining = "Expires today";
        } else {
            remaining = info.days + " days";
        }

        list.innerHTML += `
            <tr>
                <td>${escapeHTML(food.name)}</td>
                <td>${food.quantity}</td>
                <td>${food.expiration}</td>
                <td>${remaining}</td>
                <td>
                    <span class="status ${statusClass}">
                        ${info.status}
                    </span>
                </td>
            </tr>
        `;
    });
}

// NOTIFICATIONS
function renderNotifications() {

    const list = document.getElementById("notificationList");

    const alerts = foods.filter(food => {
        return getStatus(food.expiration).days <= 7;
    });

    document.getElementById("notifCount").textContent =
        alerts.length > 0 ? alerts.length : "";

    if (alerts.length === 0) {

        list.innerHTML = `
            <p>No notifications available.</p>
            <p>All food products are safe!</p>
        `;

        return;
    }

    list.innerHTML = "";

    alerts.forEach(food => {

        const info = getStatus(food.expiration);

        const expired = info.days < 0;

        let message;

        if (expired) {
            message = Math.abs(info.days) + " days overdue";
        } else if (info.days === 0) {
            message = "Expires today";
        } else {
            message = "Expires in " + info.days + " days";
        }

        list.innerHTML += `
            <div class="notification ${expired ? "expired-notif" : ""}">

                <strong>
                    ${expired ? "⚠ Expired Product" : "🔔 Expiring Soon"}
                </strong>

                <p>${escapeHTML(food.name)}</p>

                <p>${message}</p>

                <small>
                    Expiration Date: ${food.expiration}
                </small>

            </div>
        `;
    });
}

// NAVIGATION
function showPage(page, link) {

    document.querySelectorAll(".page").forEach(section => {
        section.classList.add("hidden");
    });

    document.getElementById(page).classList.remove("hidden");

    document.getElementById("pageTitle").textContent =
        page === "inventory" ? "Food Inventory" :
        page === "expiration" ? "Expiration Tracker" :
        page === "notifications" ? "Notifications" :
        "Dashboard";

    document.querySelectorAll(".sidebar a").forEach(a => {
        a.classList.remove("active");
    });

    link.classList.add("active");

    updateSystem();
}

// UPDATE ALL MODULES
function updateSystem() {

    updateDashboard();

    renderInventory();

    renderExpiration();

    renderNotifications();
    }
                                
