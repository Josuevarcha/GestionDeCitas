namespace saludApi.Data
{
    using Microsoft.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore.Design;

    public class SaludContextFactory : IDesignTimeDbContextFactory<SaludContext>
    {
        public SaludContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<SaludContext>();
            optionsBuilder.UseSqlServer("Server=DESKTOP-7VM6UQE;Database=saludApi;User Id=sa;Password=root1234;TrustServerCertificate=True;MultipleActiveResultSets=True");

            return new SaludContext(optionsBuilder.Options);
        }
    }
}