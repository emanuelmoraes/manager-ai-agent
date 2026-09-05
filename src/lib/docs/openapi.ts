export interface OpenApiParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema: Record<string, unknown>;
}

export interface OpenApiRequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, { schema: Record<string, unknown>; example?: unknown }>;
}

export interface OpenApiResponse {
  description: string;
  content?: Record<string, { schema: Record<string, unknown>; example?: unknown }>;
}

export interface OpenApiOperation {
  tags?: string[];
  summary: string;
  description: string;
  operationId?: string;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: Record<string, OpenApiResponse>;
  security?: Array<Record<string, string[]>>;
}

export interface OpenApiPathItem {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  patch?: OpenApiOperation;
  delete?: OpenApiOperation;
  options?: OpenApiOperation;
}

export interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name: string;
      email?: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  tags?: Array<{
    name: string;
    description: string;
  }>;
  paths: Record<string, OpenApiPathItem>;
  components: {
    securitySchemes: Record<string, Record<string, unknown>>;
    schemas: Record<string, Record<string, unknown>>;
  };
}

export const openApiSpecification: OpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ManagerAI Agent REST API',
    version: '1.0.0',
    description:
      'API pública para integração e conversação com Agentes Inteligentes autônomos criados na plataforma ManagerAI. Os endpoints utilizam autenticação via Bearer JWT perpétuo gerenciável no painel com validação e revogação instantânea.',
    contact: {
      name: 'ManagerAI Platform',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Servidor Local de Desenvolvimento',
    },
    {
      url: '/',
      description: 'Servidor Atual (Caminho Relativo)',
    },
  ],
  tags: [
    {
      name: 'Chat Externo (v1)',
      description: 'Endpoints públicos para interação em tempo real com os Agentes de IA.',
    },
    {
      name: 'Gestão de Tokens (Interno)',
      description: 'Endpoints utilizados pelo painel para emissão, listagem e revogação de chaves JWT.',
    },
  ],
  paths: {
    '/api/v1/chat': {
      post: {
        tags: ['Chat Externo (v1)'],
        summary: 'Conversar com um Agente de IA',
        description:
          'Envia uma mensagem em linguagem natural para o Agente associado ao Bearer Token informado no cabeçalho Authorization. A requisição é processada de forma contextual, consultando histórico de mensagens, memória de longo prazo e ferramentas configuradas.',
        operationId: 'sendMessageToAgent',
        security: [{ BearerAuth: [] }],
        requestBody: {
          description: 'Corpo da mensagem e identificador opcional de sessão.',
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ChatRequest',
              },
              example: {
                message: 'Olá, poderia analisar o relatório financeiro deste mês?',
                sessionId: 'session_cliente_abc_01',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Mensagem processada com sucesso pelo Agente.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ChatResponse',
                },
                example: {
                  response: 'Olá! Certamente, analisei o relatório financeiro e destaquei os principais pontos...',
                  sessionId: 'session_cliente_abc_01',
                  agentId: 'agent_e1owe9lll',
                },
              },
            },
          },
          '400': {
            description: 'Corpo da requisição inválido ou mensagem em branco.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
                example: {
                  error: 'O campo "message" é obrigatório e deve ser uma string não vazia.',
                },
              },
            },
          },
          '401': {
            description: 'Token de autenticação ausente, expirado, inválido ou revogado.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
                example: {
                  error: 'Este token de acesso foi revogado pelo administrador do sistema.',
                },
              },
            },
          },
          '404': {
            description: 'Agente configurado no token não foi encontrado.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
                example: {
                  error: 'Agente vinculado ao token não foi encontrado ou foi excluído.',
                },
              },
            },
          },
          '500': {
            description: 'Erro interno ao processar a resposta com o provedor de IA.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
                example: {
                  error: 'Erro no processamento da conversa: Falha de comunicação com o provedor de IA.',
                },
              },
            },
          },
        },
      },
      options: {
        tags: ['Chat Externo (v1)'],
        summary: 'Pre-flight CORS',
        description: 'Verificação de pre-flight CORS para clientes navegadores e aplicações web externas.',
        operationId: 'chatOptionsCors',
        responses: {
          '204': {
            description: 'CORS permitido com cabeçalhos Access-Control retornados.',
          },
        },
      },
    },
    '/api/settings/tokens': {
      get: {
        tags: ['Gestão de Tokens (Interno)'],
        summary: 'Listar Tokens de API',
        description: 'Recupera todos os tokens de API cadastrados no Firestore ordenados por data de criação.',
        operationId: 'listApiTokens',
        responses: {
          '200': {
            description: 'Lista de tokens recuperada com sucesso.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tokens: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/ApiTokenRecord',
                      },
                    },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Erro interno ao consultar o banco de dados.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Gestão de Tokens (Interno)'],
        summary: 'Criar novo Token de API',
        description:
          'Gera um token JWT proprietário perpétuo vinculado a um agente e grava o registro de controle no Firestore.',
        operationId: 'createApiToken',
        requestBody: {
          description: 'Nome identificador e ID do agente vinculado.',
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateTokenRequest',
              },
              example: {
                name: 'Integração CRM Atendimento',
                agentId: 'agent_e1owe9lll',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Token de API gerado com sucesso.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: {
                      type: 'string',
                      description: 'Token JWT assinado com HMAC-SHA256.',
                    },
                    record: {
                      $ref: '#/components/schemas/ApiTokenRecord',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Campos obrigatórios inválidos ou ausentes.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Gestão de Tokens (Interno)'],
        summary: 'Revogar Token de API',
        description: 'Altera o status do token para "revoked", bloqueando imediatamente chamadas futuras.',
        operationId: 'revokeApiToken',
        requestBody: {
          description: 'Identificador único do token (jti).',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: {
                    type: 'string',
                    description: 'Identificador único (JTI) do token a ser revogado.',
                    example: 'tok_1788615230000_2gfjzth',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token revogado com sucesso.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                  },
                },
              },
            },
          },
          '400': {
            description: 'ID do token não fornecido.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Insira o token JWT gerado na aba "Tokens de API" das Configurações do ManagerAI.',
      },
    },
    schemas: {
      ChatRequest: {
        type: 'object',
        required: ['message'],
        properties: {
          message: {
            type: 'string',
            description: 'Mensagem de texto enviada pelo usuário ao Agente.',
            example: 'Olá, qual é o status do projeto?',
          },
          sessionId: {
            type: 'string',
            description:
              'Identificador de sessão de conversa customizado. Se omitido, a sessão inicial padrão do token é utilizada.',
            example: 'session_cliente_123',
          },
        },
      },
      ChatResponse: {
        type: 'object',
        required: ['response', 'sessionId', 'agentId'],
        properties: {
          response: {
            type: 'string',
            description: 'Texto de resposta sintetizado pelo Agente.',
            example: 'Olá! O projeto está em andamento com 85% das tarefas concluídas.',
          },
          sessionId: {
            type: 'string',
            description: 'Identificador da sessão onde o contexto foi mantido.',
            example: 'session_cliente_123',
          },
          agentId: {
            type: 'string',
            description: 'Identificador do agente de IA que atendeu a requisição.',
            example: 'agent_e1owe9lll',
          },
        },
      },
      CreateTokenRequest: {
        type: 'object',
        required: ['name', 'agentId'],
        properties: {
          name: {
            type: 'string',
            description: 'Nome identificador amigável para o token.',
            example: 'Integração WhatsApp Bot',
          },
          agentId: {
            type: 'string',
            description: 'ID do agente de IA ao qual este token terá acesso.',
            example: 'agent_e1owe9lll',
          },
        },
      },
      ApiTokenRecord: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Identificador JTI único do token.',
            example: 'tok_1788615230000_2gfjzth',
          },
          name: {
            type: 'string',
            description: 'Nome atribuído ao token.',
            example: 'Integração ERP',
          },
          agentId: {
            type: 'string',
            description: 'ID do agente vinculado.',
            example: 'agent_e1owe9lll',
          },
          initialSessionId: {
            type: 'string',
            description: 'Sessão padrão criada na geração do token.',
            example: 'session_1788615230000_2gfjzth',
          },
          status: {
            type: 'string',
            enum: ['active', 'revoked'],
            description: 'Situação de validade do token.',
            example: 'active',
          },
          createdAt: {
            type: 'object',
            description: 'Timestamp de criação no Firestore.',
          },
          lastUsedAt: {
            type: 'object',
            nullable: true,
            description: 'Timestamp do último uso.',
          },
          revokedAt: {
            type: 'object',
            nullable: true,
            description: 'Timestamp em que o token foi revogado.',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'string',
            description: 'Descrição detalhada da falha ou motivo da recusa da requisição.',
            example: 'Token de autorização ausente ou em formato incorreto.',
          },
        },
      },
    },
  },
};
