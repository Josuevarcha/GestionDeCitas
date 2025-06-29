// ✅ CONFIGURACIÓN GLOBAL DE LA API
const API_BASE_URL = "https://gestiondecitas.onrender.com/api/Citas";
// const API_BASE_URL = 'https://localhost:7025/api/Citas'; // Descomenta esta línea si estás en local

// --- UTILIDADES API ---
async function fetchCitasFromApi() {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error("No se pudieron cargar las citas");
    const data = await response.json();
    return data.citas || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function patchCitaToApi(id, citaEditada) {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(citaEditada),
    });
    return response.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function deleteCitaFromApi(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

// --- FORMATO FECHA/HORA ---
function formatFecha(fecha) {
  if (!fecha) return "";
  const base = fecha.slice(0, 10);
  const [y, m, d] = base.split("-");
  return `${d}/${m}/${y}`;
}

function formatHora(hora) {
  if (!hora) return "";
  return hora.length === 5 ? hora : hora.slice(0, 5);
}

// --- STATS ---
function renderStats(citas) {
  const hoy = new Date().toISOString().slice(0, 10);
  document.getElementById("total-citas").textContent = citas.length;
  document.getElementById("num-citas").textContent = citas.length;
  document.getElementById("citas-hoy").textContent = citas.filter(
    (c) => c.fecha && c.fecha.slice(0, 10) === hoy
  ).length;
  document.getElementById("pendientes").textContent = citas.filter(
    (c) => c.estado === "Pendiente"
  ).length;
  document.getElementById("confirmadas").textContent = citas.filter(
    (c) => c.estado === "Confirmada"
  ).length;
}

// --- RENDER CITAS ---
function renderCitas(lista) {
  const cont = document.getElementById("lista-citas");
  cont.innerHTML = "";
  if (!lista.length) {
    cont.innerHTML = `<div class="text-center text-muted py-4">No hay citas que coincidan con los filtros.</div>`;
    return;
  }
  lista.forEach((cita) => {
    const citaDiv = document.createElement("div");
    citaDiv.className =
      "cita-item d-flex flex-wrap justify-content-between align-items-center mb-3 p-3 rounded-3 border";
    citaDiv.style.background = "#fff";
    citaDiv.style.boxShadow = "0 1px 8px #ececec";

    citaDiv.innerHTML = `
      <div class="flex-grow-1" style="min-width:220px;">
        <div class="fw-semibold" style="font-size:1.13em">${cita.nombre}</div>
        <div class="text-muted" style="font-size:0.97em;">
          <i class="bi bi-envelope-at" style="color:#1976d2"></i> ${
            cita.email
          }<br>
          <i class="bi bi-telephone" style="color:#1976d2"></i> ${cita.telefono}
        </div>
      </div>
      <div class="d-flex flex-column flex-md-row align-items-md-center gap-3 mt-3 mt-md-0 justify-content-end" style="min-width:310px;">
        <div class="d-flex flex-column align-items-md-end align-items-start flex-grow-1">
          <div class="text-secondary" style="font-size:1em;">
            <i class="bi bi-clock"></i> ${formatFecha(
              cita.fecha
            )} - ${formatHora(cita.hora)}
          </div>
          <div class="fw-medium" style="font-size:1em;">
            <b>Motivo:</b> ${cita.motivo}
          </div>
          <span class="badge-estado mt-1" style="${estadoBadgeStyle(
            cita.estado
          )}">${cita.estado}</span>
        </div>
        <div class="d-flex flex-column gap-2 ms-md-3 w-100" style="max-width:140px;">
          <button type="button" class="btn btn-edit w-100 mb-1" style="${btnEditStyle()}" data-id="${
      cita.id
    }">
            <i class="bi bi-pencil-square me-1"></i> Editar
          </button>
          <button type="button" class="btn btn-delete w-100" style="${btnDeleteStyle()}" data-id="${
      cita.id
    }">
            <i class="bi bi-trash me-1"></i> Eliminar
          </button>
        </div>
      </div>
    `;
    cont.appendChild(citaDiv);
  });

  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.onclick = function () {
      abrirModalEditar(this.getAttribute("data-id"));
    };
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.onclick = function () {
      eliminarCita(this.getAttribute("data-id"));
    };
  });
}

// --- ESTILOS INLINE PARA BADGE Y BOTONES ---
function estadoBadgeStyle(estado) {
  if (estado === "Pendiente") {
    return "background:#f8f9fa;color:#363636;border:1px solid #bdbdbd;display:inline-block;font-size:0.96em;font-weight:600;border-radius:7px;padding:3.5px 14px;";
  }
  if (estado === "Confirmada") {
    return "background:#e7f8ef;color:#27ae60;border:1.2px solid #27ae60;display:inline-block;font-size:0.96em;font-weight:600;border-radius:7px;padding:3.5px 14px;";
  }
  if (estado === "Cancelada") {
    return "background:#fbeaea;color:#b71c1c;border:1.2px solid #e57373;display:inline-block;font-size:0.96em;font-weight:600;border-radius:7px;padding:3.5px 14px;";
  }
  return "";
}

