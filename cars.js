const API = "https://goridezz-backend.onrender.com/api/cars";

let allBookings = [];
let allCars = [];
let lastLoadedCars = [];
let categoryFilter = "all";



async function initPage() {
  await loadBookings();   // 🔴 must finish first
  await loadCars();       // 🟢 then render cars
}

initPage();


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

function isDateBooked(carId, dateStr) {
  const date = new Date(dateStr);

  return allBookings.some(b => {
    if (!b.carId || b.carId._id !== carId) return false;

    // ✅ IGNORE CANCELLED BOOKINGS
    if (b.status === "cancelled") return false;

    const start = new Date(b.pickupDate);
    const end = new Date(b.returnDate);

    return date >= start && date <= end;
  });
}


function isCarBooked(carId) {
  const today = new Date();

  return allBookings.some(b => {
    if (!b.carId || b.carId._id !== carId) return false;

    // ✅ IGNORE CANCELLED BOOKINGS
    if (b.status === "cancelled") return false;

    const start = new Date(b.pickupDate);
    const end = new Date(b.returnDate);

    return today >= start && today <= end;
  });
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

    renderCars(allCars);
  } catch (err) {
    console.error("Car load error:", err);
  }
}

// ================= RENDER CARS =================
function renderCars(cars) {
  const carList = document.getElementById("carList");
  carList.innerHTML = "";

  if (!cars.length) {
    carList.innerHTML = `
      <p style="color:#ccc;text-align:center;width:100%;">
        No cars found
      </p>`;
    return;
  }

  // 🔥 SORT: Available cars first, Booked cars last
const sortedCars = [...cars].sort((a, b) => {
  const aBooked = isCarBooked(a._id);
  const bBooked = isCarBooked(b._id);

  // available first (false), booked last (true)
  return aBooked - bBooked;
});

  const tag = localStorage.getItem("carTag") || "rent";

 for (const car of sortedCars) {


  const booked = isCarBooked(car._id);

    let finalPrice = car.rentPrice;
    let unit = "/day";

    if (tag === "subscribe") {
      if (!car.subscribePrice || car.subscribePrice <= 0) {
        finalPrice = null; // mark as not available
      } else {
        finalPrice = car.subscribePrice;
        unit = "/month";
      }
    }


    carList.innerHTML += `
  <div class="card ${booked ? "booked-card" : ""}"
       ${!booked ? `onclick="openCar('${car._id}', ${finalPrice}, '${tag}')"` : ""}>

    ${booked ? `<div class="booked-badge">BOOKED</div>` : ""}

    <img src="${car.imageUrls?.[0] || ''}" />

    <div class="card-body">
      <h3>${car.brand} ${car.name}</h3>

      <div class="details">
        ${car.transmission} • ${car.seats} Seats • ${car.fuel}
      </div>

      ${
        booked
          ? `<div class="booked-text">Currently Unavailable</div>`
          : finalPrice
            ? `<div class="price"
                onclick="event.stopPropagation(); openAvailability('${car._id}', ${finalPrice});">
                ₹${finalPrice}${unit}
              </div>`
            : `<div class="availability-small">Not Available</div>`
      }
    </div>
  </div>
`;

  }
}

// ================= OPEN CAR =================
function openCar(id, price, tag) {
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

  renderCars(filtered);
}

function setFilter(cat) {
  categoryFilter = cat;
  filterCars();
}

// ================= AVAILABILITY POPUP =================
let selectedCarId = "";
let selectedCarPrice = 0;

function openAvailability(carId, price) {
  selectedCarId = carId;
  selectedCarPrice = price;

  const pDate = document.getElementById("pDate");
  const rDate = document.getElementById("rDate");

  pDate.value = "";
  rDate.value = "";

  document.getElementById("datePopup").style.display = "flex";

  // ✅ pickup date check
  pDate.onchange = () => {
    if (isDateBooked(carId, pDate.value)) {
      alert("This pickup date is already booked");
      pDate.value = "";
    }
  };

  // ✅ return date check
  rDate.onchange = () => {
    if (isDateBooked(carId, rDate.value)) {
      alert("This return date is already booked");
      rDate.value = "";
    }
  };
}


function closeDatePopup() {
  document.getElementById("datePopup").style.display = "none";
}



async function checkCarDates() {
  const start = document.getElementById("pDate").value;
  const end = document.getElementById("rDate").value;

  if (!start || !end) {
    alert("Please select both pickup and return dates");
    return;
  }

  if (end < start) {
    alert("Return date must be after pickup date");
    return;
  }

  try {
    const res = await fetch(
      `https://goridezz-backend.onrender.com/api/cars/${selectedCarId}/availability?start=${start}&end=${end}`
    );
    const data = await res.json();

    if (!data.available) {
      document.getElementById("availabilityMsg").innerText =
        "❌ Car not available for selected dates";
      document.getElementById("availabilityMsg").style.color = "red";
      return;
    }

    // ✅ Available → continue
    localStorage.setItem("pickupDate", start);
    localStorage.setItem("returnDate", end);
    localStorage.setItem("selectedCar", selectedCarId);
    localStorage.setItem("selectedCarPrice", selectedCarPrice);

    window.location.href = `cardetails.html?id=${selectedCarId}`;

  } catch (err) {
    alert("Availability check failed");
  }

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

  // save selection
  localStorage.setItem("carTag", selectedTag);

  // re-render cars with new pricing
  renderCars(allCars);
}
