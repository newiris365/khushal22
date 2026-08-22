/**
 * Returns the display label for a role.
 * Maps 'Admin' to 'Principal' when instituteType === 'school'.
 */
export function getRoleLabel(role: string, instituteType?: string): string {
  if (!role) return '';
  const trimmed = role.trim();
  if (instituteType === 'school' && trimmed === 'Admin') {
    return 'Principal';
  }
  return trimmed;
}
