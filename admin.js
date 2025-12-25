function safe(val, fallback = "-") {
  return val !== undefined && val !== null && val !== ""
    ? val
    : fallback;
}

function money(val) {
  return typeof val === "number"
    ? `₹${val}`
    : "₹0";
}


/* ---------------------------------------------------
   CHECK ADMIN LOGIN
--------------------------------------------------- */
const token = localStorage.getItem("adminToken");
if (!token) window.location.href = "adminlogin.html";

/* ---------------------------------------------------
   INPUT ELEMENTS 
--------------------------------------------------- */
const brand = document.getElementById("brand");
const model = document.getElementById("model");
const category = document.getElementById("category");
const fuel = document.getElementById("fuel");
const seats = document.getElementById("seats");
const transmission = document.getElementById("transmission");
const price = document.getElementById("price");
const images = document.getElementById("images");

const color = document.getElementById("color");
const modelYear = document.getElementById("modelYear");
const mileage = document.getElementById("mileage");
const bootSpace = document.getElementById("bootSpace");
const tankCapacity = document.getElementById("tankCapacity");

/* ---------------------------------------------------
   BRAND → MODEL DATA
--------------------------------------------------- */
const carModels = {
  // Existing
  Hyundai: ["i10", "i20", "Verna", "Creta", "Venue", "Alcazar"],
  Toyota: ["Innova Crysta", "Fortuner", "Glanza", "Camry"],
  Honda: ["City", "Amaze", "Jazz"],
  Kia: ["Seltos", "Sonet", "Carens"],
  Tata: ["Nexon", "Harrier", "Safari", "Altroz"],
  Mahindra: ["Thar", "XUV700", "Scorpio"],

  // 🔥 Newly added brands (models added)
  "Maruti Suzuki": ["Swift", "Baleno", "Dzire", "Brezza", "Ertiga"],
  Renault: ["Kwid", "Triber", "Kiger"],
  Nissan: ["Magnite", "Kicks"],
  Skoda: ["Slavia", "Kushaq", "Octavia"],
  Volkswagen: ["Virtus", "Taigun", "Vento"],
  MG: ["Hector", "Astor", "ZS EV"],

  BMW: ["X1", "X3", "X5", "3 Series", "5 Series"],
  Audi: ["A4", "A6", "Q3", "Q5"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLA", "GLC"],
  Volvo: ["XC40", "XC60"],
  Jaguar: ["XE", "XF", "F-Pace"],
  Porsche: ["Cayenne", "Macan"],

  // Always keep this
  Other: []
};


/* ---------------------------------------------------
   Load Models based on Brand
--------------------------------------------------- */

function loadModels() {
  const brandSelect = document.getElementById("brand");
  const modelSelect = document.getElementById("model");
  const customInput = document.getElementById("customModel");

  const brandName = brandSelect.value;

  modelSelect.innerHTML = `<option disabled selected>Select Model</option>`;

  // 🔐 Safety check
  if (!carModels[brandName]) {
    carModels[brandName] = [];
  }

  carModels[brandName].forEach(m => {
    modelSelect.innerHTML += `<option value="${m}">${m}</option>`;
  });

  // Always allow manual entry
  modelSelect.innerHTML += `<option value="__custom__">Other / Manual</option>`;

  customInput.style.display = "none";
  customInput.value = "";
}

function checkCustomModel() {
  const modelSelect = document.getElementById("model");
  const customInput = document.getElementById("customModel");

  if (modelSelect.value === "__custom__") {
    customInput.style.display = "block";
    customInput.focus();
  } else {
    customInput.style.display = "none";
    customInput.value = "";
  }
}




/* ---------------------------------------------------
   ADD CAR
--------------------------------------------------- */
async function addCar() {
  if (
    !brand.value ||
    !model.value ||
    !category.value ||
    !fuel.value ||
    !seats.value ||
    !transmission.value ||
    !document.getElementById("tag").value ||
    !images.files.length
  ) {
    return alert("All fields are required!");
  }

  const btn = document.querySelector(".btn");
  btn.innerText = "Adding...";
  btn.disabled = true;

  const fd = new FormData();

  fd.append("brand", brand.value);
  const finalModel =
    model.value === "__custom__"
      ? document.getElementById("customModel").value.trim()
      : model.value;

  if (!finalModel) {
    alert("Please select or enter model name");
    btn.disabled = false;
    btn.innerText = "Add Car";
    return;
  }

  fd.append("name", finalModel);

  fd.append("category", category.value);
  fd.append("fuel", fuel.value);
  fd.append("seats", seats.value);
  fd.append("transmission", transmission.value);

  fd.append("color", color.value || "");
  fd.append("modelYear", modelYear.value || "");
  fd.append("mileage", mileage.value || "");
  fd.append("bootSpace", bootSpace.value || "");
  fd.append("tankCapacity", tankCapacity.value || "");

  fd.append("rentPrice", price.value || 0);
  fd.append("subscribePrice", document.getElementById("subscribePrice").value || 0);
  fd.append("tag", document.getElementById("tag").value);
  fd.append("primaryImageIndex", primaryImageIndex);

  const files = Array.from(images.files);

files.forEach(file => {
  fd.append("images", file);
});


  




  const res = await fetch("https://goridezz-backend.onrender.com/api/cars", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    body: fd
  });

  const data = await res.json();
  btn.innerText = "Add Car";
  btn.disabled = false;

  if (!data.success) {
    showStatus("❌ Failed to add car. Please try again.", "error");
    btn.innerText = "Add Car";
    btn.disabled = false;
    return;
  }

  // ✅ SUCCESS UI MESSAGE
  showStatus("🚗 Car added successfully! Redirecting...", "success");

  // ⏳ Redirect after 2 seconds
  setTimeout(() => {
    window.location.href = "admindashboard.html";
  }, 2000);


}

