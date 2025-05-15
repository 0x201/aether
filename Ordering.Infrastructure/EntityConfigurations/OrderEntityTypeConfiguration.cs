using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;

namespace ModernCSharp.Ordering.Infrastructure.EntityConfigurations;

public class OrderEntityTypeConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .IsRequired()
            .ValueGeneratedOnAdd();

        builder.Property(x => x.Quantity)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(x => x.Total)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(x => x.CustomerName)
            .HasColumnType("nvarchar(100)")
            .IsRequired();

        builder.Property(x => x.OrderDate)
            .HasColumnType("datetime")
            .IsRequired();

        builder.Property(x => x.OrderStatus)
            .HasColumnType("nvarchar(50)")
            .HasConversion<string>()
            .IsRequired();

        builder.Property(x => x.CreatedBy)
            .HasColumnType("nvarchar(500)");

        builder.Property(x => x.LastModifiedBy)
            .HasColumnType("nvarchar(500)");
    }
}
