const API = "https://goridezz-backend.onrender.com/api/cars";

let allBookings = [];
let allCars = [];
let lastLoadedCars = [];
let categoryFilter = "all";

function toDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}


async function initPage() {
  await loadBookings();
  await loadCars();

  // ⛔ do NOT show cars yet
  document.getElementById("carList").innerHTML =
    "<p style='color:#ffd700;text-align:center;'>Select pickup & return date/time to see available cars</p>";
}


initPage();


function isCarAvailable(carId, userStart, userEnd) {
  return !allBookings.some(b => {
    if (!b.carId || b.carId._id !== carId) return false;
    if (b.userStatus === "cancelled") return false;

    const bookedStart = toDateTime(b.pickupDate, b.pickupTime);
    const bookedEnd = toDateTime(b.returnDate, b.returnTime);

    return bookedStart < userEnd && bookedEnd > userStart;
  });
}

function searchAvailableCars() {
  const pDate = document.getElementById("pickupDate").value;
  const pTime = document.getElementById("pickupTime").value;
  const rDate = document.getElementById("returnDate").value;
  const rTime = document.getElementById("returnTime").value;

  if (!pDate || !pTime || !rDate || !rTime) {
    alert("Please select pickup & return date and time");
    return;
  }

  const userStart = toDateTime(pDate, pTime);
  const userEnd = toDateTime(rDate, rTime);

  if (userEnd <= userStart) {
    alert("Return time must be after pickup time");
    return;
  }

  const diffMs = userEnd - userStart;
  const minDuration = 24 * 60 * 60 * 1000;

  if (diffMs < minDuration) {
    alert("Minimum booking duration is 24 hours");
    return;
  }


  // save for booking page
  localStorage.setItem("pickupDate", pDate);
  localStorage.setItem("pickupTime", pTime);
  localStorage.setItem("returnDate", rDate);
  localStorage.setItem("returnTime", rTime);

  const availableCars = allCars.filter(car =>
    isCarAvailable(car._id, userStart, userEnd)
  );

  if (!availableCars.length) {
    document.getElementById("carList").innerHTML =
      "<p style='color:#ffd700;text-align:center;'>No cars available for selected time</p>";
    return;
  }

  renderCars(availableCars);
}

async function loadBookings() {
  try {
    const res = await fetch("https://goridezz-backend.onrender.com/api/bookings", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });

    const data = await res.json();
    if (data.success) {
      allBookings = data.bookings;
    }
  } catch (err) {
    console.error("Failed to load bookings");
  }
}









// ================= LOAD CARS =================

async function loadCars() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    if (!data.success) {
      console.error("Failed to load cars");
      return;
    }

    allCars = data.cars;
    lastLoadedCars = data.cars;
    // 🚫 DO NOT render here
  } catch (err) {
    console.error("Car load error:", err);
  }
}


// ================= RENDER CARS =================
function renderCars(cars) {
  const carList = document.getElementById("carList");
  carList.innerHTML = "";

  const tag = localStorage.getItem("carTag") || "rent";

  for (const car of cars) {
    let finalPrice = car.rentPrice;
    let unit = "/day";

    if (tag === "subscribe") {
      if (!car.subscribePrice) continue;
      finalPrice = car.subscribePrice;
      unit = "/month";
    }

    carList.innerHTML += `
      <div class="card" onclick="openCar('${car._id}', ${finalPrice}, '${tag}')">
        <img src="${car.imageUrls?.[0] || ''}" />

        <div class="card-body">
          <h3>${car.brand} ${car.name}</h3>
          <div class="details">
            ${car.transmission} • ${car.seats} Seats • ${car.fuel}
          </div>
          <div class="price">₹${finalPrice}${unit}</div>
        </div>
      </div>
    `;
  }
}


// ================= OPEN CAR =================
function openCar(id, price, tag) {
  const pDate = localStorage.getItem("pickupDate");
  const pTime = localStorage.getItem("pickupTime");
  const rDate = localStorage.getItem("returnDate");
  const rTime = localStorage.getItem("returnTime");

  if (!pDate || !pTime || !rDate || !rTime) {
    alert("Please select pickup & return date/time first");
    return;
  }

  localStorage.setItem("selectedCar", id);
  localStorage.setItem("selectedCarPrice", price);
  localStorage.setItem("pricingType", tag);

  window.location.href = `cardetails.html?id=${id}`;
}


