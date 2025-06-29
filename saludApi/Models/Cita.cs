namespace saludApi.Models
{
    public class Cita
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
        public string Apellido { get; set; }
        public string Email { get; set; }
        public string Telefono { get; set; }
        public string Motivo { get; set; }
        public DateTime Fecha { get; set; }
        public string Hora { get; set; } // Ejemplo: "10:30"
        public string Estado { get; set; } = "Pendiente";
    }
}
