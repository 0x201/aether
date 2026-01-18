namespace DyDanmaku.Infrastructure.EntityTypeConfigurations;

public class CaptureJobTypeConfiguration : IEntityTypeConfiguration<CaptureJob>
{
    public void Configure(EntityTypeBuilder<CaptureJob> builder)
    {
        builder.ToTable("capture_jobs");

        builder.HasKey(j => j.Id).HasName("capture_jobs_pk");

        builder.Property(j => j.Id)
            .IsRequired()
            .HasColumnName("id")
            .ValueGeneratedOnAdd();

        builder.Property(j => j.RoomId)
            .IsRequired()
            .HasColumnName("room_id");

        builder.Property(j => j.Status)
            .IsRequired()
            .HasColumnName("status");

        builder.Property(j => j.StartTime)
            .IsRequired()
            .HasColumnName("start_time");

        builder.Property(j => j.EndTime)
            .HasColumnName("end_time");

        builder.Property(j => j.CreatedAt)
            .IsRequired()
            .HasColumnName("created_at");

        builder.Property(j => j.Duration)
            .IsRequired()
            .HasColumnName("duration");

        builder.HasIndex(j => j.Id).HasDatabaseName("capture_jobs_id_idx");
        builder.HasIndex(j => j.RoomId).HasDatabaseName("capture_jobs_room_id_idx");
        builder.HasIndex(j => j.Status).HasDatabaseName("capture_jobs_status_idx");
        
    }
}
