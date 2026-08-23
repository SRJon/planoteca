using System;
using System.Collections.Generic;
using System.Text;

namespace SaraivaTech.Planoteca.Domain.Base.Interfaces
{
    public interface IFilterParameters
    {
        int page { get; set; }

        int per_page { get; set; }

        string sort { get; set; }

        string filter { get; set; }
    }
}
