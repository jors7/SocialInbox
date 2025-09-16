import { EndNode } from '@socialinbox/shared';
import { FlowContext } from '../context';
import { NodeExecutor, NodeExecutionResult } from './index';

export class EndNodeExecutor implements NodeExecutor {
  async execute(node: EndNode, context: FlowContext): Promise<NodeExecutionResult> {
    try {
      // Mark flow as completed
      context.setVariable('_flowCompleted', true);
      context.setVariable('_completedAt', new Date());

      return {
        success: true,
        output: {
          type: 'end',
          completedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute end node',
      };
    }
  }
}