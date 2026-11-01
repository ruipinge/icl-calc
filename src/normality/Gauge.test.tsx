import {
  Gauge,
  ZONE_COLOURS,
  buildZones,
  describeBand,
  gaugeBand,
  gaugeOptions,
  quantile
} from './Gauge';
import { PLOT_INSET_LEFT, PLOT_INSET_RIGHT } from './plot-inset';
import { render, screen } from '@testing-library/react';

const DATASET = [
  1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7,
  7, 7
];

it('calculates quantile correctly', () => {
  expect(quantile([1, 2, 3], 0.5)).toEqual(2);
  expect(quantile([1, 2, 3, 4], 0.975)).toEqual(3.925);
  expect(quantile([1, 2, 3, 4], 0.025)).toEqual(1.075);
  expect(quantile([1, 2, 3, 4], 1.0)).toEqual(4);
  expect(quantile([1, 2, 3, 4], 0.0)).toEqual(1);

  expect(quantile([4, 3, 2, 1], 0.0)).toEqual(1);
  expect(quantile([4, 3, 2, 1], 1.0)).toEqual(4);

  expect(quantile(DATASET, 0.25)).toEqual(4);
  expect(quantile(DATASET, 0.5)).toEqual(5);
  expect(quantile(DATASET, 0.75)).toEqual(6.25);
});

// Issue #58: quantile() used to sort its argument in place, permanently
// reordering the caller's array. Its callers pass the shared, module-level
// VALUES.* arrays from src/db.ts, so the first gauge render reordered the
// whole dataset out of CSV row order for everyone else. These two pin the
// no-mutation guarantee; DATASET above must not be used here, because a
// mutating implementation would corrupt it for every other test in the file.
it('leaves the caller array untouched when computing a quantile', () => {
  const values = [4, 3, 2, 1];

  expect(quantile(values, 0.5)).toEqual(2.5);
  expect(values).toEqual([4, 3, 2, 1]);
});

it('leaves the caller array untouched when building zones', () => {
  const values = [7, 6, 5, 4, 3, 2, 1];

  buildZones({ values });

  expect(values).toEqual([7, 6, 5, 4, 3, 2, 1]);
});

it('builds default zones correctly', () => {
  expect(buildZones({ values: DATASET })).toEqual([
    { min: 1, max: 1.675 },
    { min: 1.675, max: 4 },
    { min: 4, max: 6.25 },
    { min: 6.25, max: 7 },
    { min: 7, max: 7 }
  ]);
});

it('builds zones correctly', () => {
  expect(
    buildZones({
      values: DATASET,
      quantiles: [0.2, 0.8, 1.0]
    })
  ).toEqual([
    { min: 1, max: 3.4000000000000004 },
    { min: 3.4000000000000004, max: 7 },
    { min: 7, max: 7 }
  ]);
});

/*
 * Replaces an asFragment() snapshot (#121).
 *
 * The gauge itself draws no text - it is styled divs and one SVG pointer -
 * so its accessible surface is the name on the container (#138), and its
 * band is shown beside it as an aria-hidden caption (#194); both are asserted
 * below. Its geometry is asserted instead, in
 * linear-gauge/index.test.ts, driven through buildZones exactly as this
 * component drives it; see the tests there for the band widths and pointer
 * placement this snapshot used to record.
 *
 * What remains here is the mount/unmount cycle, which is real: #56 was a
 * dispose bug in precisely this path, where LinearGauge left children behind
 * because it mutated the live childNodes list while iterating it.
 */
it('mounts and disposes cleanly', () => {
  const view = render(<Gauge title="Test" value={4} values={DATASET} />);

  expect(() => view.unmount()).not.toThrow();
});

const B = buildZones({ values: [1, 2, 3, 4, 5, 6, 7] });

it.each([
  [B[0].min, 'below the 2.5th percentile'],
  [B[1].min, 'between the 2.5th and 25th percentiles'],
  [B[2].min, 'between the 25th and 75th percentiles'],
  [B[3].min, 'between the 75th and 97.5th percentiles'],
  [B[4].min, 'above the 97.5th percentile'],
  [B[4].max, 'above the 97.5th percentile'],
  [0, 'below the range of the dataset'],
  [B[4].max + 1, 'above the range of the dataset'],
  [NaN, 'outside the range of the dataset']
])('describes %s as %s', (v, s) => expect(describeBand(v, B)).toBe(s));

it.each([0, 4, NaN])('describes %s as outside an empty range', (v) =>
  expect(describeBand(v, [])).toBe('outside the range of the dataset')
);

it.each([
  [undefined, 'no value entered'],
  [B[2].min, 'between the 25th and 75th percentiles'],
  [0, 'below the range of the dataset'],
  [B[4].max + 1, 'above the range of the dataset']
])('captions %s as %s', (v, s) => expect(gaugeBand(v, B)).toBe(s));

const captionOf = (value: number | undefined) => {
  render(<Gauge title="CLR" value={value} values={[1, 2, 3, 4, 5, 6, 7]} />);
  const gauge = screen.getByTestId('gauge');
  // the caption is aria-hidden, so no role query reaches it; it is the
  // gauge's next sibling by design (asserted below)
  // eslint-disable-next-line testing-library/no-node-access
  const caption = gauge.nextElementSibling as HTMLElement;
  return { gauge, caption };
};

