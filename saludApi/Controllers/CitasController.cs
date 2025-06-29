using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using saludApi.Data;
using saludApi.Models;
using System.Net.Mail;
using System.Net;
using Microsoft.EntityFrameworkCore;

namespace saludApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CitasController : ControllerBase
    {
        private readonly SaludContext _context;

        public CitasController(SaludContext context)
        {
            _context = context;
        }

        // GET: api/Citas?page=1&pageSize=20
        [HttpGet]
        public IActionResult GetCitas([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page <= 0) page = 1;
                if (pageSize <= 0 || pageSize > 100) pageSize = 20;

                var total = _context.Citas.Count();
                var citas = _context.Citas
                    .OrderByDescending(c => c.Fecha)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                return Ok(new { ok = true, total, page, pageSize, citas });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { ok = false, error = ex.Message });
            }
        }

        // GET: api/Citas/5
        [HttpGet("{id}")]
        public IActionResult GetCitaPorId(int id)
        {
            try
            {
                var cita = _context.Citas.FirstOrDefault(c => c.Id == id);
                if (cita == null)
                    return NotFound(new { ok = false, error = "No encontrada" });
                return Ok(new { ok = true, cita });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { ok = false, error = ex.Message });
            }
        }

        // POST: api/Citas
        [HttpPost]
        public IActionResult RegistrarCita([FromBody] Cita nuevaCita)
        {
            try
            {
                if (nuevaCita == null ||
                    string.IsNullOrWhiteSpace(nuevaCita.Nombre) ||
                    string.IsNullOrWhiteSpace(nuevaCita.Apellido) ||
                    string.IsNullOrWhiteSpace(nuevaCita.Email) ||
                    string.IsNullOrWhiteSpace(nuevaCita.Telefono) ||
                    string.IsNullOrWhiteSpace(nuevaCita.Motivo) ||
                    nuevaCita.Fecha == default ||
                    string.IsNullOrWhiteSpace(nuevaCita.Hora))
                {
                    return BadRequest(new { ok = false, error = "Faltan datos requeridos" });
                }

                // --------- EVITAR CITAS REPETIDAS -----------
                using (var transaction = _context.Database.BeginTransaction())
                {
                    var existe = _context.Citas.Any(c => c.Fecha == nuevaCita.Fecha && c.Hora == nuevaCita.Hora);
                    if (existe)
                    {
                        return Conflict(new { ok = false, error = "Ya existe una cita en ese horario" });
                    }

                    nuevaCita.Estado = "Pendiente";
                    _context.Citas.Add(nuevaCita);
                    _context.SaveChanges();

                    transaction.Commit();
                }
                // --------------------------------------------

                // Enviar correo de confirmación al paciente (cliente)
                try
                {
                    EnviarCorreoConfirmacion(nuevaCita);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error enviando correo: {ex.Message}");
                }

                return CreatedAtAction(nameof(GetCitaPorId), new { id = nuevaCita.Id }, new { ok = true, cita = nuevaCita });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { ok = false, error = ex.Message });
            }
        }

        // PATCH: api/Citas/5
        [HttpPatch("{id}")]
        public IActionResult ActualizarCita(int id, [FromBody] Cita citaPatch)
        {
            try
            {
                var cita = _context.Citas.FirstOrDefault(c => c.Id == id);
                if (cita == null)
                    return NotFound(new { ok = false, error = "No encontrada" });

                if (citaPatch.Nombre != null) cita.Nombre = citaPatch.Nombre;
                if (citaPatch.Apellido != null) cita.Apellido = citaPatch.Apellido;
                if (citaPatch.Email != null) cita.Email = citaPatch.Email;
                if (citaPatch.Telefono != null) cita.Telefono = citaPatch.Telefono;
                if (citaPatch.Motivo != null) cita.Motivo = citaPatch.Motivo;
                if (citaPatch.Fecha != default(System.DateTime)) cita.Fecha = citaPatch.Fecha;
                if (!string.IsNullOrWhiteSpace(citaPatch.Hora)) cita.Hora = citaPatch.Hora;
                if (!string.IsNullOrWhiteSpace(citaPatch.Estado)) cita.Estado = citaPatch.Estado;

                bool fechaCambio = citaPatch.Fecha != default(System.DateTime) && citaPatch.Fecha != cita.Fecha;
                bool horaCambio = !string.IsNullOrWhiteSpace(citaPatch.Hora) && citaPatch.Hora != cita.Hora;
                if (fechaCambio || horaCambio)
                {
                    var existe = _context.Citas.Any(c =>
                        c.Id != id &&
                        c.Fecha == cita.Fecha &&
                        c.Hora == cita.Hora
                    );
                    if (existe)
                    {
                        return Conflict(new { ok = false, error = "Ya existe una cita en ese horario" });
                    }
                }

                _context.SaveChanges();
                return Ok(new { ok = true, cita });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { ok = false, error = ex.Message });
            }
        }

        // DELETE: api/Citas/5
        [HttpDelete("{id}")]
        public IActionResult EliminarCita(int id)
        {
            try
            {
                var cita = _context.Citas.FirstOrDefault(c => c.Id == id);
                if (cita == null)
                    return NotFound(new { ok = false, error = "No encontrada" });

                _context.Citas.Remove(cita);
                _context.SaveChanges();
                return Ok(new { ok = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { ok = false, error = ex.Message });
            }
        }

        // GET: api/Citas/buscar?q=texto&fecha=2025-06-23&estado=Pendiente&page=1&pageSize=20
        [HttpGet("buscar")]
        public IActionResult BuscarCitas([FromQuery] string q, [FromQuery] string fecha, [FromQuery] string estado, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page <= 0) page = 1;
                if (pageSize <= 0 || pageSize > 100) pageSize = 20;

                var queryable = _context.Citas.AsQueryable();

                if (!string.IsNullOrWhiteSpace(q))
                    queryable = queryable.Where(c => c.Nombre.Contains(q) || c.Email.Contains(q));

                if (!string.IsNullOrWhiteSpace(fecha))
                    queryable = queryable.Where(c => c.Fecha.ToString().Contains(fecha));

                if (!string.IsNullOrWhiteSpace(estado))
                    queryable = queryable.Where(c => c.Estado == estado);

                var total = queryable.Count();
                var citas = queryable
                    .OrderByDescending(c => c.Fecha)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                return Ok(new { ok = true, total, page, pageSize, citas });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { ok = false, error = ex.Message });
            }
        }

        // MÉTODO AUXILIAR PARA ENVIAR CORREO
        private void EnviarCorreoConfirmacion(Cita cita)
        {
            var fromAddress = new MailAddress("gamercr1985@gmail.com", "Clínica Salud");
            var toAddress = new MailAddress(cita.Email, $"{cita.Nombre} {cita.Apellido}");
            string fromPassword = "lvxx getx norw nynx"; // Contraseña de aplicación de Google

            string subject = "Confirmación de cita médica";
            string body = $@"
Hola {cita.Nombre} {cita.Apellido},

Tu cita ha sido registrada correctamente.

Fecha: {cita.Fecha:dd/MM/yyyy}
Hora: {cita.Hora}

Si tienes alguna duda, responde a este correo.

¡Gracias por confiar en nosotros!
";

            var smtp = new SmtpClient
            {
                Host = "smtp.gmail.com",
                Port = 587,
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(fromAddress.Address, fromPassword)
            };

            using (var message = new MailMessage(fromAddress, toAddress)
            {
                Subject = subject,
                Body = body
            })
            {
                smtp.Send(message);
            }
        }

        // ENDPOINT DE PRUEBA
        [HttpGet("test-mail")]
        public IActionResult TestMail()
        {
            try
            {
                var cita = new Cita
                {
                    Nombre = "Prueba",
                    Apellido = "Test",
                    Email = "gamercr1985@gmail.com", // Cambia por el correo que deseas probar
                    Fecha = DateTime.Now.AddDays(1),
                    Hora = "10:00"
                };
                EnviarCorreoConfirmacion(cita);
                return Ok("Correo enviado correctamente");
            }
            catch (Exception ex)
            {
                return BadRequest("Error: " + ex);
            }
        }
    }
}