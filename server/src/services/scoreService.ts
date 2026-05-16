// ─── Score Service ────────────────────────────────────────────────────────────
export function computeProgressScore(
  uomType: 'Min' | 'Max' | 'Timeline' | 'Zero',
  target: number | string,
  achievement: number | string
): number {
  switch (uomType) {
    case 'Min': {
      const t = Number(target), a = Number(achievement);
      if (t === 0) return 0;
      return Math.min(Math.round((a / t) * 100), 100);
    }
    case 'Max': {
      const t = Number(target), a = Number(achievement);
      if (a === 0) return 100;
      return Math.min(Math.round((t / a) * 100), 100);
    }
    case 'Timeline': {
      const deadline = new Date(target as string);
      const completion = new Date(achievement as string);
      return completion <= deadline ? 100 : 0;
    }
    case 'Zero':
      return Number(achievement) === 0 ? 100 : 0;
    default:
      return 0;
  }
}