/* ---------------------------------------------------
   LOAD CARS
--------------------------------------------------- */
async function loadCars() {
  const list = document.getElementById("carsList");
  if (!list) return;

  const res = await fetch("https://goridezz-backend.onrender.com/api/cars");
  const data = await res.json();

  list.innerHTML = "";

  data.cars.forEach(c => {
    list.innerHTML += `
  <div class="car-card">

    <div class="admin-img-slider">
      <div class="admin-img-track" id="track-${c._id}">
        ${c.imageUrls.map(url => `
          <div class="admin-slide"><img src="${url}"></div>
        `).join("")}
      </div>

      <div class="admin-arrow admin-prev" onclick="prevAdminSlide('${c._id}')">❮</div>
      <div class="admin-arrow admin-next" onclick="nextAdminSlide('${c._id}')">❯</div>
    </div>

    <h3 style="color:#ffd700;">${c.brand} ${c.name}</h3>
    <p>${c.category}</p>
    <p>${c.transmission} · ${c.seats} seats</p>
    <p><b>₹${c.rentPrice || 0}/day</b></p>
    <p style="color:#ffd700;">Subscribe: ₹${c.subscribePrice || 0}/month</p>
    <p style="font-size:12px;">Type: ${c.tag}</p>

    <button class="delete-btn" onclick="deleteCar('${c._id}')">Delete</button>
  </div>
`;

  });
}

/* ---------------------------------------------------
   DELETE CAR
--------------------------------------------------- */
async function deleteCar(id) {
  await fetch(`https://goridezz-backend.onrender.com/api/cars/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token }
  });

  loadCars();
}

/* ---------------------------------------------------
   LOAD BOOKINGS
--------------------------------------------------- */
async function loadBookings() {
  console.log("loadBookings called");

  const table = document.getElementById("bookingList");
  if (!table) return;

  const token = localStorage.getItem("adminToken");

  const res = await fetch("https://goridezz-backend.onrender.com/api/bookings", {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();
  console.log("Bookings API data:", data);
  table.innerHTML = "";

  if (!data.success || data.bookings.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="15" style="text-align:center;color:white;">
          No bookings found
        </td>
      </tr>`;
    return;
  }
  data.bookings.forEach(b => {
    table.innerHTML += `
    <tr>
      <td>${safe(b.fullname)}</td>
      <td>${safe(b.email)}</td>
      <td>${safe(b.contact)}</td>

      <td>
        ${b.carId
        ? `${safe(b.carId.brand)} ${safe(b.carId.name)}`
        : "Deleted Car"}
      </td>

      <td>
        ${safe(b.pickupDate)}
        ${safe(b.pickupTime, "")}
      </td>

      <td>
        ${safe(b.returnDate)}
        ${safe(b.returnTime, "")}
      </td>

      <td>${safe(b.visitPlace)}</td>

      <td>${money(b.totalAmount)}</td>
      <td>${money(b.advancePaid)}</td>
      <td>${money(b.remainingAmount)}</td>

      <td>${safe(b.depositType)}</td>

      <td style="color:${b.userStatus === "cancelled" ? "red" : "#00ff7f"}">
        ${safe(b.userStatus)}
      </td>

      <td>${safe(b.adminStatus)}</td>

      <td>${new Date(b.createdAt).toLocaleDateString()}</td>

      <td>
        <button onclick="downloadBooking('${b._id}')">PDF</button>
      </td>
    </tr>
  `;
  });

}




