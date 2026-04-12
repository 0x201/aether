namespace Aether.WinUIApp.Contracts.Services;

public interface IActivationService
{
    Task ActivateAsync(object activationArgs);
}
