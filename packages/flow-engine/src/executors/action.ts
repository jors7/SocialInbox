import { ActionNode } from '@socialinbox/shared';
import { FlowContext } from '../context';
import { NodeExecutor, NodeExecutionResult } from './index';

export class ActionNodeExecutor implements NodeExecutor {
  async execute(node: ActionNode, context: FlowContext): Promise<NodeExecutionResult> {
    try {
      // Execute different actions based on the action type
      switch (node.action) {
        case 'capture_email':
          return await this.captureEmail(node, context);
        case 'add_tag':
          return await this.addTag(node, context);
        case 'remove_tag':
          return await this.removeTag(node, context);
        case 'set_variable':
          return await this.setVariable(node, context);
        case 'http_request':
          return await this.httpRequest(node, context);
        case 'notify_team':
          return await this.notifyTeam(node, context);
        default:
          return {
            success: false,
            error: `Unknown action type: ${node.action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute action',
      };
    }
  }

  private async captureEmail(node: ActionNode, context: FlowContext): Promise<NodeExecutionResult> {
    // This would typically prompt for email input
    // For now, we'll just set a flag
    context.setVariable('_waitingForEmail', true);
    
    return {
      success: true,
      output: {
        type: 'action',
        action: 'capture_email',
        waitingForInput: true,
      },
    };
  }

  private async addTag(node: ActionNode, context: FlowContext): Promise<NodeExecutionResult> {
    const tag = node.params?.tag;
    if (!tag) {
      return { success: false, error: 'Tag parameter is required' };
    }

    const currentTags = context.getVariable('_tags') || [];
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      context.setVariable('_tags', currentTags);
    }

    return {
      success: true,
      nextNodeId: node.go,
      output: { type: 'action', action: 'add_tag', tag },
    };
  }

  private async removeTag(node: ActionNode, context: FlowContext): Promise<NodeExecutionResult> {
    const tag = node.params?.tag;
    if (!tag) {
      return { success: false, error: 'Tag parameter is required' };
    }

    const currentTags = context.getVariable('_tags') || [];
    const index = currentTags.indexOf(tag);
    if (index > -1) {
      currentTags.splice(index, 1);
      context.setVariable('_tags', currentTags);
    }

    return {
      success: true,
      nextNodeId: node.go,
      output: { type: 'action', action: 'remove_tag', tag },
    };
  }

  private async setVariable(node: ActionNode, context: FlowContext): Promise<NodeExecutionResult> {
    const { name, value } = node.params || {};
    if (!name) {
      return { success: false, error: 'Variable name is required' };
    }

    context.setVariable(name, value);

    return {
      success: true,
      nextNodeId: node.go,
      output: { type: 'action', action: 'set_variable', name, value },
    };
  }

  private async httpRequest(node: ActionNode, context: FlowContext): Promise<NodeExecutionResult> {
    // This would make an actual HTTP request
    // For now, we'll just set a flag
    const { url, method = 'GET', headers, body } = node.params || {};
    
    if (!url) {
      return { success: false, error: 'URL is required for HTTP request' };
    }

    // Store request details for the calling system to execute
    context.setVariable('_httpRequest', { url, method, headers, body });

    return {
      success: true,
      nextNodeId: node.go,
      output: { type: 'action', action: 'http_request', url, method },
    };
  }

  private async notifyTeam(node: ActionNode, context: FlowContext): Promise<NodeExecutionResult> {
    const { message, channel } = node.params || {};
    
    if (!message) {
      return { success: false, error: 'Message is required for team notification' };
    }

    // Store notification details for the calling system
    context.setVariable('_teamNotification', { message, channel });

    return {
      success: true,
      nextNodeId: node.go,
      output: { type: 'action', action: 'notify_team', message, channel },
    };
  }
}