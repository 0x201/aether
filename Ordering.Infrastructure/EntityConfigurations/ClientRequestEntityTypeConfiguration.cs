using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ModernCSharp.Ordering.Infrastructure.Idempotency;

namespace ModernCSharp.Ordering.Infrastructure.EntityConfigurations;

public class ClientRequestEntityTypeConfiguration : IEntityTypeConfiguration<ClientRequest>
{
    public void Configure(EntityTypeBuilder<ClientRequest> builder)
    {
        builder.ToTable("requests");
    }
}
