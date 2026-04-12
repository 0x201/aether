namespace Aether.Ordering.Domain.Models;

public class JsonWrapper<T>(IEnumerable<T> items)
{
    public IEnumerable<T> Items { get; set; } = items;
}
