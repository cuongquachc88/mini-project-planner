export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function projectItemKey(projectKey: string, seq: number): string {
  return `${projectKey}-${seq}`
}
