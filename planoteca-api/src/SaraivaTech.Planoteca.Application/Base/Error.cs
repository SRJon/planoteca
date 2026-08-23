using System.Collections.Generic;

namespace SaraivaTech.Planoteca.Application.Base
{
    public class Error
    {
        public IEnumerable<string> messages { get; set; }
        public int status { get; set; }

    }
}