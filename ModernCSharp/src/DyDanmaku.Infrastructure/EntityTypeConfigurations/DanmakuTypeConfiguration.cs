namespace DyDanmaku.Infrastructure.EntityTypeConfigurations;

public class DanmakuTypeConfiguration : IEntityTypeConfiguration<Danmaku>
{
    public void Configure(EntityTypeBuilder<Danmaku> builder)
    {
        builder.ToTable("danmakus");

        builder.HasKey(x => x.Id).HasName("danmakus_pk");

        builder.Property(d => d.Id)
            .IsRequired()
            .HasColumnName("id")
            .ValueGeneratedOnAdd();

        builder.Property(d => d.UserId)
            .HasColumnName("user_id");

        builder.Property(d => d.UserName)
            .HasColumnName("user_name");

        builder.Property(d => d.Content)
            .HasColumnName("content");

        builder.Property(d => d.FanMedalName)
            .HasColumnName("fan_medal_name");

        builder.Property(d => d.FanMedalLevel)
            .HasColumnName("fan_medal_level");

        builder.Property(d => d.UserLevel)
            .HasColumnName("user_level");

        builder.Property(d => d.RoomId)
            .HasColumnName("room_id");


        builder.HasIndex(d => d.Id).HasDatabaseName("danmakus_id_idx");
        builder.HasIndex(d => d.RoomId).HasDatabaseName("danmakus_room_id_idx");
        builder.HasIndex(d => d.UserId).HasDatabaseName("danmakus_user_id_idx");
        builder.HasIndex(d => d.UserName).HasDatabaseName("danmakus_user_name_idx");
        builder.HasIndex(d => d.CreatedAt).HasDatabaseName("danmakus_created_at_idx");
    }
}
