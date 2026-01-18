using DyDanmaku.Domain.Entity;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DyDanmaku.Infrastructure.EntityTypeConfigurations;

public class RoomTypeConfiguration : IEntityTypeConfiguration<Room>
{
    public void Configure(EntityTypeBuilder<Room> builder)
    {
        builder.ToTable("rooms");

        builder.HasKey(r => r.RoomId).HasName("rooms_pk");

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
