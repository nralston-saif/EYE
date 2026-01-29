import { TemplateVariable } from '@/types/database'

/**
 * Extracts variable names from template content
 * Finds all {{variable_name}} patterns
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g
  const variables: string[] = []
  let match

  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1])
    }
  }

  return variables
}

/**
 * Replaces all {{variable}} placeholders with their values
 */
export function renderTemplate(
  content: string,
  values: Record<string, string>
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    return values[variableName] || match
  })
}

/**
 * Validates that all required variables have values
 */
export function validateVariables(
  variables: TemplateVariable[],
  values: Record<string, string>
): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  for (const variable of variables) {
    if (variable.required && !values[variable.name]?.trim()) {
      missing.push(variable.label || variable.name)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Generates default variable definitions from extracted variable names
 * Used when creating a template from scratch
 */
export function generateVariableDefinitions(
  variableNames: string[]
): TemplateVariable[] {
  return variableNames.map((name) => ({
    name,
    label: formatVariableLabel(name),
    type: inferVariableType(name),
    required: true,
  }))
}

/**
 * Formats a variable name into a human-readable label
 * e.g., "client_name" -> "Client Name"
 */
export function formatVariableLabel(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Infers the variable type based on its name
 */
function inferVariableType(name: string): TemplateVariable['type'] {
  const lowerName = name.toLowerCase()

  if (lowerName.includes('date')) {
    return 'date'
  }
  if (
    lowerName.includes('description') ||
    lowerName.includes('notes') ||
    lowerName.includes('scope') ||
    lowerName.includes('details')
  ) {
    return 'textarea'
  }
  if (
    lowerName.includes('amount') ||
    lowerName.includes('price') ||
    lowerName.includes('budget') ||
    lowerName.includes('cost') ||
    lowerName.includes('quantity')
  ) {
    return 'number'
  }

  return 'text'
}

/**
 * Merges existing variable definitions with newly extracted variables
 * Preserves existing definitions and adds new ones
 */
export function mergeVariableDefinitions(
  existing: TemplateVariable[],
  extracted: string[]
): TemplateVariable[] {
  const existingMap = new Map(existing.map((v) => [v.name, v]))
  const result: TemplateVariable[] = []

  for (const name of extracted) {
    if (existingMap.has(name)) {
      result.push(existingMap.get(name)!)
    } else {
      result.push({
        name,
        label: formatVariableLabel(name),
        type: inferVariableType(name),
        required: true,
      })
    }
  }

  return result
}

/**
 * Gets default values for all variables
 */
export function getDefaultValues(
  variables: TemplateVariable[]
): Record<string, string> {
  const defaults: Record<string, string> = {}

  for (const variable of variables) {
    if (variable.defaultValue) {
      defaults[variable.name] = variable.defaultValue
    }
  }

  return defaults
}
