namespace Aether.WinFormsApp.Models;

public delegate Task AsyncEventHandler<TEventArgs>(object sender, TEventArgs e);
public delegate Task AsyncEventHandler(object sender, EventArgs e);
