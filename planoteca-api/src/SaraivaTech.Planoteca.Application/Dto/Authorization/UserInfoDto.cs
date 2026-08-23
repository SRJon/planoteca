using System.Collections.Generic;

namespace SaraivaTech.Planoteca.Application.Dto
{
    public record UserInfoDto(
        string sub,
        string mail,
        string locationCountry,
        string FirstName,
        string cn,
        string sn,
        string EmployeeID,
        List<string> groupMembership,
        string UserFullName
    );
}
