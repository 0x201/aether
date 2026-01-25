namespace DyDanmaku.Infrastructure.EntityTypeConfigurations;

public class RoomTypeConfiguration : IEntityTypeConfiguration<Room>
{
    public void Configure(EntityTypeBuilder<Room> builder)
    {
        builder.ToTable("rooms");

        builder.HasKey(r => r.Id).HasName("rooms_pk");

        builder.Property(r => r.Id)
            .HasColumnName("id")
            .ValueGeneratedOnAdd()
            .IsRequired();

        builder.Property(r => r.RoomId)
            .IsRequired()
            .ValueGeneratedNever()
            .HasColumnName("room_id");

        builder.Property(r => r.RoomName)
            .IsRequired()
            .HasColumnName("room_name");

        builder.Property(r => r.CreatedAt)
            .IsRequired()
            .HasColumnName("created_at");
    }
}
