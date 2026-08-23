using System.Resources;
using System.Globalization;

namespace SaraivaTech.Planoteca.Domain.Resources
{
    public static class ValidationMessages
    {
        private static ResourceManager resourceMan;

        public static ResourceManager ResourceManager
        {
            get
            {
                if (resourceMan == null)
                {
                    resourceMan = new ResourceManager("SaraivaTech.Planoteca.Domain.Resources.Validations", typeof(ValidationMessages).Assembly);
                }
                return resourceMan;
            }
        }

        public static CultureInfo Culture { get; set; }

        private static string GetString(string name)
        {
            return ResourceManager.GetString(name, Culture);
        }

    }
}