/* ---------------------------------------------------
   LOAD USERS
--------------------------------------------------- */
async function loadUsers() {
  const box = document.getElementById("usersList");
  if (!box) return;

  const res = await fetch("https://goridezz-backend.onrender.com/api/auth/users");
  const data = await res.json();

  box.innerHTML = "";

  data.users.forEach(u => {
    box.innerHTML += `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.phone || "-"}</td>
        <td>${new Date(u.createdAt).toLocaleDateString()}</td>
      </tr>`;
  });
}

/* ---------------------------------------------------
   LOGOUT
--------------------------------------------------- */
function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "adminlogin.html";
}

/* ---------------------------------------------------
   INITIAL AUTO LOAD
--------------------------------------------------- */
if (document.getElementById("carsList")) loadCars();
if (document.getElementById("bookingList")) loadBookings();
if (document.getElementById("usersList")) loadUsers();

/* ---------------------------------------------------
   TAG SELECTION (Rent / Subscribe / Both)
--------------------------------------------------- */
const tagSelect = document.getElementById("tag");

if (tagSelect) {
  const rentBox = document.getElementById("rentBox");
  const subscribeBox = document.getElementById("subscribeBox");

  tagSelect.addEventListener("change", () => {
    if (tagSelect.value === "rent") {
      rentBox.style.display = "block";
      subscribeBox.style.display = "none";
    } else if (tagSelect.value === "subscribe") {
      rentBox.style.display = "none";
      subscribeBox.style.display = "block";
    } else {
      rentBox.style.display = "block";
      subscribeBox.style.display = "block";
    }
  });
}

/* ---------------------------------------------------
   IMAGE LIMIT CHECK
--------------------------------------------------- */
function checkImages() {
  const fileInput = document.getElementById("images");
  const msg = document.getElementById("imageLimitMsg");

  if (fileInput.files.length > 5) {
    msg.style.display = "block";
    fileInput.value = "";
  } else {
    msg.style.display = "none";
  }
}

const adminSlideIndex = {}; // store index for each car

function nextAdminSlide(id) {
  const track = document.getElementById(`track-${id}`);
  const total = track.children.length;

  if (!adminSlideIndex[id]) adminSlideIndex[id] = 0;

  adminSlideIndex[id] = (adminSlideIndex[id] + 1) % total;

  track.style.transform = `translateX(-${adminSlideIndex[id] * 100}%)`;
}

function prevAdminSlide(id) {
  const track = document.getElementById(`track-${id}`);
  const total = track.children.length;

  if (!adminSlideIndex[id]) adminSlideIndex[id] = 0;

  adminSlideIndex[id] = (adminSlideIndex[id] - 1 + total) % total;

  track.style.transform = `translateX(-${adminSlideIndex[id] * 100}%)`;
}
/* ---------------------------------------------------
   MOBILE MENU TOGGLE (Fixes toggleMenu error)
--------------------------------------------------- */
function toggleMenu() {
  const menu = document.getElementById("mobileMenu");
  if (!menu) return;

  menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

// Close when clicking outside menu
document.addEventListener("click", function (e) {
  const menu = document.getElementById("mobileMenu");
  const dots = document.querySelector(".menu-dots");

  if (!menu || !dots) return;

  if (!menu.contains(e.target) && !dots.contains(e.target)) {
    menu.style.display = "none";
  }
});



function downloadBooking(bookingId) {
  if (!bookingId) {
    alert("Booking ID missing");
    return;
  }

 window.open(
  `https://goridezz-backend.onrender.com/api/bookings/admin-pdf/${bookingId}`,
  "_blank"
);

}


function showStatus(message, type = "success") {
  const status = document.getElementById("statusMsg");
  const text = document.getElementById("statusText");

  status.classList.remove("hidden", "error", "success");

  if (type === "error") {
    status.classList.add("error");
  } else {
    status.classList.add("success");
  }

  text.innerHTML = message;
}

let primaryImageIndex = 0;

function previewImages() {
  const previewBox = document.getElementById("imagePreview");
  const files = document.getElementById("images").files;

  previewBox.innerHTML = "";

  Array.from(files).forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = e => {
      previewBox.innerHTML += `
        <div style="
          display:flex;
          align-items:center;
          gap:10px;
          margin-bottom:8px;
        ">
          <input
            type="radio"
            name="primaryImage"
            ${index === 0 ? "checked" : ""}
            onchange="primaryImageIndex=${index}"
          >
          <img
            src="${e.target.result}"
            style="width:80px;height:60px;object-fit:cover;border-radius:8px;"
          >
          <span style="color:#ffd700;font-size:13px;">
            ${index === 0 ? "Primary Image" : "Set as Primary"}
          </span>
        </div>
      `;
    };

    reader.readAsDataURL(file);
  });
}
