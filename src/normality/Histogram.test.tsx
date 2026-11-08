import { PLOT_INSET_LEFT, PLOT_INSET_RIGHT } from './plot-inset';
import { act, render, screen, within } from '@testing-library/react';

import { HISTOGRAM_DATA } from '../db';
import { Histogram } from './Histogram';

it('draws one bar per bin', () => {
  render(
    <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
  );
  expect(screen.getAllByTestId('bar')).toHaveLength(10);
});

it('renders the title', () => {
  render(
    <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
  );
  expect(screen.getByText('Angle to Angle - AtA (mm)')).toBeInTheDocument();
});

/*
 * The gauge rendered directly beneath each histogram encodes the SAME
 * horizontal scale - it is the quantile band for the same metric - and
 * positions itself with CSS pixel margins. So the histogram's plot area has
 * to begin and end at exactly those insets, or the band stops sitting under
 * the values it describes.
 *
 * This went wrong once already and no test caught it: an earlier version of
 * this component scaled a viewBox to fit its column, which can satisfy the
 * alignment at one column width and drifts at every other. Both components
 * were individually correct; only the pair was wrong. It was found by eye.
 */
it('starts and ends its plot area at the inset the gauge uses', () => {
  render(
    <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
  );

  const svg = screen.getByTestId('histogram');
  const width = Number(svg.getAttribute('width'));

  // The y-axis gridlines span the full plot area, so their endpoints are the
  // plot's left and right edges.
  const gridline = screen.getAllByTestId('gridline')[0];

  expect(Number(gridline.getAttribute('x1'))).toBe(PLOT_INSET_LEFT);
  expect(Number(gridline.getAttribute('x2'))).toBe(width - PLOT_INSET_RIGHT);
});

it('keeps that alignment at a different container width', () => {
  // Same assertion, different width: a viewBox-scaled implementation passes
  // the test above at its one design width and fails here.
  render(<Histogram title="Age (years)" data={HISTOGRAM_DATA.age} />);

  const svg = screen.getByTestId('histogram');
  const width = Number(svg.getAttribute('width'));
  const bars = screen.getAllByTestId('bar');
  const lastBar = bars[bars.length - 1];

  const plotRight = width - PLOT_INSET_RIGHT;
  const lastBarRight =
    Number(lastBar.getAttribute('x')) + Number(lastBar.getAttribute('width'));

  // The final bar's slot ends at the plot's right edge; the bar itself is
  // inset by the gap between bars, so it must land just inside it.
  expect(lastBarRight).toBeLessThanOrEqual(plotRight);
  expect(lastBarRight).toBeGreaterThan(plotRight - 10);
});

/*
 * The x axis is labelled on every other bin, following what amCharts did at
 * minGridDistance = 30. Without this, nothing asserts the axis at all: bar
 * geometry and bar titles are covered above and in normality/index.test.tsx,
 * but the labels a clinician reads the scale off were only ever recorded by
 * the Normality asFragment() snapshot that #121 removes.
 *
 * Caught by mutation-testing the conversion: dropping the first axis label
 * left the whole suite green.
 *
 * The values are the AtA bin boundaries, rounded for display. Labelling
 * alternate bins is asserted in both directions - a labelled boundary is
 * present and the unlabelled one between two of them is absent - because an
 * implementation that labelled every bin would satisfy the first half alone.
 */
