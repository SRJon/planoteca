using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SaraivaTech.Planoteca.Api.Converters
{
    public class EmptyStringGuidConverter : JsonConverter<Guid>
    {
        public override Guid Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String)
            {
                var stringValue = reader.GetString();
                if (string.IsNullOrWhiteSpace(stringValue))
                {
                    return Guid.Empty;
                }
                
                if (Guid.TryParse(stringValue, out var guid))
                {
                    return guid;
                }
            }
            else if (reader.TokenType == JsonTokenType.Null)
            {
                // Para tipos primitivos como Guid (não anulam), quando vem nulo a API decide converter para Vazio/Default
                return Guid.Empty;
            }

            // Fallback for default behavior
            return reader.GetGuid();
        }

        public override void Write(Utf8JsonWriter writer, Guid value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value);
        }
    }

    public class EmptyStringNullableGuidConverter : JsonConverter<Guid?>
    {
        public override Guid? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String)
            {
                var stringValue = reader.GetString();
                if (string.IsNullOrWhiteSpace(stringValue))
                {
                    return null;
                }
                
                if (Guid.TryParse(stringValue, out var guid))
                {
                    return guid;
                }
            }
            else if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            // Fallback for default behavior
            if (reader.TryGetGuid(out var parsedGuid))
            {
                return parsedGuid;
            }

            return null;
        }

        public override void Write(Utf8JsonWriter writer, Guid? value, JsonSerializerOptions options)
        {
            if (value.HasValue)
            {
                writer.WriteStringValue(value.Value);
            }
            else
            {
                writer.WriteNullValue();
            }
        }
    }
}
