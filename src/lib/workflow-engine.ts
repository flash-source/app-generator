import { CollectionConfig, WorkflowConfig } from './config-schema'

function evaluateCondition(
  data: Record<string, unknown>,
  condition: WorkflowConfig['conditions'][0]
): boolean {
  const value = data[condition.field]
  const str = String(value ?? '')
  switch (condition.operator) {
    case 'equals': return str === condition.value
    case 'not_equals': return str !== condition.value
    case 'contains': return str.includes(condition.value)
    case 'greater_than': return Number(value) > Number(condition.value)
    case 'less_than': return Number(value) < Number(condition.value)
    default: return false
  }
}

export function runWorkflows(
  data: Record<string, unknown>,
  collection: CollectionConfig,
  trigger: 'on_create' | 'on_update'
): { data: Record<string, unknown>; notifications: string[] } {
  const workflows = collection.workflows ?? []
  let result = { ...data }
  const notifications: string[] = []

  for (const workflow of workflows) {
    if (workflow.trigger !== trigger) continue

    const conditionsMet = workflow.conditions.length === 0 ||
      workflow.conditions.every(c => evaluateCondition(result, c))

    if (!conditionsMet) continue

    for (const action of workflow.actions) {
      if (action.type === 'set_field' && action.field) {
        const val = action.value === '{{now}}'
          ? new Date().toISOString()
          : action.value ?? ''
        result[action.field] = val
      }
      if (action.type === 'notify' && action.message) {
        notifications.push(action.message.replace(
          /\{\{(\w+)\}\}/g,
          (_, key) => String(result[key] ?? '')
        ))
      }
    }
  }

  return { data: result, notifications }
}