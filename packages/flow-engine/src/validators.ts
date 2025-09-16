import { FlowSpec, FlowNode } from '@socialinbox/shared';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

export function validateFlowSpec(spec: FlowSpec): ValidationResult {
  const warnings: string[] = [];

  try {
    // Check if spec has required fields
    if (!spec.version) {
      return { valid: false, error: 'Flow spec must have a version' };
    }

    if (!spec.entry) {
      return { valid: false, error: 'Flow spec must have an entry node' };
    }

    if (!spec.nodes || Object.keys(spec.nodes).length === 0) {
      return { valid: false, error: 'Flow spec must have at least one node' };
    }

    // Check if entry node exists
    if (!spec.nodes[spec.entry]) {
      return { valid: false, error: `Entry node '${spec.entry}' does not exist` };
    }

    // Validate each node
    const nodeIds = Object.keys(spec.nodes);
    const visitedNodes = new Set<string>();

    for (const [nodeId, node] of Object.entries(spec.nodes)) {
      const nodeValidation = validateNode(nodeId, node, nodeIds);
      if (!nodeValidation.valid) {
        return nodeValidation;
      }
      if (nodeValidation.warnings) {
        warnings.push(...nodeValidation.warnings);
      }
    }

    // Check for unreachable nodes
    const reachableNodes = findReachableNodes(spec.entry, spec.nodes);
    const unreachableNodes = nodeIds.filter(id => !reachableNodes.has(id));
    if (unreachableNodes.length > 0) {
      warnings.push(`Unreachable nodes detected: ${unreachableNodes.join(', ')}`);
    }

    // Check for infinite loops (simple detection)
    const loopCheck = detectSimpleLoops(spec.nodes);
    if (loopCheck.hasLoop) {
      warnings.push(`Potential infinite loop detected: ${loopCheck.path?.join(' -> ')}`);
    }

    return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

function validateNode(nodeId: string, node: FlowNode, allNodeIds: string[]): ValidationResult {
  const warnings: string[] = [];

  // Type-specific validation
  switch (node.type) {
    case 'message':
      if (!node.text) {
        return { valid: false, error: `Message node '${nodeId}' must have text` };
      }
      if (node.go && !allNodeIds.includes(node.go) && node.go !== 'end') {
        return { valid: false, error: `Node '${nodeId}' references non-existent node '${node.go}'` };
      }
      break;

    case 'quick_reply':
      if (!node.text) {
        return { valid: false, error: `Quick reply node '${nodeId}' must have text` };
      }
      if (!node.quickReplies || node.quickReplies.length === 0) {
        return { valid: false, error: `Quick reply node '${nodeId}' must have at least one quick reply` };
      }
      for (const qr of node.quickReplies) {
        if (!qr.text || !qr.go) {
          return { valid: false, error: `Quick reply in node '${nodeId}' must have text and go fields` };
        }
        if (!allNodeIds.includes(qr.go) && qr.go !== 'end') {
          return { valid: false, error: `Quick reply in node '${nodeId}' references non-existent node '${qr.go}'` };
        }
      }
      break;

    case 'condition':
      if (!node.condition) {
        return { valid: false, error: `Condition node '${nodeId}' must have a condition` };
      }
      if (!node.true || !node.false) {
        return { valid: false, error: `Condition node '${nodeId}' must have true and false branches` };
      }
      if (!allNodeIds.includes(node.true) && node.true !== 'end') {
        return { valid: false, error: `Condition node '${nodeId}' true branch references non-existent node '${node.true}'` };
      }
      if (!allNodeIds.includes(node.false) && node.false !== 'end') {
        return { valid: false, error: `Condition node '${nodeId}' false branch references non-existent node '${node.false}'` };
      }
      break;

    case 'action':
      if (!node.action) {
        return { valid: false, error: `Action node '${nodeId}' must have an action` };
      }
      if (!node.go) {
        return { valid: false, error: `Action node '${nodeId}' must have a go field` };
      }
      if (!allNodeIds.includes(node.go) && node.go !== 'end') {
        return { valid: false, error: `Action node '${nodeId}' references non-existent node '${node.go}'` };
      }
      break;

    case 'wait':
      if (typeof node.duration !== 'number' || node.duration <= 0) {
        return { valid: false, error: `Wait node '${nodeId}' must have a positive duration` };
      }
      if (!node.go) {
        return { valid: false, error: `Wait node '${nodeId}' must have a go field` };
      }
      if (!allNodeIds.includes(node.go) && node.go !== 'end') {
        return { valid: false, error: `Wait node '${nodeId}' references non-existent node '${node.go}'` };
      }
      break;

    case 'end':
      // End nodes don't need validation
      break;

    default:
      return { valid: false, error: `Unknown node type '${(node as any).type}' in node '${nodeId}'` };
  }

  return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
}

function findReachableNodes(entryId: string, nodes: Record<string, FlowNode>): Set<string> {
  const reachable = new Set<string>();
  const toVisit = [entryId];

  while (toVisit.length > 0) {
    const nodeId = toVisit.pop()!;
    if (reachable.has(nodeId) || nodeId === 'end') {
      continue;
    }

    reachable.add(nodeId);
    const node = nodes[nodeId];

    // Add connected nodes based on node type
    switch (node.type) {
      case 'message':
      case 'action':
      case 'wait':
        if (node.go && !reachable.has(node.go)) {
          toVisit.push(node.go);
        }
        break;
      case 'quick_reply':
        for (const qr of node.quickReplies) {
          if (!reachable.has(qr.go)) {
            toVisit.push(qr.go);
          }
        }
        break;
      case 'condition':
        if (!reachable.has(node.true)) {
          toVisit.push(node.true);
        }
        if (!reachable.has(node.false)) {
          toVisit.push(node.false);
        }
        break;
    }
  }

  return reachable;
}

function detectSimpleLoops(nodes: Record<string, FlowNode>): { hasLoop: boolean; path?: string[] } {
  // Simple loop detection - checks if any path leads back to itself without user input
  // This is a basic implementation and may not catch all loops
  
  for (const [startId, startNode] of Object.entries(nodes)) {
    if (startNode.type === 'quick_reply' || startNode.type === 'end') {
      continue; // Skip nodes that wait for input or end the flow
    }

    const visited = new Set<string>();
    const path: string[] = [];

    const hasLoop = checkPathForLoops(startId, nodes, visited, path);
    if (hasLoop) {
      return { hasLoop: true, path };
    }
  }

  return { hasLoop: false };
}

function checkPathForLoops(
  nodeId: string,
  nodes: Record<string, FlowNode>,
  visited: Set<string>,
  path: string[]
): boolean {
  if (visited.has(nodeId)) {
    path.push(nodeId);
    return true; // Found a loop
  }

  visited.add(nodeId);
  path.push(nodeId);

  const node = nodes[nodeId];
  if (!node || node.type === 'end' || node.type === 'quick_reply') {
    path.pop();
    return false; // End of path or waiting for input
  }

  let hasLoop = false;

  switch (node.type) {
    case 'message':
    case 'action':
    case 'wait':
      if (node.go && node.go !== 'end') {
        hasLoop = checkPathForLoops(node.go, nodes, visited, path);
      }
      break;
    case 'condition':
      // Check both branches
      if (node.true !== 'end') {
        hasLoop = checkPathForLoops(node.true, nodes, new Set(visited), [...path]);
      }
      if (!hasLoop && node.false !== 'end') {
        hasLoop = checkPathForLoops(node.false, nodes, new Set(visited), [...path]);
      }
      break;
  }

  if (!hasLoop) {
    path.pop();
  }
  return hasLoop;
}