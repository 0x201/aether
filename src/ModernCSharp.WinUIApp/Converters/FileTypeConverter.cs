using Microsoft.UI.Xaml.Data;

using ModernCSharp.Shared.FileServices;

namespace ModernCSharp.WinUIApp.Converters;

public partial class FileTypeConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        if (parameter is string enumString)
        {
            if (!Enum.IsDefined(typeof(FileType), value))
            {
                throw new ArgumentException("ExceptionFileTypeToBooleanConverterValueMustBeAnEnum");
            }

            var enumValue = Enum.Parse<FileType>(enumString);

            return enumValue.Equals(value);
        }

        throw new ArgumentException("ExceptionFileTypeToBooleanConverterParameterMustBeAnEnumName");
    }

    public object ConvertBack(object value, Type targetType, object parameter, string language)
    {
        if (parameter is string enumString)
        {
            return Enum.Parse(typeof(FileType), enumString);
        }

        throw new ArgumentException("ExceptionFileTypeToBooleanConverterParameterMustBeAnEnumName");
    }
}
