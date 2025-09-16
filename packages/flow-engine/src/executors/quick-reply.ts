import { QuickReplyNode } from '@socialinbox/shared';
import { FlowContext } from '../context';
import { NodeExecutor, NodeExecutionResult } from './index';

export class QuickReplyNodeExecutor implements NodeExecutor {
  async execute(node: QuickReplyNode, context: FlowContext): Promise<NodeExecutionResult> {
    try {
      // Interpolate variables in the text
      const interpolatedText = context.interpolate(node.text);
      
      // Interpolate quick reply texts
      const interpolatedQuickReplies = node.quickReplies.map(qr => ({
        text: context.interpolate(qr.text),
        go: qr.go,
      }));

      // Store in context for the calling system
      context.setVariable('_lastMessage', {
        type: 'quick_reply',
        text: interpolatedText,
        quickReplies: interpolatedQuickReplies,
        timestamp: new Date(),
      });

      // Quick reply nodes wait for user input, so we don't have a next node yet
      // The system will resume from the selected quick reply's "go" target
      return {
        success: true,
        output: {
          type: 'quick_reply',
          text: interpolatedText,
          quickReplies: interpolatedQuickReplies,
          waitingForInput: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute quick reply node',
      };
    }
  }
}