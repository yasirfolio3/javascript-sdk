import { getLogger } from '@optimizely/js-sdk-logging';
import { LOG_MESSAGES } from '../../utils/enums';
import { UserAttributes } from '../../shared_types';
import { sprintf } from '@optimizely/js-sdk-utils';
import { isNumber, isSafeInteger } from '../../utils/fns';

const MODULE_NAME = 'CUSTOM_ATTRIBUTE_CONDITION_EVALUATOR';

const logger = getLogger(MODULE_NAME);

type ExactMatchCondition = Readonly<{
  type: 'custom_attribute';
  match: 'exact';
  name: string;
  value: string | number | boolean;
}>;

type ExistsMatchCondition = Readonly<{
  type: 'custom_attribute';
  match: 'exists';
  name: string;
}>;

type GreaterThanMatchCondition = Readonly<{
  type: 'custom_attribute';
  match: 'gt';
  name: string;
  value: number;
}>;

type LessThanMatchCondition = Readonly<{
  type: 'custom_attribute';
  match: 'lt';
  name: string;
  value: number;
}>;

type SubstringMatchCondition = Readonly<{
  type: 'custom_attribute';
  match: 'substring';
  name: string;
  value: string;
}>;

export type CustomAttributeCondition =
  | ExactMatchCondition
  | ExistsMatchCondition
  | GreaterThanMatchCondition
  | LessThanMatchCondition
  | SubstringMatchCondition;

export type CustomAttributeConditionEvaluator = (
  condition: CustomAttributeCondition,
  userAttributes: UserAttributes
) => boolean | null;

const EXACT_MATCH_TYPE = 'exact';
const EXISTS_MATCH_TYPE = 'exists';
const GREATER_THAN_MATCH_TYPE = 'gt';
const LESS_THAN_MATCH_TYPE = 'lt';
const SUBSTRING_MATCH_TYPE = 'substring';

const MATCH_TYPES = [
  EXACT_MATCH_TYPE,
  EXISTS_MATCH_TYPE,
  GREATER_THAN_MATCH_TYPE,
  LESS_THAN_MATCH_TYPE,
  SUBSTRING_MATCH_TYPE,
];

function substringEvaluator(condition: SubstringMatchCondition  , userAttributes: UserAttributes) {
  const conditionName = condition.name;
  const userValue = userAttributes[condition.name];
  const userValueType = typeof userValue;
  const conditionValue = condition.value;

  if (typeof conditionValue !== 'string') {
    logger.warn(
      sprintf(LOG_MESSAGES.UNEXPECTED_CONDITION_VALUE, MODULE_NAME, JSON.stringify(condition))
    );
    return null;
  }

  if (userValue === null) {
    logger.debug(
      sprintf(LOG_MESSAGES.UNEXPECTED_TYPE_NULL, MODULE_NAME, JSON.stringify(condition), conditionName)
    );
    return null;
  }

  if (typeof userValue !== 'string') {
    logger.warn(
      sprintf(LOG_MESSAGES.UNEXPECTED_TYPE, MODULE_NAME, JSON.stringify(condition), userValueType, conditionName)
    );
    return null;
  }

  return userValue.indexOf(conditionValue) !== -1;
}

function lessThanEvaluator(condition: LessThanMatchCondition, userAttributes: UserAttributes) {
  const conditionName = condition.name;
  const userValue = userAttributes[condition.name];
  const userValueType = typeof userValue;
  const conditionValue = condition.value;

  if (!isSafeInteger(conditionValue)) {
    logger.warn(sprintf(LOG_MESSAGES.UNEXPECTED_CONDITION_VALUE, MODULE_NAME, JSON.stringify(condition)));
    return null;
  }

  if (userValue === null) {
    logger.debug(sprintf(LOG_MESSAGES.UNEXPECTED_TYPE_NULL, MODULE_NAME, JSON.stringify(condition), conditionName));
    return null;
  }

  if (!isNumber(userValue)) {
    logger.warn(
      sprintf(LOG_MESSAGES.UNEXPECTED_TYPE, MODULE_NAME, JSON.stringify(condition), userValueType, conditionName)
    );
    return null;
  }

  if (!isSafeInteger(userValue)) {
    logger.warn(sprintf(LOG_MESSAGES.OUT_OF_BOUNDS, MODULE_NAME, JSON.stringify(condition), conditionName));
    return null;
  }

  return userValue < conditionValue;
}

