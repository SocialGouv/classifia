interface Message {
  role: string;
  content: string;
}

interface ResponseFormat {
  type: 'json_schema' | 'json_object';
  json_schema?: any;
}

interface StreamOptions {
  include_usage?: boolean;
}

interface ToolChoice {
  type: 'function';
  function: {
    name: string;
  };
}

interface Tool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: any;
  };
}

interface ChatSearchArgs {
  [key: string]: any;
}

export interface AlbertChatCompletionRequest {
  messages: Message[];
  model: string;
  frequency_penalty?: number | null;
  logit_bias?: Record<string, number> | null;
  logprobs?: boolean | null;
  top_logprobs?: number | null;
  presence_penalty?: number | null;
  max_tokens?: number | null;
  max_completion_tokens?: number | null;
  n?: number | null;
  response_format?: ResponseFormat | null;
  seed?: number | null;
  stop?: string | string[] | null;
  stream?: boolean | null;
  stream_options?: StreamOptions | null;
  temperature?: number | null;
  top_p?: number | null;
  tools?: Tool[] | null;
  tool_choice?: 'none' | 'auto' | 'required' | ToolChoice | null;
  search?: boolean;
  search_args?: ChatSearchArgs | null;
}

export const ALBERT_MODELS = {
  openweight_small: {
    id: 'openweight-small',
    name: 'Openweight Small',
    type: 'text-generation',
    max_context_length: 256000,
    owned_by: 'OpenGateLLM',
    aliases: ['mistralai/Ministral-3-8B-Instruct-2512'],
  },
  openweight_medium: {
    id: 'openweight-medium',
    name: 'Openweight Medium',
    type: 'image-text-to-text',
    max_context_length: 128000,
    owned_by: 'Albert API (prod)',
    aliases: ['mistralai/Mistral-Small-3.2-24B-Instruct-2506'],
  },
  openweight_large: {
    id: 'openweight-large',
    name: 'Openweight Large',
    type: 'text-generation',
    max_context_length: 131072,
    owned_by: 'Albert API (prod)',
    aliases: ['openai/gpt-oss-120b'],
  },
  openweight_code: {
    id: 'openweight-code',
    name: 'Openweight Code',
    type: 'text-generation',
    max_context_length: 262144,
    owned_by: 'OpenGateLLM',
    aliases: ['Qwen/Qwen3-Coder-30B-A3B-Instruct'],
  },
  openweight_embeddings: {
    id: 'openweight-embeddings',
    name: 'Openweight Embeddings',
    type: 'text-embeddings-inference',
    max_context_length: 8192,
    owned_by: 'OpenGateLLM',
    aliases: ['BAAI/bge-m3'],
  },
  openweight_audio: {
    id: 'openweight-audio',
    name: 'Openweight Audio',
    type: 'automatic-speech-recognition',
    max_context_length: null,
    owned_by: 'OpenGateLLM',
    aliases: ['openai/whisper-large-v3'],
  },
  openweight_rerank: {
    id: 'openweight-rerank',
    name: 'Openweight Rerank',
    type: 'text-classification',
    max_context_length: 8192,
    owned_by: 'OpenGateLLM',
    aliases: ['BAAI/bge-reranker-v2-m3'],
  },
};
