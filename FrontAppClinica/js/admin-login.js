// ✅ CONFIGURACIÓN GLOBAL DE LA API (autenticación)
const API_AUTH_URL = "https://gestiondecitas.onrender.com/api/Auth";
// const API_AUTH_URL = 'https://localhost:7025/api/Auth'; // Descomenta esta línea si estás trabajando en local

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".admin-login-form");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const user = document.getElementById("admin-user").value.trim();
    const pass = document.getElementById("admin-pass").value.trim();
    try {
      const response = await fetch(`${API_AUTH_URL}/login`, {
        // ✅ URL corregida
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: user, password: pass }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        showModalMsg("¡Inicio de sesión exitoso!", "Éxito");
        setTimeout(() => {
          window.location.href = "./admin-dashboard.html";
        }, 1200);
      } else if (response.status === 401) {
        showModalMsg("Correo o contraseña incorrectos", "Error");
      } else {
        showModalMsg("Error al iniciar sesión. Intenta más tarde.", "Error");
      }
    } catch (error) {
      showModalMsg(
        "No se pudo conectar con el servidor. Verifica tu conexión.",
        "Error"
      );
      console.error(error);
    }
  });
});

function showModalMsg(msg, title = "Mensaje") {
  document.getElementById("loginModalMsgLabel").textContent = title;
  document.getElementById("loginModalMsgBody").textContent = msg;
  const modal = new bootstrap.Modal(document.getElementById("loginModalMsg"));
  modal.show();
}
<div
  class="modal fade"
  id="loginModalMsg"
  tabindex="-1"
  aria-labelledby="loginModalMsgLabel"
  aria-hidden="true"
>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="loginModalMsgLabel">
          Mensaje
        </h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label="Cerrar"
        ></button>
      </div>
      <div class="modal-body" id="loginModalMsgBody"></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
          Aceptar
        </button>
      </div>
    </div>
  </div>
</div>;
