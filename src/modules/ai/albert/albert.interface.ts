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
  albert_small: {
    id: 'albert-small',
    name: 'Albert Small',
    type: 'text-generation',
    max_context_length: 64000,
    owned_by: 'OpenGateLLM',
    aliases: ['meta-llama/Llama-3.1-8B-Instruct'],
  },
  albert_large: {
    id: 'albert-large',
    name: 'Albert Large',
    type: 'image-text-to-text',
    max_context_length: 128000,
    owned_by: 'Albert API (prod)',
    aliases: ['mistralai/Mistral-Small-3.2-24B-Instruct-2506'],
  },
  albert_code: {
    id: 'albert-code',
    name: 'Albert Code',
    type: 'text-generation',
    max_context_length: 131072,
    owned_by: 'OpenGateLLM',
    aliases: ['Qwen/Qwen2.5-Coder-32B-Instruct-AWQ', 'albert-code-beta'],
  },
  embeddings_small: {
    id: 'embeddings-small',
    name: 'Embeddings Small',
    type: 'text-embeddings-inference',
    max_context_length: 8192,
    owned_by: 'OpenGateLLM',
    aliases: ['BAAI/bge-m3'],
  },
  audio_large: {
    id: 'audio-large',
    name: 'Audio Large',
    type: 'automatic-speech-recognition',
    max_context_length: null,
    owned_by: 'OpenGateLLM',
    aliases: ['openai/whisper-large-v3'],
  },
  rerank_small: {
    id: 'rerank-small',
    name: 'Rerank Small',
    type: 'text-classification',
    max_context_length: 8192,
    owned_by: 'OpenGateLLM',
    aliases: ['BAAI/bge-reranker-v2-m3'],
  },
};
