import { LinearGauge } from './index';
import { buildZones } from '../Gauge';

const makeHost = (children: number): HTMLElement => {
  const el = document.createElement('div');
  Array(children)
    .fill(0)
    .forEach(() => el.appendChild(document.createElement('span')));
  return el;
};

it('disposes every child of a multi-child element', () => {
  // Five children is the case that separates a correct implementation
  // from one that mutates the live `childNodes` NodeList while iterating
  // it - the latter skips alternate nodes and leaves two behind (#56).
  const el = makeHost(5);
  expect(el.childNodes).toHaveLength(5);

  const returned = new LinearGauge(el).dispose();

  expect(el.childNodes).toHaveLength(0);
  expect(returned).toBe(el);
});

it('disposes an element holding several gauge containers', () => {
  // The realistic multi-child shape: `setOptions` appends one container
  // per call, so two calls without an intervening dispose - which is all
  // it takes for one cleanup to be skipped or reordered - leave two.
  const el = makeHost(0);
  const gauge = new LinearGauge(el);
  gauge.setOptions({ value: 2 });
  gauge.setOptions({ value: 4 });
  expect(el.childNodes).toHaveLength(2);

  gauge.dispose();

  expect(el.childNodes).toHaveLength(0);
});

it('disposes a single-child element and an already-empty one', () => {
  const el = makeHost(0);
  const gauge = new LinearGauge(el);
  gauge.setOptions({ value: 3 });
  expect(el.childNodes).toHaveLength(1);

  gauge.dispose();
  expect(el.childNodes).toHaveLength(0);

  gauge.dispose();
  expect(el.childNodes).toHaveLength(0);
});

/*
 * Geometry, moved here from the Gauge component's asFragment() snapshot
 * (#121). The React component renders through this class into a ref'd
 * container that no testing-library query can reach, and reading that
 * container directly from a .tsx test would mean bypassing
 * testing-library/no-node-access - a rule this repository has never once
 * disabled. Plain DOM is this file's established idiom, so the assertions
 * belong here.
 *
 * buildZones is the same function Gauge.tsx passes in, so these drive the
 * real computation rather than a stand-in. DATASET spans 1 to 7; its zone
 * boundaries are pinned by Gauge.test.tsx's own buildZones tests.
 */
const DATASET = [
  1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7,
  7, 7
];

const renderGauge = (value: number): HTMLElement => {
  const el = document.createElement('div');
  new LinearGauge(el).setOptions({
    divisions: 5,
    subDivisions: 2,
    zones: buildZones({ values: DATASET }),
    value
  });
  return el;
};

/*
 * Each band's share of the bar is set as flex-grow, so the rendered widths
 * are the zone spans in data units: 1->1.675, 1.675->4, 4->6.25, 6.25->7 and
 * the empty 7->7. This is what makes the assertion about the drawing rather
 * than a restatement of the arithmetic.
 */
it('sizes each quantile band by its span in data units', () => {
  const widths = Array.from(renderGauge(4).querySelectorAll('div'))
    .map((zone) => zone.style.flexGrow)
    .filter((grow) => grow !== '');

  expect(widths).toEqual(['0.675', '2.325', '2.25', '0.75', '0']);
});

/*
 * The pointer is the only part of the gauge that moves with the patient's
 * measurement, so its position is the gauge's actual output. DATASET spans
 * 1 to 7, so 4 is the midpoint; the offset is half the pointer's own width.
 */
it('places the pointer at the value position within the range', () => {
  expect(renderGauge(4).querySelector('svg')?.style.left).toBe(
    'calc(50% - 2px)'
  );
  expect(renderGauge(2.5).querySelector('svg')?.style.left).toBe(
    'calc(25% - 2px)'
  );
  expect(renderGauge(7).querySelector('svg')?.style.left).toBe(
    'calc(100% - 2px)'
  );
});

/*
 * A measurement outside the dataset draws no pointer at all, rather than one
 * pinned to an end - which would read as a value at the extreme of the
 * distribution rather than off it entirely.
 */
it('draws no pointer for a value outside the range', () => {
  expect(renderGauge(99).querySelector('svg')).toBeNull();
  expect(renderGauge(0).querySelector('svg')).toBeNull();
});