// ================= FILTER =================
function filterCars() {
  const search = document.getElementById("searchInput").value.toLowerCase();

  const filtered = allCars.filter(car => {
    const textMatch =
      car.brand.toLowerCase().includes(search) ||
      car.name.toLowerCase().includes(search) ||
      car.category.toLowerCase().includes(search);

    const categoryMatch =
      categoryFilter === "all" ||
      car.category.toLowerCase() === categoryFilter.toLowerCase();

    return textMatch && categoryMatch;
  });

  renderCars(
    filtered.filter(car => {
      const pDate = localStorage.getItem("pickupDate");
      const pTime = localStorage.getItem("pickupTime");
      const rDate = localStorage.getItem("returnDate");
      const rTime = localStorage.getItem("returnTime");

      if (!pDate || !pTime || !rDate || !rTime) return false;

      const start = toDateTime(pDate, pTime);
      const end = toDateTime(rDate, rTime);

      return isCarAvailable(car._id, start, end);
    })
  );

}

function setFilter(cat) {
  categoryFilter = cat;
  filterCars();
}










// ================= OFFERS =================
async function loadOffer() {
  try {
    const res = await fetch("https://goridezz-backend.onrender.com/api/offers/active");
    const data = await res.json();

    if (!data.success || !data.offer) {
      document.getElementById("festivalOffer").style.display = "none";
      return;
    }

    document.getElementById("festivalOffer").style.display = "block";
    document.getElementById("offerText").innerHTML = `
      🎉 <b>${data.offer.title}</b><br>
         ${data.offer.description}<br> 
      🔥 Min Days: ${data.offer.minDays} |
      💰 Discount:
      ${data.offer.discountType === "PERCENT"
        ? data.offer.discountValue + "%"
        : "₹" + data.offer.discountValue}
    `;
  } catch (err) {
    console.error("Offer load failed:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadOffer();
});



// ================= MENU =================
function toggleDotsMenu() {
  const menu = document.getElementById("dotsMenu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

document.addEventListener("click", function (event) {
  const menu = document.getElementById("dotsMenu");
  const button = document.querySelector(".menu-dots");

  if (!menu.contains(event.target) && !button.contains(event.target)) {
    menu.style.display = "none";
  }
});

function applyTagFilter() {
  const selectedTag = document.getElementById("carTagFilter").value;
  localStorage.setItem("carTag", selectedTag);

  const pDate = localStorage.getItem("pickupDate");
  const pTime = localStorage.getItem("pickupTime");
  const rDate = localStorage.getItem("returnDate");
  const rTime = localStorage.getItem("returnTime");

  if (!pDate || !pTime || !rDate || !rTime) {
    alert("Please select pickup & return date/time first");
    return;
  }

  const start = toDateTime(pDate, pTime);
  const end = toDateTime(rDate, rTime);

  const availableCars = allCars.filter(car =>
    isCarAvailable(car._id, start, end)
  );

  renderCars(availableCars);
}
function updateTimeSummary() {
  const pDate = pickupDate.value;
  const pTime = pickupTime.value;
  const rDate = returnDate.value;
  const rTime = returnTime.value;

  if (!pDate || !pTime || !rDate || !rTime) {
    timeSummary.innerText = "";
    return;
  }

  const start = toDateTime(pDate, pTime);
  const end = toDateTime(rDate, rTime);

  if (end <= start) {
    timeSummary.innerText = "❌ Return time must be after pickup time";
    return;
  }

  const hours = Math.ceil((end - start) / (1000 * 60 * 60));
  const days = Math.ceil(hours / 24);

  timeSummary.innerText =
    `🕒 Duration: ${hours} hours (${days} day${days > 1 ? "s" : ""})`;
}

["pickupDate", "pickupTime", "returnDate", "returnTime"]
  .forEach(id => document.getElementById(id).addEventListener("change", updateTimeSummary));


