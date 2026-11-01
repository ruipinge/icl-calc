/** "A", "A and B", "A, B and C". */
const joinLabels = (labels: readonly string[]): string =>
  labels.length < 2
    ? labels.join('')
    : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;

/**
 * Stands in for a result that cannot be computed yet, saying what to enter
 * rather than showing numbers worked out from fields nobody filled in (#197).
 */
export const MissingNote = ({
  missing,
  purpose
}: {
  missing: readonly string[];
  purpose: string;
}) => (
  <p>{`Enter ${joinLabels(missing)} on the Patient tab to see ${purpose}.`}</p>
);
