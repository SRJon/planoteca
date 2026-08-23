export interface paths {
    "/api/v1/person-samples": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Filtrar/buscar pessoas
         * @description Lista as pessoas da base. Responde 204 SEM CORPO quando o total e zero — o cabecalho X-Total-Count so acompanha o 200.
         */
        get: operations["PersonSample_Get"];
        put?: never;
        /** Criar uma nova pessoa */
        post: operations["PersonSample_Post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/person-samples/All": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar todas as pessoas da base
         * @description Igual ao GET /person-samples, sem o parametro active. Responde 204 SEM CORPO quando o total e zero.
         */
        get: operations["PersonSample_GetAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/person-samples/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Recuperar uma pessoa pelo ID */
        get: operations["PersonSample_GetById"];
        /** Atualizar pessoa */
        put: operations["PersonSample_Put"];
        post?: never;
        /** Deletar uma pessoa pelo ID */
        delete: operations["PersonSample_Delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Autenticar e obter o token
         * @description LACUNA DECLARADA: o back-end nao implementa esta rota. Ela e o contrato a cumprir.
         */
        post: operations["Auth_Login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/userinfo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Dados do usuario autenticado
         * @description LACUNA DECLARADA: o back-end nao implementa esta rota. Ela e o contrato a cumprir. Exige o Bearer do /auth/login.
         */
        get: operations["Auth_UserInfo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /**
         * @description Deriva do record PersonSampleDto (SaraivaTech.Default.Application/Dto/PersonSampleDto.cs:17-27). O JSON sai em camelCase: o Program.cs nao declara PropertyNamingPolicy, entao vale o default do AddJsonOptions.
         *
         *     O Program.cs tambem roda com DefaultIgnoreCondition = WhenWritingNull, entao campo nulo SOME do JSON em vez de virar null. Dos sete campos, so lastName pode sumir: os outros seis sao tipos de valor ou string [Required], que nunca sao nulos na saida.
         */
        PersonSampleDto: {
            /**
             * Format: uuid
             * @description Id da pessoa. Guid. No POST o back-end ignora o valor enviado e gera o proprio.
             */
            id: string;
            /** @description Primeiro nome. [Required] no DTO — o ModelState rejeita a ausencia com 400. */
            firstName: string;
            /** @description Sobrenome. Sem [Required]. Some do JSON quando nulo. */
            lastName?: string;
            /**
             * Format: date-time
             * @description Data de nascimento. DateTime nao anulavel — sempre presente.
             */
            dateBirth: string;
            type: components["schemas"]["PersonTypeSample"];
            /** @description Status ativo. [Required] e bool nao anulavel. */
            active: boolean;
            /**
             * Format: int32
             * @description Idade. Calculada pelo back-end.
             */
            age: number;
        };
        /**
         * @description Tipo da pessoa. Sai como TEXTO, nao como numero: o enum PersonTypeSample tem [EnumMember(Value = "MALE")] e [EnumMember(Value = "FEMALE")], e o Program.cs registra o JsonStringEnumMemberConverter. Os valores numericos do C# (Male = 1, Female = 2) nao aparecem no fio.
         * @enum {string}
         */
        PersonTypeSample: "MALE" | "FEMALE";
        /** @description Deriva da classe Error (SaraivaTech.Default.Application/Base/Error.cs). E o corpo padrao de erro, produzido pelo StandardErrorResultFilter e pelo InvalidModelStateResponseFactory do Program.cs. */
        Error: {
            /** @description As mensagens de validacao ou de falha. */
            messages?: string[];
            /**
             * Format: int32
             * @description O codigo HTTP repetido no corpo.
             */
            status?: number;
        };
        /** @description LACUNA DECLARADA: nao existe DTO correspondente no back-end. O corpo abaixo e a forma minima que o front-end envia (RF-05). Confirme contra a implementacao real antes da primeira integracao. */
        LoginRequest: {
            username: string;
            /** Format: password */
            password: string;
        };
        /**
         * @description Deriva do record TokenDto (SaraivaTech.Default.Application/Dto/Authorization/TokenDto.cs:3-9). Os cinco campos ja nascem minusculos e com underscore no C#, entao o serializador nao muda nada: eles chegam em snake_case no fio.
         *
         *     refresh_token e id_token sao opcionais aqui, e nao no C#, por causa do WhenWritingNull: campo nulo some do JSON.
         */
        TokenDto: {
            /** @description O token que vai no cabecalho Authorization. E OPACO para o front — nada o decodifica. */
            access_token: string;
            /** @description O esquema do cabecalho Authorization. Esperado: Bearer. */
            token_type: string;
            /**
             * Format: int32
             * @description Validade do access_token em SEGUNDOS a partir do recebimento, nao em milissegundos e nao um instante absoluto. E a unica fonte de expiracao do front.
             */
            expires_in: number;
            /** @description Sem consumidor hoje: o back-end boilerplate nao expoe rota de renovacao. Guardado, nao usado. */
            refresh_token?: string;
            id_token?: string;
        };
        /**
         * @description Deriva do record UserInfoDto (SaraivaTech.Default.Application/Dto/Authorization/UserInfoDto.cs:5-15).
         *
         *     ATENCAO — CASING DERIVADO, NAO OBSERVADO: o record tem casing MISTO no C#. sub, mail, locationCountry, cn, sn e groupMembership ja nascem minusculos; FirstName, EmployeeID e UserFullName nascem em PascalCase. Como o Program.cs nao declara PropertyNamingPolicy, o serializador aplica camelCase e emite firstName, employeeID e userFullName. Esses tres nomes NAO foram vistos numa resposta real — a rota nem existe ainda. Confirme campo a campo contra a API viva; employeeID e o candidato mais provavel a divergir, porque a politica camelCase so minuscula a primeira letra.
         *
         *     Todo campo e opcional pelo WhenWritingNull do Program.cs.
         */
        UserInfoDto: {
            /** @description Identificador do usuario no diretorio. */
            sub?: string;
            /** Format: email */
            mail?: string;
            locationCountry?: string;
            /** @description C#: FirstName. */
            firstName?: string;
            /** @description Common name do LDAP. */
            cn?: string;
            /** @description Surname do LDAP. */
            sn?: string;
            /** @description C#: EmployeeID. O casing mais fragil deste schema. */
            employeeID?: string;
            /** @description Os grupos do diretorio. Alimentam o menu e a guarda de rota (RF-06). */
            groupMembership?: string[];
            /** @description C#: UserFullName. Nome para exibir na barra superior. */
            userFullName?: string;
        };
    };
    responses: {
        /** @description Uma validacao de negocio nao foi atendida. */
        Error400: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Registro nao encontrado. */
        Error404: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Oops! algum problema ocorreu no servidor. */
        Error500: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
    };
    parameters: {
        /** @description Id da pessoa. */
        id: string;
        /** @description Pagina, base 1. O FilterDto nasce com page = 1. */
        page: number;
        /** @description Itens por pagina. O FilterDto nasce com per_page = int.MaxValue, ou seja, sem paginacao quando o parametro nao vai. */
        per_page: number;
        /** @description Campo de ordenacao, no nome C# da propriedade (PascalCase). O prefixo - marca DESCENDENTE: FirstName ordena ascendente, -FirstName ordena descendente. O getter do FilterDto traduz o prefixo para o sufixo ' desc' antes de chegar no repositorio. O FilterDto nasce com sort = 'Id'. */
        sort: string;
        /** @description Filtro no formato {Key}:{operador}:{Value}, separado por virgula. Ex.: FirstName:=:Leonardo,LastName:=:Silva ou FirstName:like:leo */
        filter: string;
    };
    requestBodies: never;
    headers: {
        /** @description Total de registros que o filtro encontrou, ignorando a paginacao. So acompanha o 200 — o 204 nao o traz. Exposto pelo CORS via WithExposedHeaders. */
        "X-Total-Count": number;
    };
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    PersonSample_Get: {
        parameters: {
            query?: {
                /** @description Limita o resultado as pessoas ativas. Ausente = sem filtro por status. */
                active?: boolean;
                /** @description Pagina, base 1. O FilterDto nasce com page = 1. */
                page?: components["parameters"]["page"];
                /** @description Itens por pagina. O FilterDto nasce com per_page = int.MaxValue, ou seja, sem paginacao quando o parametro nao vai. */
                per_page?: components["parameters"]["per_page"];
                /** @description Campo de ordenacao, no nome C# da propriedade (PascalCase). O prefixo - marca DESCENDENTE: FirstName ordena ascendente, -FirstName ordena descendente. O getter do FilterDto traduz o prefixo para o sufixo ' desc' antes de chegar no repositorio. O FilterDto nasce com sort = 'Id'. */
                sort?: components["parameters"]["sort"];
                /** @description Filtro no formato {Key}:{operador}:{Value}, separado por virgula. Ex.: FirstName:=:Leonardo,LastName:=:Silva ou FirstName:like:leo */
                filter?: components["parameters"]["filter"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista de pessoas. */
            200: {
                headers: {
                    "X-Total-Count": components["headers"]["X-Total-Count"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PersonSampleDto"][];
                };
            };
            /** @description Nenhuma pessoa encontrada. SEM CORPO e SEM X-Total-Count. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Error400"];
            500: components["responses"]["Error500"];
        };
    };
    PersonSample_Post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PersonSampleDto"];
            };
        };
        responses: {
            /** @description Pessoa criada. O back-end responde Created("", response) — o cabecalho Location vem vazio. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PersonSampleDto"];
                };
            };
            400: components["responses"]["Error400"];
            500: components["responses"]["Error500"];
        };
    };
    PersonSample_GetAll: {
        parameters: {
            query?: {
                /** @description Pagina, base 1. O FilterDto nasce com page = 1. */
                page?: components["parameters"]["page"];
                /** @description Itens por pagina. O FilterDto nasce com per_page = int.MaxValue, ou seja, sem paginacao quando o parametro nao vai. */
                per_page?: components["parameters"]["per_page"];
                /** @description Campo de ordenacao, no nome C# da propriedade (PascalCase). O prefixo - marca DESCENDENTE: FirstName ordena ascendente, -FirstName ordena descendente. O getter do FilterDto traduz o prefixo para o sufixo ' desc' antes de chegar no repositorio. O FilterDto nasce com sort = 'Id'. */
                sort?: components["parameters"]["sort"];
                /** @description Filtro no formato {Key}:{operador}:{Value}, separado por virgula. Ex.: FirstName:=:Leonardo,LastName:=:Silva ou FirstName:like:leo */
                filter?: components["parameters"]["filter"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista de pessoas. */
            200: {
                headers: {
                    "X-Total-Count": components["headers"]["X-Total-Count"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PersonSampleDto"][];
                };
            };
            /** @description Nenhuma pessoa encontrada. SEM CORPO e SEM X-Total-Count. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Error400"];
            500: components["responses"]["Error500"];
        };
    };
    PersonSample_GetById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Id da pessoa. */
                id: components["parameters"]["id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A pessoa solicitada. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PersonSampleDto"];
                };
            };
            400: components["responses"]["Error400"];
            404: components["responses"]["Error404"];
            500: components["responses"]["Error500"];
        };
    };
    PersonSample_Put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Id da pessoa. */
                id: components["parameters"]["id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PersonSampleDto"];
            };
        };
        responses: {
            /** @description Pessoa atualizada. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PersonSampleDto"];
                };
            };
            400: components["responses"]["Error400"];
            404: components["responses"]["Error404"];
            500: components["responses"]["Error500"];
        };
    };
    PersonSample_Delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Id da pessoa. */
                id: components["parameters"]["id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Pessoa deletada. SEM CORPO. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Error400"];
            404: components["responses"]["Error404"];
            500: components["responses"]["Error500"];
        };
    };
    Auth_Login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Credenciais aceitas. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenDto"];
                };
            };
            400: components["responses"]["Error400"];
            /** @description Credenciais recusadas. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            500: components["responses"]["Error500"];
        };
    };
    Auth_UserInfo: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Dados do usuario. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserInfoDto"];
                };
            };
            /** @description Token ausente, invalido ou expirado. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            500: components["responses"]["Error500"];
        };
    };
}
