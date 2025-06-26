// --- Calendar and Appointment Data ---
const calendarEl = document.getElementById("calendar");
const selectedDateLabel = document.getElementById("selected-date-label");
const infoDate = document.getElementById("info-date");
const timesGrid = document.querySelector(".times-grid");
const appointmentForm = document.getElementById("appointment-form");
const confirmBtn = document.getElementById("confirm-btn");
const cancelBtn = document.getElementById("cancel-btn");

// Horarios disponibles
const allTimes = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

// Estado global
let citasRegistradas = [];
let selectedDate = null;
let selectedTime = null;

// --- Funciones auxiliares ---
function getTodayISO() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split("T")[0];
}

function getNowHM() {
  const now = new Date();
  return [now.getHours(), now.getMinutes()];
}

// Trae todas las citas ocupadas desde la API
async function fetchCitasFromApi() {
  try {
    const response = await fetch("https://localhost:7025/api/Citas");
    if (!response.ok) throw new Error("No se pudieron cargar las citas");
    const data = await response.json();
    return data.citas || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

// Citas para cierta fecha (YYYY-MM-DD)
function getAppointmentsForDate(date) {
  // La fecha en la BD es ISO, así que comparamos por "YYYY-MM-DD"
  return citasRegistradas.filter((cita) => cita.fecha.startsWith(date));
}

// --- Calendar Rendering ---
function renderCalendar(year, month) {
  calendarEl.innerHTML = "";
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Header
  const calHeader = document.createElement("div");
  calHeader.className = "calendar-header";
  calHeader.style.display = "flex";
  calHeader.style.justifyContent = "space-between";
  calHeader.style.alignItems = "center";
  calHeader.style.marginBottom = "7px";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "‹";
  prevBtn.style.background = "none";
  prevBtn.style.border = "none";
  prevBtn.style.fontSize = "1.25em";
  prevBtn.style.cursor = "pointer";
  prevBtn.onclick = () => {
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    renderCalendar(newYear, newMonth);
  };

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "›";
  nextBtn.style.background = "none";
  nextBtn.style.border = "none";
  nextBtn.style.fontSize = "1.25em";
  nextBtn.style.cursor = "pointer";
  nextBtn.onclick = () => {
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    renderCalendar(newYear, newMonth);
  };

  const monthLabel = document.createElement("span");
  monthLabel.textContent = `${monthNames[month]} ${year}`;
  monthLabel.style.fontWeight = "bold";

  calHeader.appendChild(prevBtn);
  calHeader.appendChild(monthLabel);
  calHeader.appendChild(nextBtn);
  calendarEl.appendChild(calHeader);

  // Days headers
  const daysRow = document.createElement("div");
  daysRow.className = "calendar-days-row";
  daysRow.style.display = "grid";
  daysRow.style.gridTemplateColumns = "repeat(7, 1fr)";
  daysRow.style.fontWeight = "600";
  daysRow.style.marginBottom = "5px";

  ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach((day) => {
    const d = document.createElement("div");
    d.textContent = day;
    d.style.textAlign = "center";
    d.style.color = "#666";
    daysRow.appendChild(d);
  });
  calendarEl.appendChild(daysRow);

  // Dates grid
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const daysGrid = document.createElement("div");
  daysGrid.className = "calendar-grid";
  daysGrid.style.display = "grid";
  daysGrid.style.gridTemplateColumns = "repeat(7, 1fr)";
  daysGrid.style.gap = "2px";

  let dayNum = 1;
  let totalCells = Math.ceil((firstDay + lastDate) / 7) * 7;
  const todayISO = getTodayISO();

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.style.height = "34px";
    cell.style.display = "flex";
    cell.style.justifyContent = "center";
    cell.style.alignItems = "center";
    cell.style.borderRadius = "7px";
    cell.style.cursor = "pointer";
    cell.style.fontWeight = "500";
    cell.style.fontSize = "1.02em";

    if (i >= firstDay && dayNum <= lastDate) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        dayNum
      ).padStart(2, "0")}`;
      let status = "available";
      const dateObj = new Date(year, month, dayNum);
      const isSunday = dateObj.getDay() === 0;

      // No se puede seleccionar días que ya pasaron o domingos
      if (dateStr < todayISO) status = "unavailable";
      else if (isSunday) status = "unavailable";

      cell.textContent = dayNum;
      cell.dataset.date = dateStr;
      cell.classList.add("calendar-day", status);

      // Styling
      if (status === "unavailable") {
        cell.style.background = "#f3f3f3";
        cell.style.color = "#bdbdbd";
        cell.style.border = "1px solid #e0e0e0";
        cell.style.cursor = "not-allowed";
      } else {
        cell.style.background = "#f5faff";
        cell.style.color = "#1976d2";
        cell.style.border = "1px solid #e0e7ef";
      }

      // Selección
      if (selectedDate === dateStr) {
        cell.style.background = "#1976d2";
        cell.style.color = "#fff";
        cell.style.border = "1.5px solid #1976d2";
      }

      // Click handler solo si está disponible
      if (status === "available") {
        cell.addEventListener("click", () => {
          selectedDate = dateStr;
          selectedTime = null;
          renderCalendar(year, month);
          renderSelectedDate();
          renderTimes();
          updateFormStatus();
        });
      }
      dayNum++;
    }
    daysGrid.appendChild(cell);
  }
  calendarEl.appendChild(daysGrid);
}

function renderSelectedDate() {
  if (selectedDate) {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const label = new Date(selectedDate).toLocaleDateString("es-ES", options);
    selectedDateLabel.textContent = `Fecha seleccionada: ${
      label.charAt(0).toUpperCase() + label.slice(1)
    }`;
    infoDate.textContent = label.charAt(0).toUpperCase() + label.slice(1);
  } else {
    selectedDateLabel.textContent = "";
    infoDate.textContent = "";
  }
}

// --- Timeslot Rendering ---
function renderTimes() {
  timesGrid.innerHTML = "";
  if (!selectedDate) return;

  // Horas ocupadas por día (desde la base de datos)
  const busyTimes = getAppointmentsForDate(selectedDate).map(
    (cita) => cita.hora
  );
  const todayISO = getTodayISO();
  const [nowHour, nowMinute] = getNowHM();

  allTimes.forEach((time) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "time-btn";
    btn.textContent = time;

    let disabled = false;

    // Si el día es hoy, bloquear horas previas a la actual
    if (selectedDate === todayISO) {
      const [h, m] = time.split(":").map(Number);
      if (h < nowHour || (h === nowHour && m <= nowMinute)) {
        btn.classList.add("unavailable");
        disabled = true;
      }
    }

    // Si la hora ya está ocupada
    if (busyTimes.includes(time)) {
      btn.classList.add("unavailable");
      disabled = true;
    }

    btn.disabled = disabled;

    if (!disabled) {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".time-btn")
          .forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedTime = time;
        updateFormStatus();
      });
      if (selectedTime === time) btn.classList.add("selected");
    }
    timesGrid.appendChild(btn);
  });
}

// --- Form & Validation ---
function updateFormStatus() {
  // Enable submit only if all required fields are filled and timeslot is available
  const name = document.getElementById("name").value.trim();
  const lastname = document.getElementById("lastname").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const reason = document.getElementById("reason").value.trim();
  const busyTimes = getAppointmentsForDate(selectedDate).map(
    (cita) => cita.hora
  );
  const isValid =
    selectedDate &&
    selectedTime &&
    !busyTimes.includes(selectedTime) &&
    name &&
    lastname &&
    email &&
    phone &&
    reason;
  confirmBtn.disabled = !isValid;
}

appointmentForm.addEventListener("input", updateFormStatus);

appointmentForm.addEventListener("submit", function (e) {
  e.preventDefault();

  // Obtén los datos del formulario
  const name = document.getElementById("name").value.trim();
  const lastname = document.getElementById("lastname").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const reason = document.getElementById("reason").value.trim();

  if (!selectedDate || !selectedTime) {
    alert("Selecciona una fecha y hora válida.");
    return;
  }

  // Nueva cita para enviar al backend
  const nuevaCita = {
    id: 0,
    nombre: name,
    apellido: lastname,
    email: email,
    telefono: phone,
    motivo: reason,
    fecha: new Date(selectedDate + "T00:00:00").toISOString(),
    hora: selectedTime,
    estado: "Pendiente",
  };

  fetch("https://localhost:7025/api/Citas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nuevaCita),
  })
    .then((response) => {
      if (response.ok) {
        alert("¡Cita confirmada y guardada en la base de datos!");
        appointmentForm.reset();
        selectedTime = null;
        // Recarga las citas desde el backend y refresca el calendario
        fetchCitasFromApi().then((citas) => {
          citasRegistradas = citas;
          renderCalendar(
            new Date(selectedDate).getFullYear(),
            new Date(selectedDate).getMonth()
          );
          renderSelectedDate();
          renderTimes();
          updateFormStatus();
        });
      } else {
        alert("Error al guardar la cita en la base de datos.");
      }
    })
    .catch((error) => {
      alert("No se pudo conectar con el servidor.");
      console.error(error);
    });
});

cancelBtn.addEventListener("click", function () {
  appointmentForm.reset();
  selectedTime = null;
  renderTimes();
  updateFormStatus();
});

// --- Inicialización ---
const today = new Date();
const defaultMonth = today.getMonth();
const defaultYear = today.getFullYear();

async function initializeCalendar() {
  citasRegistradas = await fetchCitasFromApi();
  renderCalendar(defaultYear, defaultMonth);
  selectedDate = null;
  renderSelectedDate();
  renderTimes();
  updateFormStatus();
}

initializeCalendar();
