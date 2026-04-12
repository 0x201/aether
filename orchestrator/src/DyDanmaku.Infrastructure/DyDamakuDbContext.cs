using System.Data;
using Microsoft.EntityFrameworkCore.Storage;

using Aether.Shared;

namespace DyDanmaku.Infrastructure;

public class DyDanmakuDbContext : DbContext, IUnitOfWork
{
    public DbSet<Danmaku> Danmakus { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<CaptureJob> CaptureJobs { get; set; }

    public DbSet<DanmakuAnalysis> DanmakuAnalyses { get; set; }

    private IDbContextTransaction _currentTransaction;

    public bool HasActiveTransaction => _currentTransaction != null;

    public DyDanmakuDbContext(DbContextOptions<DyDanmakuDbContext> options) : base(options)
    {

    }

    public IDbContextTransaction GetCurrentTransaction() => _currentTransaction;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("dydanmaku");
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        modelBuilder.ApplyAuditableEntityConfiguration();

        base.OnModelCreating(modelBuilder);
    }

    public async Task<bool> SaveEntitiesAsync(CancellationToken cancellationToken = default)
    {
        _ = await base.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IDbContextTransaction> BeginTransactionAsync()
    {
        if (_currentTransaction != null) return null;

        _currentTransaction = await Database.BeginTransactionAsync(IsolationLevel.ReadCommitted);

        return _currentTransaction;
    }

    public async Task CommitTransactionAsync(IDbContextTransaction transaction)
    {
        ArgumentNullException.ThrowIfNull(transaction);

        if (transaction != _currentTransaction) throw new InvalidOperationException($"Transaction {transaction.TransactionId} is not current");

        try
        {
            await SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            RollbackTransaction();
            throw;
        }
        finally
        {
            if (HasActiveTransaction)
            {
                _currentTransaction.Dispose();
                _currentTransaction = null;
            }
        }
    }

    public void RollbackTransaction()
    {
        try
        {
            _currentTransaction?.Rollback();
        }
        finally
        {
            if (HasActiveTransaction)
            {
                _currentTransaction.Dispose();
                _currentTransaction = null;
            }
        }
    }
}
