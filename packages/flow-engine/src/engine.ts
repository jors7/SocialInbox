import { Flow, FlowNode, FlowSpec } from '@socialinbox/shared';
import { FlowContext } from './context';
import { getNodeExecutor } from './executors';
import { validateFlowSpec } from './validators';

export interface FlowExecutionResult {
  success: boolean;
  nextNodeId?: string;
  error?: string;
  context: FlowContext;
}

export class FlowEngine {
  private flow: Flow;
  private context: FlowContext;

  constructor(flow: Flow, initialContext?: Partial<FlowContext>) {
    this.flow = flow;
    this.context = new FlowContext({
      flowId: flow.id,
      currentNodeId: flow.spec.entry,
      variables: {},
      ...initialContext,
    });
  }

  async execute(): Promise<FlowExecutionResult> {
    try {
      // Validate flow spec
      const validation = validateFlowSpec(this.flow.spec);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          context: this.context,
        };
      }

      // Execute starting from entry node
      const result = await this.executeNode(this.flow.spec.entry);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        context: this.context,
      };
    }
  }

  async executeNode(nodeId: string): Promise<FlowExecutionResult> {
    const node = this.flow.spec.nodes[nodeId];
    if (!node) {
      return {
        success: false,
        error: `Node ${nodeId} not found`,
        context: this.context,
      };
    }

    this.context.currentNodeId = nodeId;
    this.context.executionPath.push(nodeId);

    // Get appropriate executor for node type
    const executor = getNodeExecutor(node.type);
    if (!executor) {
      return {
        success: false,
        error: `No executor found for node type: ${node.type}`,
        context: this.context,
      };
    }

    // Execute the node
    const result = await executor.execute(node, this.context);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        context: this.context,
      };
    }

    // Handle next node
    if (result.nextNodeId && result.nextNodeId !== 'end') {
      return await this.executeNode(result.nextNodeId);
    }

    return {
      success: true,
      context: this.context,
    };
  }

  getContext(): FlowContext {
    return this.context;
  }

  setVariable(key: string, value: any): void {
    this.context.setVariable(key, value);
  }

  getVariable(key: string): any {
    return this.context.getVariable(key);
  }
}