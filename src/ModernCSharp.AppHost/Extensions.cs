namespace ModernCSharp.AppHost.Extensions;


public static class PostgresExtensions
{
    public static IResourceBuilder<T> WithPostgresSchema<T>(
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
                var host = postgres.PrimaryEndpoint.Host;
                var port = postgres.PrimaryEndpoint.Port;
                var username = await postgres.UserNameReference.GetValueAsync(CancellationToken.None);
                var password = await postgres.PasswordParameter.GetValueAsync(CancellationToken.None);
                
                var connectionString = $"Host={host};" +
                                      $"Port={port};" +
                                      $"Database={database.Resource.Name};" +
                                      $"Username={username};" +
                                      $"Password={password};" +
                                      $"Search Path={schema}";
                
                context.EnvironmentVariables[$"ConnectionStrings__{database.Resource.Name}"] = connectionString;
            }
        });
    }
}