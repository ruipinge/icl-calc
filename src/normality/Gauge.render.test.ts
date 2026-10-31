import { Gauge } from './Gauge';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

/*
 * The rendered component, layout effect included. The effect is
 * istanbul-ignored and every other "no value, no pointer" test calls
 * gaugeOptions or LinearGauge directly, so these are what pin that Gauge
 * hands the drawing its measured value. Plain DOM rather than Testing Library:
 * the pointer is an aria-hidden svg inside role="img", which no role query
 * reaches.
 */
const pointerOf = (value: number | undefined): SVGSVGElement | null => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() =>
    root.render(
      createElement(Gauge, {
        title: 'CLR',
        value,
        values: [-1, 0, 1, 2, 3, 4, 5]
      })
    )
  );
  const pointer = host.querySelector('[data-testid="gauge"] svg');
  root.unmount();
  host.remove();
  return pointer as SVGSVGElement | null;
};

it.each([
  ['an empty string', '' as unknown as number],
  ['undefined', undefined],
  ['NaN', NaN]
])('draws no pointer where the value is %s', (_, value) =>
  expect(pointerOf(value)).toBeNull()
);

it.each([0, 2])('draws the pointer where the value is %s', (value) =>
  expect(pointerOf(value)).not.toBeNull()
);
