using Microsoft.EntityFrameworkCore;
using saludApi.Models;

namespace saludApi.Data
{
    public class SaludContext : DbContext
    {
        public SaludContext(DbContextOptions<SaludContext> options) : base(options)
        {
        }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Cita> Citas { get; set; } // <-- Agrega esta línea
    }
}