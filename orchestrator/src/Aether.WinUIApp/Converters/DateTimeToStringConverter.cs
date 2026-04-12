using Microsoft.UI.Xaml.Data;

namespace Aether.WinUIApp.Converters;

public class DateTimeToStringConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        if (value is DateTime dateTime)
        {
            string format = parameter as string ?? "g";
            return dateTime.ToString(format);
        }
        return value;
    }

    public object ConvertBack(object value, Type targetType, object parameter, string language)
    {
        throw new NotImplementedException();
    }
}
