namespace SaraivaTech.Planoteca.Application.Dto
{
    public record TokenDto(
        string access_token,
        string token_type,
        int expires_in,
        string refresh_token,
        string id_token
    );
}
