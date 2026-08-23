using System;
using System.Linq;
using System.Reflection;
using System.Runtime.Serialization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SaraivaTech.Planoteca.Api.Provider
{
    public class JsonStringEnumMemberConverter : JsonConverterFactory
    {
        private readonly JsonNamingPolicy? _namingPolicy;
        private readonly bool _allowIntegerValues;

        public JsonStringEnumMemberConverter(JsonNamingPolicy? namingPolicy = null, bool allowIntegerValues = true)
        {
            _namingPolicy = namingPolicy;
            _allowIntegerValues = allowIntegerValues;
        }

        public override bool CanConvert(Type typeToConvert)
        {
            return typeToConvert.IsEnum;
        }

        public override JsonConverter? CreateConverter(Type typeToConvert, JsonSerializerOptions options)
        {
            var converterType = typeof(EnumMemberConverter<>).MakeGenericType(typeToConvert);
            return (JsonConverter?)Activator.CreateInstance(converterType, _namingPolicy, _allowIntegerValues);
        }

        private sealed class EnumMemberConverter<T> : JsonConverter<T> where T : struct, Enum
        {
            private readonly JsonNamingPolicy? _namingPolicy;
            private readonly bool _allowIntegerValues;

            // Instanciado via Activator.CreateInstance em CreateConverter - o analisador estatico
            // nao rastreia essa chamada e reporta falso positivo de construtor nao usado.
            public EnumMemberConverter(JsonNamingPolicy? namingPolicy, bool allowIntegerValues) // NOSONAR
            {
                _namingPolicy = namingPolicy;
                _allowIntegerValues = allowIntegerValues;
            }

            public override T Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
                if (reader.TokenType == JsonTokenType.String)
                {
                    var stringValue = reader.GetString();

                    foreach (var field in typeToConvert.GetFields())
                    {
                        var attribute = field.GetCustomAttribute<EnumMemberAttribute>();
                        if (attribute != null && attribute.Value == stringValue)
                        {
                            return (T)field.GetValue(null)!;
                        }

                        if (attribute == null && field.Name.Equals(stringValue, StringComparison.OrdinalIgnoreCase))
                        {
                            return (T)field.GetValue(null)!;
                        }
                    }
                }

                if (_allowIntegerValues && reader.TokenType == JsonTokenType.Number)
                {
                    return (T)Enum.ToObject(typeToConvert, reader.GetInt32());
                }

                throw new JsonException($"Unable to convert \"{reader.GetString()}\" to Enum \"{typeToConvert}\".");
            }

            public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
            {
                var field = typeof(T).GetField(value.ToString());
                var attribute = field?.GetCustomAttribute<EnumMemberAttribute>();

                if (attribute != null && attribute.Value != null)
                {
                    writer.WriteStringValue(attribute.Value);
                }
                else
                {
                    var name = value.ToString();
                    if (_namingPolicy != null)
                    {
                        name = _namingPolicy.ConvertName(name);
                    }
                    writer.WriteStringValue(name);
                }
            }
        }
    }
}
