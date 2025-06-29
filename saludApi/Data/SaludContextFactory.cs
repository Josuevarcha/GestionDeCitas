namespace saludApi.Data
{
    using Microsoft.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore.Design;

    public class SaludContextFactory : IDesignTimeDbContextFactory<SaludContext>
    {
        public SaludContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<SaludContext>();
            optionsBuilder.UseNpgsql("Host=dpg-d1gcjq6mcj7s73ck528g-a.oregon-postgres.render.com;Database=saludapidb;Username=saludapidb_user;Password=AmYHua3rIFEcJfkTzBMh3Ce981JEGobP;SSL Mode=Require;Trust Server Certificate=true");

            return new SaludContext(optionsBuilder.Options);
        }
    }
}
