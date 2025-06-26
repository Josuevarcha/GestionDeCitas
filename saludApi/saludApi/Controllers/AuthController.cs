using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using saludApi.Data; // Asegúrate de tener esto

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly SaludContext _context;

    public AuthController(SaludContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Busca el usuario por correo y password
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Correo == request.Correo && u.Password == request.Password);

        if (usuario != null)
        {
            // Aquí puedes generar un JWT real, si lo deseas
            return Ok(new { token = "token_de_ejemplo" });
        }

        return Unauthorized();
    }
}

public class LoginRequest
{
    public string Correo { get; set; }
    public string Password { get; set; }
}