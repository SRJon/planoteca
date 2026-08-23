using System;
using System.Security.Cryptography;
using System.Text;

namespace SaraivaTech.Planoteca.Application.Core.Helpers
{
    public static class CriptografiaHelper
    {
        public static string DecryptAes(string encrypted, string key)
        {
            var base64 = encrypted.Replace('-', '+').Replace('_', '/');
            switch (base64.Length % 4)
            {
                case 2: base64 += "=="; break;
                case 3: base64 += "="; break;
            }

            var cipherBytes = Convert.FromBase64String(base64);
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var iv = new byte[16];

            using var aes = Aes.Create();
            aes.Key = keyBytes;
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var decryptor = aes.CreateDecryptor();
            var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
            var result = Encoding.UTF8.GetString(plainBytes);

            var clean = result.Replace("-", "");
            if (clean.Length >= 3)
                return clean.Insert(clean.Length - 2, "-");
            return clean;
        }

        public static string EncryptAes(string plain, string key)
        {
            var plainBytes = Encoding.UTF8.GetBytes(plain);
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var iv = new byte[16];

            using var aes = Aes.Create();
            aes.Key = keyBytes;
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var encryptor = aes.CreateEncryptor();
            var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

            return Convert.ToBase64String(cipherBytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .TrimEnd('=');
        }
    }
}
