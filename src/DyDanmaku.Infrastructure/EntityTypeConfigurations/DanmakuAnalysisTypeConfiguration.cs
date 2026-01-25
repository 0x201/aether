namespace DyDanmaku.Infrastructure.EntityTypeConfigurations;

public class DanmakuAnalysisTypeConfiguration : IEntityTypeConfiguration<DanmakuAnalysis>
{
    public void Configure(EntityTypeBuilder<DanmakuAnalysis> builder)
    {
        builder.ToTable("danmaku_analyses");

        builder.HasKey(x => x.Id).HasName("danmaku_analyses_pk");

        builder.Property(d => d.Id)
            .HasColumnName("id")
            .IsRequired()
            .ValueGeneratedOnAdd();

        builder.Property(d => d.RoomId)
            .HasColumnName("room_id");

        builder.Property(d => d.StartTime)
            .IsRequired()
            .HasColumnName("start_time");

        builder.Property(d => d.EndTime)
            .IsRequired()
            .HasColumnName("end_time");

        builder.Property(d => d.Type)
            .IsRequired()
            .HasColumnName("type");

        builder.Property(d => d.Frequencies)
            .HasColumnName("frequencies");

        builder.HasIndex(d => d.Id)
            .HasDatabaseName("danmaku_analyses_id_idx");

        builder.HasIndex(d => d.RoomId)
            .HasDatabaseName("danmaku_analyses_room_id_idx");
    }
}
