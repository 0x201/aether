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

        builder.OwnsOne(x => x.Address);

        builder.Property(x => x.Quantity)
            .IsRequired();

        builder.Property(x => x.Total)
            .IsRequired();

        builder.Property(x => x.CustomerName)
            .IsRequired();

        builder.Property(x => x.OrderDate)
            .IsRequired();

        builder.Property(x => x.OrderStatus)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(x => x.CreatedBy)
            .IsRequired();

        builder.Property(x => x.LastModifiedBy);
    }
}
