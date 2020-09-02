import { sprintf } from '@optimizely/js-sdk-utils';
import { getLogger } from '@optimizely/js-sdk-logging';
import { assign } from '../../utils/fns';
import { LOG_LEVEL, LOG_MESSAGES, ERROR_MESSAGES } from '../../utils/enums';
import { ConditionTree, evaluate as evaluateConditionTree } from '../condition_tree_evaluator';
import {
  evaluate as evaluateCustomAttributeCondition,
  CustomAttributeCondition,
} from '../custom_attribute_condition_evaluator';
import { UserAttributes } from '../../shared_types';

const logger = getLogger();
const MODULE_NAME = 'AUDIENCE_EVALUATOR';

type CustomAttributeConditions = ConditionTree<CustomAttributeCondition>;

interface TypedCondition {
  type: string;
}

type TypedConditionEvaluator = (cond: TypedCondition, userAttributes: UserAttributes) => boolean | null;

type TypeToEvaluatorMap = {
  [conditionType: string]: TypedConditionEvaluator | undefined;
};

type AudienceConditions = ConditionTree<string>;

interface EvaluatableAudience {
  conditions: CustomAttributeConditions;
}

class AudienceEvaluator {
  private readonly typeToEvaluatorMap: TypeToEvaluatorMap;

  constructor(UNSTABLE_conditionEvaluators: TypeToEvaluatorMap) {
    this.typeToEvaluatorMap = assign({}, UNSTABLE_conditionEvaluators, {
      custom_attribute: evaluateCustomAttributeCondition,
    });
  }

  public evaluate(
    this: AudienceEvaluator,
    audienceConditions: AudienceConditions | null,
    audiencesById: { [audienceId: string]: EvaluatableAudience | undefined },
    userAttributes: UserAttributes = {}
  ): boolean {
    // if there are no audiences, return true because that means ALL users are included in the experiment
    if (!audienceConditions) {
      return true;
    }

    if (!userAttributes) {
      userAttributes = {};
    }

    const evaluateAudience = (audienceId: string): boolean | null => {
      const audience = audiencesById[audienceId];
      if (audience) {
        logger.log(
          LOG_LEVEL.DEBUG,
          sprintf(LOG_MESSAGES.EVALUATING_AUDIENCE, MODULE_NAME, audienceId, JSON.stringify(audience.conditions))
        );
        const result = evaluateConditionTree<CustomAttributeCondition>(
          audience.conditions,
          (condition: CustomAttributeCondition) => this.evaluateConditionWithUserAttributes(userAttributes, condition)
        );
        const resultText = result === null ? 'UNKNOWN' : result.toString().toUpperCase();
        logger.log(
          LOG_LEVEL.DEBUG,
          sprintf(LOG_MESSAGES.AUDIENCE_EVALUATION_RESULT, MODULE_NAME, audienceId, resultText)
        );
        return result;
      }

      return null;
    };

    return evaluateConditionTree<string>(audienceConditions, evaluateAudience) || false;
  }

  private evaluateConditionWithUserAttributes(
    this: AudienceEvaluator,
    userAttributes: UserAttributes,
    condition: CustomAttributeCondition
  ): boolean | null {
    const evaluator = this.typeToEvaluatorMap[condition.type];
    if (!evaluator) {
      logger.log(
        LOG_LEVEL.WARNING,
        sprintf(LOG_MESSAGES.UNKNOWN_CONDITION_TYPE, MODULE_NAME, JSON.stringify(condition))
      );
      return null;
    }
    try {
      return evaluator(condition, userAttributes);
    } catch (err) {
      logger.log(
        LOG_LEVEL.ERROR,
        sprintf(ERROR_MESSAGES.CONDITION_EVALUATOR_ERROR, MODULE_NAME, condition.type, err.message)
      );
    }
    return null;
  }
}

export default AudienceEvaluator;
