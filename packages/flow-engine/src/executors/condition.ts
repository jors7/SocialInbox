import { ConditionNode } from '@socialinbox/shared';
import { FlowContext } from '../context';
import { NodeExecutor, NodeExecutionResult } from './index';

export class ConditionNodeExecutor implements NodeExecutor {
  async execute(node: ConditionNode, context: FlowContext): Promise<NodeExecutionResult> {
    try {
      // Evaluate the condition
      const result = this.evaluateCondition(node.condition, context);
      
      // Choose the next node based on the result
      const nextNodeId = result ? node.true : node.false;

      return {
        success: true,
        nextNodeId,
        output: {
          type: 'condition',
          condition: node.condition,
          result,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to evaluate condition',
      };
    }
  }

  private evaluateCondition(condition: string, context: FlowContext): boolean {
    // Simple condition evaluation
    // Format: "variable operator value"
    // Examples: "email exists", "score > 10", "name == 'John'"
    
    const parts = condition.split(' ');
    if (parts.length < 2) {
      throw new Error(`Invalid condition format: ${condition}`);
    }

    const variable = parts[0];
    const operator = parts[1];
    const value = parts.slice(2).join(' ').replace(/['"]/g, '');

    const varValue = context.getVariable(variable);

    switch (operator) {
      case 'exists':
        return context.hasVariable(variable) && varValue !== null && varValue !== undefined;
      case 'not_exists':
        return !context.hasVariable(variable) || varValue === null || varValue === undefined;
      case '==':
      case 'equals':
        return String(varValue) === value;
      case '!=':
      case 'not_equals':
        return String(varValue) !== value;
      case '>':
        return Number(varValue) > Number(value);
      case '<':
        return Number(varValue) < Number(value);
      case '>=':
        return Number(varValue) >= Number(value);
      case '<=':
        return Number(varValue) <= Number(value);
      case 'contains':
        return String(varValue).includes(value);
      case 'not_contains':
        return !String(varValue).includes(value);
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }
}