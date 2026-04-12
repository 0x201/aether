using Microsoft.UI.Xaml.Data;

namespace Aether.WinUIApp.Converters;

public partial class BooleanToVisibilityConverter : IValueConverter
{
    public Visibility TrueValue { get; set; } = Visibility.Visible;

    public Visibility FalseValue { get; set; } = Visibility.Collapsed;

    public object Convert(object value, Type targetType, object parameter, string language)
    {
        if (parameter is bool input)
        {
            return input ? TrueValue : FalseValue;
        }

        return FalseValue;
    }
    public object ConvertBack(object value, Type targetType, object parameter, string language)
    {
        if (parameter is Visibility visibility)
        {
            return visibility == TrueValue;
        }

        return false;
    }
}
