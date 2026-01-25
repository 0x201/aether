namespace ModernCSharp.AppHost.Extensions;


public static class PostgresExtensions
{
    public static IResourceBuilder<T> WithPostgresConnection<T>(
        this IResourceBuilder<T> builder,
        IResourceBuilder<PostgresDatabaseResource> database,
        string schema)
        where T : IResourceWithEnvironment
    {
        return builder.WithEnvironment(async context =>
        {
            var postgres = database.Resource.Parent;
            if (postgres is not null)
            {
                var endpoint = postgres.GetEndpoint("tcp");
                var password = await postgres.PasswordParameter.GetValueAsync(CancellationToken.None);
                
                var connectionString = $"Host={endpoint.Host};" +
                                      $"Port={endpoint.Port};" +
                                      $"Database={database.Resource.Name};" +
                                      "Username=postgres;" +
                                      $"Password={password};" +
                                      $"Search Path={schema}";
                
                context.EnvironmentVariables[$"ConnectionStrings__{database.Resource.Name}"] = connectionString;
            }
        });
    }
}