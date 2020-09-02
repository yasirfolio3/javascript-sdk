export interface ConditionTreeOr<Leaf> {
  nodeType: 'or';
  children: ConditionTree<Leaf>[];
}

export interface ConditionTreeAnd<Leaf> {
  nodeType: 'and';
  children: ConditionTree<Leaf>[];
}

export interface ConditionTreeNot<Leaf> {
  nodeType: 'not';
  child: ConditionTree<Leaf>;
}

export interface ConditionTreeLeaf<Leaf> {
  nodeType: 'leaf';
  leafValue: Leaf;
}

export type ConditionTree<Leaf> =
  | ConditionTreeOr<Leaf>
  | ConditionTreeAnd<Leaf>
  | ConditionTreeNot<Leaf>
  | ConditionTreeLeaf<Leaf>;

function andEvaluator<Leaf>(
  operands: ConditionTree<Leaf>[],
  leafEvaluator: (leaf: Leaf) => boolean | null
): boolean | null {
  let sawNullResult = false;
  for (let i = 0; i < operands.length; i++) {
    const conditionResult = evaluate(operands[i], leafEvaluator);
    if (conditionResult === false) {
      return false;
    }
    if (conditionResult === null) {
      sawNullResult = true;
    }
  }
  return sawNullResult ? null : true;
}

function orEvaluator<Leaf>(
  operands: ConditionTree<Leaf>[],
  leafEvaluator: (leaf: Leaf) => boolean | null
): boolean | null {
  let sawNullResult = false;
  for (let i = 0; i < operands.length; i++) {
    const conditionResult = evaluate(operands[i], leafEvaluator);
    if (conditionResult === true) {
      return true;
    }
    if (conditionResult === null) {
      sawNullResult = true;
    }
  }
  return sawNullResult ? null : false;
}

function notEvaluator<Leaf>(
  operand: ConditionTree<Leaf>,
  leafEvaluator: (leaf: Leaf) => boolean | null
): boolean | null {
    const result = evaluate(operand, leafEvaluator);
    return result === null ? null : !result;
}

export function evaluate<Leaf>(
  conditions: ConditionTree<Leaf>,
  leafEvaluator: (leaf: Leaf) => boolean | null
): boolean | null {
  switch (conditions.nodeType) {
    case 'and':
      return andEvaluator<Leaf>(conditions.children, leafEvaluator);

    case 'or':
      return orEvaluator<Leaf>(conditions.children, leafEvaluator);

    case 'not':
      return notEvaluator<Leaf>(conditions.child, leafEvaluator);

    default:
      // nodeType === 'leaf'
      return leafEvaluator(conditions.leafValue);
  }
}
