export interface FlowContextData {
  flowId: string;
  conversationId?: string;
  contactId?: string;
  currentNodeId: string;
  variables: Record<string, any>;
  executionPath: string[];
  startedAt: Date;
  metadata?: Record<string, any>;
}

export class FlowContext {
  flowId: string;
  conversationId?: string;
  contactId?: string;
  currentNodeId: string;
  variables: Record<string, any>;
  executionPath: string[];
  startedAt: Date;
  metadata: Record<string, any>;

  constructor(data: Partial<FlowContextData>) {
    this.flowId = data.flowId || '';
    this.conversationId = data.conversationId;
    this.contactId = data.contactId;
    this.currentNodeId = data.currentNodeId || '';
    this.variables = data.variables || {};
    this.executionPath = data.executionPath || [];
    this.startedAt = data.startedAt || new Date();
    this.metadata = data.metadata || {};
  }

  setVariable(key: string, value: any): void {
    this.variables[key] = value;
  }

  getVariable(key: string): any {
    return this.variables[key];
  }

  hasVariable(key: string): boolean {
    return key in this.variables;
  }

  interpolate(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = this.getVariable(key);
      return value !== undefined ? String(value) : match;
    });
  }

  toJSON(): FlowContextData {
    return {
      flowId: this.flowId,
      conversationId: this.conversationId,
      contactId: this.contactId,
      currentNodeId: this.currentNodeId,
      variables: this.variables,
      executionPath: this.executionPath,
      startedAt: this.startedAt,
      metadata: this.metadata,
    };
  }

  static fromJSON(data: FlowContextData): FlowContext {
    return new FlowContext(data);
  }
}