function btnEditStyle() {
  return "background:#fff;border:1.4px solid #aaa;color:#222;font-weight:600;padding:7px 0;border-radius:7px;transition:background .14s;border-left:4.2px solid #1976d2;";
}

function btnDeleteStyle() {
  return "background:#ef4444;color:#fff;border:none;font-weight:600;padding:7px 0;border-radius:7px;transition:background .14s;";
}

// --- FILTROS ---
let citasCache = [];

function aplicarFiltros() {
  let citas = citasCache;
  const nombre = document
    .getElementById("filtro-nombre")
    .value.toLowerCase()
    .trim();
  const fecha = document.getElementById("filtro-fecha").value;

  if (nombre) {
    citas = citas.filter(
      (c) =>
        c.nombre.toLowerCase().includes(nombre) ||
        c.email.toLowerCase().includes(nombre)
    );
  }
  if (fecha) {
    citas = citas.filter((c) => c.fecha && c.fecha.slice(0, 10) === fecha);
  }

  renderCitas(citas);
  document.getElementById("num-citas").textContent = citas.length;
}

document
  .getElementById("filtro-nombre")
  .addEventListener("input", aplicarFiltros);
document
  .getElementById("filtro-fecha")
  .addEventListener("change", aplicarFiltros);
document.getElementById("limpiar-filtros").addEventListener("click", () => {
  document.getElementById("filtro-nombre").value = "";
  document.getElementById("filtro-fecha").value = "";
  aplicarFiltros();
});

// --- MODAL EDITAR ---
let citaEditando = null;

function abrirModalEditar(id) {
  const cita = citasCache.find((c) => String(c.id) === String(id));
  if (!cita) return;

  citaEditando = cita;

  document.getElementById("edit-nombre").value = cita.nombre;
  document.getElementById("edit-email").value = cita.email;
  document.getElementById("edit-telefono").value = cita.telefono;
  document.getElementById("edit-fecha").value = cita.fecha
    ? cita.fecha.slice(0, 10)
    : "";
  document.getElementById("edit-hora").value = cita.hora;
  document.getElementById("edit-motivo").value = cita.motivo;
  document.getElementById("edit-estado").value = cita.estado;

  const oldError = document.getElementById("modal-edit-error");
  if (oldError) oldError.remove();

  const modal = new bootstrap.Modal(document.getElementById("editarCitaModal"));
  modal.show();
}

document
  .getElementById("editarCitaForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!citaEditando) return;

    const nuevoNombre = document.getElementById("edit-nombre").value.trim();
    const nuevoEmail = document.getElementById("edit-email").value.trim();
    const nuevoTelefono = document.getElementById("edit-telefono").value.trim();
    const nuevaFecha = document.getElementById("edit-fecha").value;
    const nuevaHora = document.getElementById("edit-hora").value;
    const nuevoMotivo = document.getElementById("edit-motivo").value.trim();
    const nuevoEstado = document.getElementById("edit-estado").value;

    const existe = citasCache.some(
      (c) =>
        String(c.id) !== String(citaEditando.id) &&
        c.fecha &&
        c.fecha.slice(0, 10) === nuevaFecha &&
        c.hora === nuevaHora
    );

    let errorDiv = document.getElementById("modal-edit-error");
    if (existe) {
      if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.id = "modal-edit-error";
        errorDiv.className = "alert alert-danger mt-2";
        document
          .querySelector("#editarCitaForm .modal-body")
          .appendChild(errorDiv);
      }
      errorDiv.textContent =
        "Ya existe una cita programada para esa fecha y hora. Elige otra.";
      return;
    } else if (errorDiv) {
      errorDiv.remove();
    }

    const citaEditada = {
      id: citaEditando.id,
      nombre: nuevoNombre,
      apellido: citaEditando.apellido, // Importante: Se mantiene el apellido original
      email: nuevoEmail,
      telefono: nuevoTelefono,
      motivo: nuevoMotivo,
      fecha: new Date(nuevaFecha + "T00:00:00").toISOString(),
      hora: nuevaHora,
      estado: nuevoEstado,
    };

    const ok = await patchCitaToApi(citaEditando.id, citaEditada);
    if (!ok) {
      alert("No fue posible guardar los cambios en la cita.");
      return;
    }

    await loadDashboard();
    bootstrap.Modal.getInstance(
      document.getElementById("editarCitaModal")
    ).hide();
  });

// --- ELIMINAR ---
async function eliminarCita(id) {
  if (!confirm("¿Seguro que deseas eliminar esta cita?")) return;

  const ok = await deleteCitaFromApi(id);
  if (!ok) {
    alert("No fue posible eliminar la cita.");
    return;
  }

  await loadDashboard();
}

// --- INICIALIZACIÓN ---
async function loadDashboard() {
  citasCache = await fetchCitasFromApi();
  renderStats(citasCache);
  renderCitas(citasCache);
  aplicarFiltros();
}

window.addEventListener("DOMContentLoaded", loadDashboard);