it('labels every other bin along the x axis', () => {
  render(
    <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
  );

  ['10.72', '11.288', '11.856', '12.424', '12.992'].forEach((label) => {
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  expect(screen.queryByText('11.004')).not.toBeInTheDocument();
  expect(screen.queryByText('11.572')).not.toBeInTheDocument();
});

/*
 * The production path. In a browser the histogram is drawn at its measured
 * width and re-measured by a ResizeObserver whenever its column changes, which
 * is what holds the gauge alignment above at every viewport rather than only
 * at first paint. jsdom has no ResizeObserver and reports every width as 0, so
 * every test above runs on FALLBACK_WIDTH, and until this one nothing
 * exercised the measuring path at all.
 *
 * Both are stubbed here: a ResizeObserver whose callback the test fires by
 * hand, and getBoundingClientRect reporting a width the test controls.
 */
describe('in a browser that has ResizeObserver', () => {
  class FakeResizeObserver {
    static readonly instances: FakeResizeObserver[] = [];
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(readonly callback: ResizeObserverCallback) {
      FakeResizeObserver.instances.push(this);
    }
    resize() {
      this.callback([], this as unknown as ResizeObserver);
    }
  }

  let containerWidth: number;
  // Every element the component asked for its size, so the test can check
  // that the element it observes is the one it measures.
  let measured: Element[];

  beforeEach(() => {
    FakeResizeObserver.instances.length = 0;
    containerWidth = 500;
    measured = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        measured.push(this);
        return { width: containerWidth } as DOMRect;
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('observes its own container, and draws at the measured width', () => {
    render(<Histogram title="Age (years)" data={HISTOGRAM_DATA.age} />);

    const svg = screen.getByTestId('histogram');
    expect(FakeResizeObserver.instances).toHaveLength(1);
    expect(measured[0]).toContainElement(svg);
    expect(FakeResizeObserver.instances[0].observe).toHaveBeenCalledWith(
      measured[0]
    );
    expect(Number(svg.getAttribute('width'))).toBe(500);
  });

  it('re-measures on resize and keeps the gauge alignment', () => {
    render(<Histogram title="Age (years)" data={HISTOGRAM_DATA.age} />);

    containerWidth = 720;
    act(() => FakeResizeObserver.instances[0].resize());

    const svg = screen.getByTestId('histogram');
    const gridline = screen.getAllByTestId('gridline')[0];
    expect(Number(svg.getAttribute('width'))).toBe(720);
    expect(Number(gridline.getAttribute('x2'))).toBe(720 - PLOT_INSET_RIGHT);
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = render(
      <Histogram title="Age (years)" data={HISTOGRAM_DATA.age} />
    );
    const observer = FakeResizeObserver.instances[0];
    expect(observer.disconnect).not.toHaveBeenCalled();

    unmount();

    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });
});

/*
 * Spec §7: the histogram is set in Treeye tokens - indigo bars on a --rule
 * grid, axis labels in --muted, the title in Poppins 500 and every axis
 * numeral in the numeric face (--numeric, Inter, tabular with ss02; #193).
 * Each is written as a var() reference rather than resolved, so the page's
 * tokens are the single source and nothing is read at render time.
 */
describe('in Treeye tokens', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fills every bar with indigo', () => {
    render(
      <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
    );
    screen.getAllByTestId('bar').forEach((bar) => {
      expect(bar.style.fill).toBe('var(--leaf-indigo)');
    });
  });

  it('draws the gridlines in --rule', () => {
    render(
      <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
    );
    // The horizontal gridlines and the vertical ones at each labelled bin.
    [
      ...screen.getAllByTestId('gridline'),
      ...screen.getAllByTestId('bin-gridline')
    ].forEach((line) => {
      expect(line.style.stroke).toBe('var(--rule)');
    });
  });

  it('sets axis numerals in --ink and --numeric, the axis title in --muted', () => {
    render(
      <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
    );
    // A y-axis tick, an x-axis bin boundary, and the rotated axis title.
    ['150', '10.72'].forEach((numeral) => {
      expect(screen.getByText(numeral).style.fill).toBe('var(--ink)');
    });
    expect(screen.getByText('Number of Eyes').style.fill).toBe('var(--muted)');
    ['150', '10.72'].forEach((numeral) => {
      const style = screen.getByText(numeral).style;
      expect(style.fontFamily).toBe('var(--numeric)');
      expect(style.fontVariantNumeric).toBe('tabular-nums');
      expect(style.fontFeatureSettings).toBe('"ss02"');
    });
    expect(screen.getByText('Number of Eyes').style.fontFamily).toBe(
      'var(--display)'
    );
  });

  it('sets the title in Poppins 500', () => {
    render(
      <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
    );
    const title = screen.getByText('Angle to Angle - AtA (mm)');
    expect(title.style.fontFamily).toBe('var(--display)');
    expect(title.style.fontWeight).toBe('500');
  });

  it('reads no computed style while rendering', () => {
    const spy = vi.spyOn(window, 'getComputedStyle');
    render(
      <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

/*
 * No title clips its chart. SVG text never wraps and the SVG is exactly as
 * wide as its column, so a title wider than the column was cut off at both
 * edges - the ACD title is 334px at 14px Poppins, against a 280px SVG on a
 * 320px phone. A title wider than the SVG less 4px a side breaks onto two
 * lines at " - " and the chart moves down one 17px line beneath it.
 *
 * jsdom has no getComputedTextLength (and no document.fonts), so every test
 * above runs on the unwrapped path. Here the natural width is stubbed on
 * SVGElement.prototype; FALLBACK_WIDTH is 340, so 332px is the most that fits.
 */
describe('a title wider than its chart', () => {
  const ACD = 'Internal Anterior Chamber Depth - ACD (mm)';
  let naturalWidth: number;
  let measure: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    naturalWidth = 400;
    measure = vi.fn(() => naturalWidth);
    Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', {
      configurable: true,
      value: measure
    });
  });

  afterEach(() => {
    delete (SVGElement.prototype as { getComputedTextLength?: unknown })
      .getComputedTextLength;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const geometry = () => ({
    gridlines: screen
      .getAllByTestId('gridline')
      .map((line) => Number(line.getAttribute('y1'))),
    bars: screen.getAllByTestId('bar').map((bar) => ({
      x: bar.getAttribute('x'),
      height: bar.getAttribute('height')
    }))
  });

  it('breaks onto two lines at " - " and moves the chart down one line', () => {
    naturalWidth = 300;
    const { unmount } = render(
      <Histogram title={ACD} data={HISTOGRAM_DATA.acd} />
    );
    const flat = geometry();
    unmount();

    naturalWidth = 333;
    render(<Histogram title={ACD} data={HISTOGRAM_DATA.acd} />);

    const title = screen.getByTestId('histogram-title');
    const lines = within(title).getAllByText(/./, { selector: 'tspan' });
    expect(lines.map((line) => line.textContent)).toEqual([
      'Internal Anterior Chamber Depth',
      'ACD (mm)'
    ]);
    expect(lines[1].getAttribute('dy')).toBe('17');
    expect(screen.getByTestId('histogram').getAttribute('height')).toBe('317');
    const wrapped = geometry();
    expect(Math.min(...wrapped.gridlines)).toBe(34 + 17);
    expect(wrapped.gridlines).toEqual(flat.gridlines.map((y) => y + 17));
    expect(wrapped.bars).toEqual(flat.bars);
  });

  it('stays on one line, as before, when it fits', () => {
    naturalWidth = 332;
    render(<Histogram title={ACD} data={HISTOGRAM_DATA.acd} />);

    expect(measure).toHaveBeenCalled();
    expect(screen.getByText(ACD)).toBe(screen.getByTestId('histogram-title'));
    expect(screen.getByTestId('histogram').getAttribute('height')).toBe('300');
    expect(Math.min(...geometry().gridlines)).toBe(34);
  });

  it('never wraps a title without " - "', () => {
    naturalWidth = 1000;
    render(
      <Histogram title="A long title with no break" data={HISTOGRAM_DATA.age} />
    );

    expect(measure).toHaveBeenCalled();
    expect(
      within(screen.getByTestId('histogram-title')).queryAllByText(/./, {
        selector: 'tspan'
      })
    ).toHaveLength(0);
    expect(screen.getByTestId('histogram').getAttribute('height')).toBe('300');
  });

  it('re-measures a new title rather than reuse the old one', () => {
    const { rerender } = render(
      <Histogram title={ACD} data={HISTOGRAM_DATA.acd} />
    );
    expect(screen.getAllByText(/./, { selector: 'tspan' })).toHaveLength(2);

    naturalWidth = 200;
    rerender(<Histogram title="Age - Years" data={HISTOGRAM_DATA.age} />);

    expect(measure).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Age - Years')).toBeInTheDocument();
  });

  it('un-wraps when its column widens past it, without re-measuring', () => {
    let resize = () => {};
    class FakeResizeObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(callback: ResizeObserverCallback) {
        resize = () => callback([], this as unknown as ResizeObserver);
      }
    }
    let containerWidth = 300;
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ width: containerWidth }) as DOMRect
    );
    naturalWidth = 334;
    render(<Histogram title={ACD} data={HISTOGRAM_DATA.acd} />);
    expect(screen.getByTestId('histogram').getAttribute('height')).toBe('317');

    containerWidth = 342;
    act(() => resize());

    expect(screen.getByText(ACD)).toBe(screen.getByTestId('histogram-title'));
    expect(screen.getByTestId('histogram').getAttribute('height')).toBe('300');
    expect(measure).toHaveBeenCalledTimes(1);
  });

  /*
   * The first measurement can be taken in a fallback face, before the
   * self-hosted Poppins has loaded, so a finished font load measures again.
   */
  describe('when fonts load', () => {
    let resolveReady: () => void;
    let fonts: {
      ready: Promise<void>;
      addEventListener: ReturnType<typeof vi.fn>;
      removeEventListener: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      fonts = {
        ready: new Promise<void>((resolve) => {
          resolveReady = resolve;
        }),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      Object.defineProperty(document, 'fonts', {
        configurable: true,
        value: fonts
      });
    });

    afterEach(() => {
      delete (document as { fonts?: unknown }).fonts;
    });

    const loadingDone = () => {
      const [[event, listener]] = fonts.addEventListener.mock.calls as [
        string,
        () => void
      ][];
      expect(event).toBe('loadingdone');
      return listener;
    };

    it('re-measures on loadingdone', () => {
      render(<Histogram title={ACD} data={HISTOGRAM_DATA.acd} />);
      expect(screen.getByTestId('histogram').getAttribute('height')).toBe(
        '317'
      );

      naturalWidth = 300;
      act(() => loadingDone()());

      expect(measure).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('histogram').getAttribute('height')).toBe(
        '300'
      );
    });

    it('re-measures once fonts are ready', async () => {
      render(<Histogram title={ACD} data={HISTOGRAM_DATA.acd} />);
      expect(screen.getByTestId('histogram').getAttribute('height')).toBe(
        '317'
      );

      naturalWidth = 300;
      await act(async () => {
        resolveReady();
        await fonts.ready;
      });

      expect(measure).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('histogram').getAttribute('height')).toBe(
        '300'
      );
    });

    it('removes its loadingdone listener on unmount', () => {
      const { unmount } = render(
        <Histogram title={ACD} data={HISTOGRAM_DATA.acd} />
      );
      const listener = loadingDone();
      expect(fonts.removeEventListener).not.toHaveBeenCalled();

      unmount();

      expect(fonts.removeEventListener).toHaveBeenCalledWith(
        'loadingdone',
        listener
      );
    });
  });
});
