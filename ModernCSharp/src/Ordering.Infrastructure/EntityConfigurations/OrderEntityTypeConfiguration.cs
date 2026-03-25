namespace ModernCSharp.Ordering.Infrastructure.EntityConfigurations;

public class OrderEntityTypeConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .IsRequired()
            .ValueGeneratedOnAdd()
            .HasColumnName("id");

        builder.OwnsOne(x => x.Address);

        builder.Property(x => x.Quantity)
            .IsRequired()
            .HasColumnName("quantity");

        builder.Property(x => x.Total)
            .IsRequired()
            .HasColumnName("total");

        builder.Property(x => x.CustomerName)
            .IsRequired()
            .HasColumnName("customer_name");

        builder.Property(x => x.OrderDate)
            .IsRequired()
            .HasColumnName("order_date");

        builder.Property(x => x.OrderStatus)
            .HasConversion<string>()
            .IsRequired()
            .HasColumnName("order_status");
    }
}
