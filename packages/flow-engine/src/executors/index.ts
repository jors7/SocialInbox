import { FlowNode } from '@socialinbox/shared';
import { FlowContext } from '../context';
import { MessageNodeExecutor } from './message';
import { QuickReplyNodeExecutor } from './quick-reply';
import { ConditionNodeExecutor } from './condition';
import { ActionNodeExecutor } from './action';
import { WaitNodeExecutor } from './wait';
import { EndNodeExecutor } from './end';

export interface NodeExecutionResult {
  success: boolean;
  nextNodeId?: string;
  error?: string;
  output?: any;
}

export interface NodeExecutor {
  execute(node: FlowNode, context: FlowContext): Promise<NodeExecutionResult>;
}

const executors: Record<string, NodeExecutor> = {
  message: new MessageNodeExecutor(),
  quick_reply: new QuickReplyNodeExecutor(),
  condition: new ConditionNodeExecutor(),
  action: new ActionNodeExecutor(),
  wait: new WaitNodeExecutor(),
  end: new EndNodeExecutor(),
};

export function getNodeExecutor(nodeType: string): NodeExecutor | undefined {
  return executors[nodeType];
}

export function registerNodeExecutor(nodeType: string, executor: NodeExecutor): void {
  executors[nodeType] = executor;
}