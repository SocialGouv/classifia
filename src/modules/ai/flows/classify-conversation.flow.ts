import { Injectable } from '@nestjs/common';

import { ClassifyAgent } from '../agents/openai-agents/classify/classify.agent';
import { AlbertEmbedding } from '../llm/albert/albert.embedding';

import { ClassifyOutput } from '@/modules/conversations/interfaces/conversation.interface';

@Injectable()
export class ClassifyConversationFlow {
  constructor(
    private readonly classifyAgent: ClassifyAgent,
    private readonly embedding: AlbertEmbedding,
  ) {}

  async execute(input: { transcript: string }) {
    const classificationResult: ClassifyOutput =
      await this.classifyAgent.classify(input.transcript);

    const descriptions = classificationResult.conversations.map(
      (conv) => conv.description,
    );

    const embeddings = await this.embedding.embed(descriptions);
    const conversations = classificationResult.conversations.map(
      (conv, index) => ({
        ...conv,
        embedding: embeddings[index] || [],
      }),
    );

    const result = {
      session_id: classificationResult.session_id,
      conversations,
    };

    console.log('Final result:', result);
    return { conversations: result };
  }
}
