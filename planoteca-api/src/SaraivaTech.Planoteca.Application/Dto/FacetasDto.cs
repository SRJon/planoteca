using System;
using System.Collections.Generic;

namespace SaraivaTech.Planoteca.Application.Dto
{
    /// <summary>
    /// Quantos planos cada item do vocabulário responde, dentro do recorte
    /// que a Biblioteca tem aberto.
    ///
    /// Só id e total. Nome, sigla e cor vêm de `GET /vocabulary`, que o front
    /// já mantém em cache por uma hora — devolvê-los de novo aqui criaria uma
    /// segunda fonte para o mesmo dado, e a cada teclada da busca.
    ///
    /// Id ausente da lista vale zero (RF-01). O item continua na tela, e
    /// continua clicável.
    /// </summary>
    public class FacetasDto
    {
        public List<ContagemDto> Series { get; set; } = [];
        public List<ContagemDto> Componentes { get; set; } = [];
        public List<ContagemDto> Metodologias { get; set; } = [];
    }

    public class ContagemDto
    {
        public Guid Id { get; set; }
        public int Total { get; set; }
    }
}
