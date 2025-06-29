using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using saludApi.Data;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<SaludContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("ConexionSql"))
);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins",
        policy =>
        {
            policy.WithOrigins(
                "http://localhost:8080",
                "http://localhost:3000",
                "http://127.0.0.1:5500",
                "https://gestiondecitasfront.onrender.com"// Aquí la URL real de tu frontend
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
        });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "API", Version = "v1" });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowSpecificOrigins");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();