// The caption shows exactly what the name speaks after the metric (and value).
it.each([
  ['in range', B[2].min, 'between the 25th and 75th percentiles'],
  ['below the range', 0, 'below the range of the dataset'],
  ['above the range', B[4].max + 1, 'above the range of the dataset'],
  ['an empty string', '' as unknown as number, 'no value entered'],
  ['NaN', NaN, 'no value entered'],
  ['undefined', undefined, 'no value entered']
])('captions a gauge whose value is %s with its band', (_, value, band) => {
  const { gauge, caption } = captionOf(value);

  expect(caption).toHaveClass('gauge-band');
  expect(caption.textContent).toBe(band);
  expect(gauge.getAttribute('aria-label')).toMatch(
    new RegExp(`^CLR: (?:[^,]+, )?${band.replace(/\./g, '\\.')}$`)
  );
});

it('hides the caption from assistive technology, which hears the name', () =>
  expect(captionOf(4).caption).toHaveAttribute('aria-hidden', 'true'));

// LinearGauge owns the gauge's children, and the L2 replay reads its first
// svg: the caption must sit beside it, never inside it.
it('places the caption after the gauge, not inside it', () => {
  render(<Gauge title="CLR" value={4} values={[1, 2, 3, 4, 5, 6, 7]} />);
  const gauge = screen.getByTestId('gauge');
  // found by its text, independently of where it sits
  const caption = screen.getByText('between the 25th and 75th percentiles');

  expect(caption.tagName).toBe('P');
  expect(gauge.contains(caption)).toBe(false);
  // eslint-disable-next-line testing-library/no-node-access
  expect(gauge.nextElementSibling).toBe(caption);
  // nothing before the gauge either: the replay reads it as rendered
  // eslint-disable-next-line testing-library/no-node-access
  expect(gauge.previousElementSibling).toBeNull();
});

it('aligns the caption with the bar', () => {
  const { gauge, caption } = captionOf(4);

  expect(caption.getAttribute('style')).toBe(gauge.getAttribute('style'));
  // Pinned to the insets themselves too: equal styles alone stay green when
  // both lose them.
  expect(caption).toHaveStyle({
    marginLeft: `${PLOT_INSET_LEFT}px`,
    marginRight: `${PLOT_INSET_RIGHT}px`
  });
});

it('is an image named by its metric, value and band', () => {
  render(
    <Gauge
      title="Angle to Angle - AtA (mm)"
      value={B[2].min}
      values={[1, 2, 3, 4, 5, 6, 7]}
    />
  );

  expect(
    screen.getByRole('img', {
      name: /^Angle to Angle - AtA \(mm\): \d+(\.\d+)?, between the 25th and 75th percentiles$/
    })
  ).toHaveAttribute('data-testid', 'gauge');
});

// A cleared field reaches the gauge as '' (Formik), untyped through
// Normality({...args}); the name must never claim a band for it, end blank, or
// read "undefined".
it.each([
  ['an empty string', '' as unknown as number],
  ['NaN', NaN],
  ['undefined', undefined]
])('names a gauge whose value is %s as having no value', (_, value) => {
  render(<Gauge title="CLR" value={value} values={[1, 2, 3, 4, 5, 6, 7]} />);

  expect(screen.getByTestId('gauge')).toHaveAccessibleName(
    'CLR: no value entered'
  );
});

it('reads a derived value without its float artefact', () => {
  render(
    <Gauge
      title="ACA"
      value={30.700000000000003}
      values={[10, 20, 30, 40, 50]}
    />
  );

  expect(screen.getByTestId('gauge')).toHaveAccessibleName(
    'ACA: 30.7, between the 25th and 75th percentiles'
  );
});

it('colours the tails crimson, the shoulders ember and the middle jade', () => {
  expect(ZONE_COLOURS).toEqual([
    'var(--leaf-crimson)',
    'var(--leaf-ember)',
    'var(--leaf-jade)',
    'var(--leaf-ember)',
    'var(--leaf-crimson)'
  ]);
});

/*
 * The whole options object Gauge's layout effect hands to LinearGauge. The
 * effect itself is istanbul-ignored, so this is where its wiring is asserted:
 * the value goes through `measurement`, so a missing one draws no pointer.
 */
it('configures the drawing with the zones, gap, divisions and value', () => {
  expect(gaugeOptions(4.1, B)).toEqual({
    divisions: 5,
    subDivisions: 2,
    zones: B.map((band, index) => ({ ...band, color: ZONE_COLOURS[index] })),
    zoneGap: { width: 2, color: 'var(--paper)' },
    value: 4.1
  });
});

it.each([
  ['an empty string', ''],
  ['undefined', undefined],
  ['NaN', NaN]
])('passes no value to the drawing where the value is %s', (_, value) =>
  expect(gaugeOptions(value, B).value).toBeUndefined()
);

it('passes 0 to the drawing as a value', () =>
  expect(gaugeOptions(0, B).value).toBe(0));
