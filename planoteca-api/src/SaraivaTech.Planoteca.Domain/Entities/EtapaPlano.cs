using System;
using SaraivaTech.Planoteca.Domain.Base;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Um passo do roteiro: "ETAPA 1: Início da Missão".
    ///
    /// É a espinha do relato, e por isso é dado e não um campo de texto
    /// corrido: permite mostrar o passo a passo na página do plano sem abrir
    /// o PDF, e buscar dentro dele depois.
    /// </summary>
    public class EtapaPlano : Entity
    {
        public Guid PlanoId { get; set; }
        public Plano? Plano { get; set; }
        public int Ordem { get; set; }
        public string? Titulo { get; set; }
        public string Descricao { get; set; } = string.Empty;
    }
}
