import { MessageNode } from '@socialinbox/shared';
import { FlowContext } from '../context';
import { NodeExecutor, NodeExecutionResult } from './index';

export class MessageNodeExecutor implements NodeExecutor {
  async execute(node: MessageNode, context: FlowContext): Promise<NodeExecutionResult> {
    try {
      // Interpolate variables in the message text
      const interpolatedText = context.interpolate(node.text);
      
      // Store the message in context for the calling system to send
      context.setVariable('_lastMessage', {
        type: 'message',
        text: interpolatedText,
        timestamp: new Date(),
      });

      return {
        success: true,
        nextNodeId: node.go || 'end',
        output: {
          type: 'message',
          text: interpolatedText,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute message node',
      };
    }
  }
}