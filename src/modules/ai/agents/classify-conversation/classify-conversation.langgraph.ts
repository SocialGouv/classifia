import { JsonOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Annotation, RetryPolicy, StateGraph } from '@langchain/langgraph';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { z } from 'zod';

import { classifyConversationPrompt } from './classify-conversation.prompt';
import { classifyConversationSchema } from './classify-conversation.schema';

import { LangChainChatModelAdapter } from '@/modules/ai/adapters/langchain-chat-model.adapter';

type ClassificationOutput = z.infer<typeof classifyConversationSchema>;

const GraphState = Annotation.Root({
  transcript: Annotation<string>,
  result: Annotation<ClassificationOutput | null>,
});

@Injectable()
export class ClassifyConversationLangGraphAgent {
  private readonly logger = new Logger(ClassifyConversationLangGraphAgent.name);
  private readonly graph;

  constructor(model: LangChainChatModelAdapter) {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', classifyConversationPrompt],
      ['user', '{transcript}'],
    ]);

    const parser = new JsonOutputParser();
    const chain = prompt.pipe(model).pipe(parser);

    const classifyNode = async (state: typeof GraphState.State) => {
      const result = await chain.invoke({
        transcript: state.transcript,
      });
      const validated = classifyConversationSchema.parse(result);
      return { result: validated };
    };

    const retryPolicy: RetryPolicy = {
      maxAttempts: 3,
      retryOn: (error: any) => {
        return error instanceof z.ZodError || error.message?.includes('API');
      },
    };

    const workflow = new StateGraph(GraphState)
      .addNode('classify', classifyNode, { retryPolicy })
      .addEdge('__start__', 'classify')
      .addEdge('classify', '__end__');

    this.graph = workflow.compile();
  }

  async classify(transcript: string): Promise<ClassificationOutput> {
    try {
      const result = await this.graph.invoke({
        transcript,
        result: null,
      });

      if (!result.result) {
        throw new Error('Failed to classify after 3 attempts');
      }

      return result.result;
    } catch (error) {
      this.logger.error(
        'Error classifying conversation',
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException(
        `Failed to classify conversation: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
