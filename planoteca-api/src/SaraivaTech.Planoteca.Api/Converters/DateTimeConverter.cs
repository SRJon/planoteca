using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SaraivaTech.Planoteca.Api.Converters
{
    public class DateTimeConverter : JsonConverter<DateTime>
    {
        private readonly TimeZoneInfo _brasiliaTimeZone;

        public DateTimeConverter()
        {
            try
            {
                _brasiliaTimeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
            }
            catch (TimeZoneNotFoundException)
            {
                _brasiliaTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
            }
        }

        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TryGetDateTime(out DateTime date))
            {
                if (date.Kind == DateTimeKind.Utc)
                {
                    return TimeZoneInfo.ConvertTimeFromUtc(date, _brasiliaTimeZone);
                }
                return date;
            }
            return DateTime.MinValue;
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString("yyyy-MM-ddTHH:mm:ss.fff"));
        }
    }
}
