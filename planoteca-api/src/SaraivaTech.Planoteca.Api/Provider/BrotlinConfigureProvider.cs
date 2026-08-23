
    using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;

namespace SaraivaTech.Planoteca.Api.Provider
{
    public class BrotlinConfigureProvider : ICompressionProvider
    {
        public string EncodingName => "br";

        public bool SupportsFlush => true;

        public Stream CreateStream(Stream outputStream)
        {
            return new BrotliStream(outputStream, CompressionLevel.Fastest);
        }
    }
}
