namespace ModernCSharp.ApplicationCore.Models;

public class JsonWrapper<T>(List<T> items)
{
    public List<T> Items { get; set; } = items;
}
