import { WaitNode } from '@socialinbox/shared';
import { FlowContext } from '../context';
import { NodeExecutor, NodeExecutionResult } from './index';

export class WaitNodeExecutor implements NodeExecutor {
  async execute(node: WaitNode, context: FlowContext): Promise<NodeExecutionResult> {
    try {
      // Store wait information in context
      context.setVariable('_wait', {
        duration: node.duration,
        until: new Date(Date.now() + node.duration * 1000),
      });

      // Wait nodes pause execution
      // The calling system will need to resume after the duration
      return {
        success: true,
        output: {
          type: 'wait',
          duration: node.duration,
          resumeAt: new Date(Date.now() + node.duration * 1000),
          nextNodeId: node.go,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute wait node',
      };
    }
  }
}