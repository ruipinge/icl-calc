import { LinearGauge } from './index';

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
