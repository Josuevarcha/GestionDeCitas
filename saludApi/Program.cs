using Microsoft.OpenApi.Models;
using saludApi.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Agregar controladores
builder.Services.AddControllers();

// Configurar conexión a la base de datos
builder.Services.AddDbContext<SaludContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("ConexionSql"))
);

// Configurar CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins",
        policy =>
        {
            policy.WithOrigins(
                "http://localhost:8080",                // Frontend local
                "http://localhost:3000",                // Frontend local
                "http://127.0.0.1:5500",                // Live Server local
                "https://gestiondecitasfront.onrender.com" // Frontend desplegado en Render
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
        });
});

// Configurar Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "API", Version = "v1" });
});

var app = builder.Build();

// Usar Swagger
app.UseSwagger();
app.UseSwaggerUI();

// Usar CORS
app.UseCors("AllowSpecificOrigins");

// Redirección HTTPS
app.UseHttpsRedirection();

// Autorización
app.UseAuthorization();

// Mapear controladores
app.MapControllers();

// Ejecutar la aplicación
app.Run();
