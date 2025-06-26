using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using saludApi.Data;
using saludApi.Models;

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

                // Validar que no exista una cita para la misma fecha/hora
                var existe = _context.Citas.Any(c => c.Fecha == nuevaCita.Fecha && c.Hora == nuevaCita.Hora);
                if (existe)
                {
                    return Conflict(new { ok = false, error = "Ya existe una cita en ese horario" });
                }

                nuevaCita.Estado = "Pendiente";
                _context.Citas.Add(nuevaCita);
                _context.SaveChanges();

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

                // Solo actualiza los campos que vienen en el body (parcial)
                if (citaPatch.Nombre != null) cita.Nombre = citaPatch.Nombre;
                if (citaPatch.Apellido != null) cita.Apellido = citaPatch.Apellido;
                if (citaPatch.Email != null) cita.Email = citaPatch.Email;
                if (citaPatch.Telefono != null) cita.Telefono = citaPatch.Telefono;
                if (citaPatch.Motivo != null) cita.Motivo = citaPatch.Motivo;
                if (citaPatch.Fecha != default(System.DateTime)) cita.Fecha = citaPatch.Fecha;
                if (!string.IsNullOrWhiteSpace(citaPatch.Hora)) cita.Hora = citaPatch.Hora;
                if (!string.IsNullOrWhiteSpace(citaPatch.Estado)) cita.Estado = citaPatch.Estado;

                // Solo valida conflicto si cambia fecha u hora
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
    }
}