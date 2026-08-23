using SaraivaTech.Planoteca.Domain.Enumerable;

namespace SaraivaTech.Planoteca.Infra.Data.Seed
{
    /// <summary>
    /// Os dados que a migration inicial planta.
    ///
    /// O vocabulário de metodologia vem do "Guia prático de utilização de
    /// metodologias e técnicas ativas" (UGB/FERP, 2020), transcrito do
    /// sumário. Os nomes são LITERAIS: "Quizziz" e "Mentimenter" estão como
    /// o documento escreve, e corrigir a grafia aqui quebraria a
    /// rastreabilidade com a fonte.
    /// </summary>
    public static class DadosIniciais
    {
        public static (string Nome, string Tipo)[] Metodologias() =>
        [
            ("Sala de Aula Invertida", TipoMetodologia.Metodologia),
            ("Rotação por Estações de Aprendizagem", TipoMetodologia.Metodologia),
            ("Aprendizagem por Pares", TipoMetodologia.Metodologia),
            ("Ensino Sob Medida", TipoMetodologia.Metodologia),
            ("Aprendizagem Baseada em Equipes", TipoMetodologia.Metodologia),
            ("Método POE", TipoMetodologia.Metodologia),
            ("Aprendizagem Baseada em Problemas", TipoMetodologia.Metodologia),
            ("Aprendizagem Baseada em Projetos", TipoMetodologia.Metodologia),
            ("Gamificação", TipoMetodologia.Metodologia),
            ("Estudo de Casos", TipoMetodologia.Metodologia),
            ("Aprendizagem Baseada em Jogos", TipoMetodologia.Metodologia),
            ("Storytelling", TipoMetodologia.Metodologia),
            ("Design Thinking", TipoMetodologia.Metodologia),
            ("Escape Room", TipoMetodologia.Metodologia),
            ("Pesquisa", TipoMetodologia.Metodologia),
            ("A Escrita Através do Currículo", TipoMetodologia.Metodologia),

            ("Simulações", TipoMetodologia.Tecnica),
            ("Atividades Práticas", TipoMetodologia.Tecnica),
            ("Diagrama de Ishikawa", TipoMetodologia.Tecnica),
            ("Brainstorming", TipoMetodologia.Tecnica),
            ("Ferramenta 5W e 2H", TipoMetodologia.Tecnica),
            ("Técnica dos Chapéus", TipoMetodologia.Tecnica),
            ("Painel Integrado", TipoMetodologia.Tecnica),
            ("Mapa Conceitual e Mapa Mental", TipoMetodologia.Tecnica),
            ("Visita Técnica", TipoMetodologia.Tecnica),
            ("Infográfico", TipoMetodologia.Tecnica),
            ("Canvas", TipoMetodologia.Tecnica),
            ("Menu de Aprendizagem", TipoMetodologia.Tecnica),
            ("Trilhas de Aprendizagem", TipoMetodologia.Tecnica),

            ("Plickers", TipoMetodologia.Ferramenta),
            ("Google Forms", TipoMetodologia.Ferramenta),
            ("Socrative", TipoMetodologia.Ferramenta),
            ("Pixton", TipoMetodologia.Ferramenta),
            ("Quizziz", TipoMetodologia.Ferramenta),
            ("Screencast", TipoMetodologia.Ferramenta),
            ("Mentimenter", TipoMetodologia.Ferramenta),
            ("Kahoot", TipoMetodologia.Ferramenta),
            ("Slido", TipoMetodologia.Ferramenta),
            ("TBL Active", TipoMetodologia.Ferramenta),
            ("EDMODO", TipoMetodologia.Ferramenta),
            ("Classcraft", TipoMetodologia.Ferramenta),
        ];

        public static (int Ordem, string Etapa, string Nome, string Rotulo, string Sigla)[] Series() =>
        [
            (1, EtapaEnsino.FundamentalAnosFinais, "6º ano", "6º ano do Ensino Fundamental", "6º"),
            (2, EtapaEnsino.FundamentalAnosFinais, "7º ano", "7º ano do Ensino Fundamental", "7º"),
            (3, EtapaEnsino.FundamentalAnosFinais, "8º ano", "8º ano do Ensino Fundamental", "8º"),
            (4, EtapaEnsino.FundamentalAnosFinais, "9º ano", "9º ano do Ensino Fundamental", "9º"),
            (5, EtapaEnsino.Medio, "1ª série", "1ª série do Ensino Médio", "1ªEM"),
            (6, EtapaEnsino.Medio, "2ª série", "2ª série do Ensino Médio", "2ªEM"),
            (7, EtapaEnsino.Medio, "3ª série", "3ª série do Ensino Médio", "3ªEM"),
        ];

        /// <summary>
        /// Os componentes, agrupados pelas quatro áreas do Ensino Médio. A
        /// COR é da ÁREA, não do componente: doze cores distinguíveis e
        /// acessíveis não existem, e o card fica coerente quando Química,
        /// Física e Biologia compartilham o tom de Ciências da Natureza.
        ///
        /// Os valores de cor apontam para tokens do tema
        /// (planoteca-web/src/app/estilos/tema.css).
        /// </summary>
        public static (int Ordem, string Area, string Nome, string Sigla, string Cor)[] Componentes() =>
        [
            (1,  "Linguagens e suas Tecnologias", "Língua Portuguesa", "PT", "comp-linguagens"),
            (2,  "Linguagens e suas Tecnologias", "Arte", "AR", "comp-linguagens"),
            (3,  "Linguagens e suas Tecnologias", "Educação Física", "EF", "comp-linguagens"),
            (4,  "Linguagens e suas Tecnologias", "Língua Inglesa", "IN", "comp-linguagens"),
            (5,  "Matemática e suas Tecnologias", "Matemática", "MA", "comp-matematica"),
            (6,  "Ciências da Natureza e suas Tecnologias", "Ciências", "CN", "comp-natureza"),
            (7,  "Ciências da Natureza e suas Tecnologias", "Biologia", "BI", "comp-natureza"),
            (8,  "Ciências da Natureza e suas Tecnologias", "Física", "FI", "comp-natureza"),
            (9,  "Ciências da Natureza e suas Tecnologias", "Química", "QU", "comp-natureza"),
            (10, "Ciências Humanas e Sociais Aplicadas", "História", "HI", "comp-humanas"),
            (11, "Ciências Humanas e Sociais Aplicadas", "Geografia", "GE", "comp-humanas"),
            (12, "Ciências Humanas e Sociais Aplicadas", "Filosofia", "FL", "comp-humanas"),
            (13, "Ciências Humanas e Sociais Aplicadas", "Sociologia", "SO", "comp-humanas"),
        ];
    }
}