function greaterThanEvaluator(condition: GreaterThanMatchCondition, userAttributes: UserAttributes): boolean | null {
  const conditionName = condition.name;
  const userValue = userAttributes[conditionName];
  const userValueType = typeof userValue;
  const conditionValue = condition.value;

  if (!isSafeInteger(conditionValue)) {
    logger.warn(sprintf(LOG_MESSAGES.UNEXPECTED_CONDITION_VALUE, MODULE_NAME, JSON.stringify(condition)));
    return null;
  }

  if (userValue === null) {
    logger.debug(sprintf(LOG_MESSAGES.UNEXPECTED_TYPE_NULL, MODULE_NAME, JSON.stringify(condition), conditionName));
    return null;
  }

  if (!isNumber(userValue)) {
    logger.warn(
      sprintf(LOG_MESSAGES.UNEXPECTED_TYPE, MODULE_NAME, JSON.stringify(condition), userValueType, conditionName)
    );
    return null;
  }

  if (!isSafeInteger(userValue)) {
    logger.warn(sprintf(LOG_MESSAGES.OUT_OF_BOUNDS, MODULE_NAME, JSON.stringify(condition), conditionName));
    return null;
  }

  return userValue > conditionValue;
}

function existsEvaluator(condition: CustomAttributeCondition, userAttributes: UserAttributes): boolean | null {
  const userValue = userAttributes[condition.name];
  return typeof userValue !== 'undefined' && userValue !== null;
}

function isValueTypeValidForExactConditions(value: unknown): boolean {
  return typeof value === 'string' || typeof value === 'boolean' || isNumber(value);
}

function exactEvaluator(condition: ExactMatchCondition, userAttributes: UserAttributes): boolean | null {
  const conditionValue = condition.value;
  const conditionValueType = typeof conditionValue;
  const conditionName = condition.name;
  const userValue = userAttributes[conditionName];
  const userValueType = typeof userValue;

  if (
    !isValueTypeValidForExactConditions(conditionValue) ||
    (isNumber(conditionValue) && !isSafeInteger(conditionValue))
  ) {
    logger.warn(LOG_MESSAGES.UNEXPECTED_CONDITION_VALUE, MODULE_NAME, JSON.stringify(condition));
    return null;
  }

  if (userValue === null) {
    logger.debug(sprintf(LOG_MESSAGES.UNEXPECTED_TYPE_NULL, MODULE_NAME, JSON.stringify(condition), conditionName));
    return null;
  }

  if (!isValueTypeValidForExactConditions(userValue) || conditionValueType !== userValueType) {
    logger.warn(
      sprintf(LOG_MESSAGES.UNEXPECTED_TYPE, MODULE_NAME, JSON.stringify(condition), userValueType, conditionName)
    );
    return null;
  }

  if (isNumber(userValue) && !isSafeInteger(userValue)) {
    logger.warn(sprintf(LOG_MESSAGES.OUT_OF_BOUNDS, MODULE_NAME, JSON.stringify(condition), conditionName));
    return null;
  }

  return conditionValue === userValue;
}

export function evaluate(condition: CustomAttributeCondition, userAttributes: UserAttributes): boolean | null {
  const conditionMatch = condition.match;
  if (typeof conditionMatch !== 'undefined' && MATCH_TYPES.indexOf(conditionMatch) === -1) {
    logger.warn(LOG_MESSAGES.UNKNOWN_MATCH_TYPE, MODULE_NAME, JSON.stringify(condition));
    return null;
  }

  const attributeKey = condition.name;
  if (!userAttributes.hasOwnProperty(attributeKey) && conditionMatch != EXISTS_MATCH_TYPE) {
    logger.debug(LOG_MESSAGES.MISSING_ATTRIBUTE_VALUE, MODULE_NAME, JSON.stringify(condition), attributeKey);
    return null;
  }

  switch (condition.match) {
    case 'exists':
      return existsEvaluator(condition, userAttributes);
    case 'gt':
      return greaterThanEvaluator(condition, userAttributes);
    case 'lt':
      return lessThanEvaluator(condition, userAttributes);
    case 'substring':
      return substringEvaluator(condition, userAttributes);
    default:
      return exactEvaluator(condition, userAttributes);
  }
}
