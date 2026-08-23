using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Reflection;
using System.Resources;
using System.Text;

namespace SaraivaTech.Planoteca.Domain.Base
{
    [AttributeUsage(AttributeTargets.Field)]
    public class LocalizedEnumAttribute : DescriptionAttribute
    {
        private readonly string _resourceKey;
        private readonly ResourceManager _resource;
        public LocalizedEnumAttribute(string resourceKey, Type resourceType)
        {
            _resource = new ResourceManager(resourceType);
            _resourceKey = resourceKey;
        }

        public override string Description
        {
            get
            {
                string displayName;
                try
                {
                    displayName = _resource.GetString(_resourceKey);
                }
                catch (MissingManifestResourceException)
                {
                    // resourceType nao corresponde a nenhum .resx embutido - trata como chave nao encontrada
                    displayName = null;
                }

                return string.IsNullOrEmpty(displayName)
                    ? string.Format("[[{0}]]", _resourceKey)
                    : displayName;
            }
        }
    }
}
