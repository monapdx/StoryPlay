import type {
  Condition,
  Effect,
  StoryVariables,
} from "../types/storyCore";

export type {
  Condition,
  ConditionOperator,
  Effect,
  EffectAction,
  StoryVariables,
} from "../types/storyCore";

export function evaluateCondition(
  condition: Condition,
  variables: StoryVariables | null | undefined
): boolean {
  const currentValue = variables?.[condition.variable];

  switch (condition.operator) {
    case "equals":
      return currentValue === condition.value;
    case "notEquals":
      return currentValue !== condition.value;
    case "greaterThan":
      return Number(currentValue) > Number(condition.value);
    case "lessThan":
      return Number(currentValue) < Number(condition.value);
    case "greaterThanOrEqual":
      return Number(currentValue) >= Number(condition.value);
    case "lessThanOrEqual":
      return Number(currentValue) <= Number(condition.value);
    default:
      return true;
  }
}

export function evaluateConditions(
  conditions: Condition[] = [],
  variables: StoryVariables = {}
): boolean {
  if (!conditions.length) return true;
  return conditions.every((condition) =>
    evaluateCondition(condition, variables)
  );
}

export function applyEffect(
  effect: Effect,
  variables: StoryVariables
): StoryVariables {
  const currentValue = variables?.[effect.variable];

  switch (effect.action) {
    case "set":
      return {
        ...variables,
        [effect.variable]: effect.value,
      };

    case "add":
      return {
        ...variables,
        [effect.variable]: Number(currentValue || 0) + Number(effect.value || 0),
      };

    case "subtract":
      return {
        ...variables,
        [effect.variable]: Number(currentValue || 0) - Number(effect.value || 0),
      };

    case "toggle":
      return {
        ...variables,
        [effect.variable]: !currentValue,
      };

    default:
      return variables;
  }
}

export function applyEffects(
  effects: Effect[] = [],
  variables: StoryVariables = {}
): StoryVariables {
  return effects.reduce((acc, effect) => applyEffect(effect, acc), variables);
}
