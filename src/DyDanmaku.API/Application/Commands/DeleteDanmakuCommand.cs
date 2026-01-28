namespace DyDanmaku.API.Application.Commands;

public class DeleteDanmakuCommand : IRequest<bool>
{
    public int Id { get; set; }
}
