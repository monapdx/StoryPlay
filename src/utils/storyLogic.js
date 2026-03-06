export function evaluateCondition(condition, variables) {
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

export function evaluateConditions(conditions = [], variables = {}) {
  if (!conditions.length) return true;
  return conditions.every((condition) =>
    evaluateCondition(condition, variables)
  );
}

export function applyEffect(effect, variables) {
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

export function applyEffects(effects = [], variables = {}) {
  return effects.reduce((acc, effect) => applyEffect(effect, acc), variables);
}