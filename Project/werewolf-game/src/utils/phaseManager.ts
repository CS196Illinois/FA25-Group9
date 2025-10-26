export const phaseDurations = {
  night: 60,
  day: 120,
  voting: 45,
  results: 10,
};

export function getNextPhase(currentPhase: string): string {
  const phases = ["night", "day", "voting", "results"];
  const currentIndex = phases.indexOf(currentPhase);
  const nextIndex = (currentIndex + 1) % phases.length;
  return phases[nextIndex];
}