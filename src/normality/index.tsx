import { HISTOGRAM_DATA, HistogramEntry, VALUES } from '../db';

import { Gauge } from './Gauge';
import { Histogram } from './Histogram';

const Graph = ({
  title,
  value,
  histogramSeries,
  gaugeValues
}: {
  title: string;
  value: number;
  histogramSeries: HistogramEntry[];
  gaugeValues: number[];
}) => (
  <>
    <div className="col-md-4">
      <Histogram title={title} data={histogramSeries} />
      <Gauge value={value} values={gaugeValues} />
    </div>
  </>
);

export const Normality = ({
  ata,
  clr,
  acq,
  aca,
  wtw
}: {
  ata: number;
  clr: number;
  acq: number;
  aca: number;
  wtw: number;
}) => (
  <>
    <div className="row">
      <Graph
        title={'Angle to Angle - AtA (mm)'}
        histogramSeries={HISTOGRAM_DATA.ata}
        value={ata}
        gaugeValues={VALUES.ATA}
      />
      <Graph
        title={'Crystalline Lens Rise - CLR (μm)'}
        histogramSeries={HISTOGRAM_DATA.clr}
        value={clr}
        gaugeValues={VALUES.CLR}
      />
      <Graph
        title={'Internal Anterior Chamber Depth - ACQ (mm)'}
        histogramSeries={HISTOGRAM_DATA.acq}
        value={acq}
        gaugeValues={VALUES.ACQ}
      />
    </div>
    <div className="row">
      <Graph
        title={'Average Anterior Chamber Angle - ACA (º)'}
        histogramSeries={HISTOGRAM_DATA.aca}
        value={aca}
        gaugeValues={VALUES.ACA}
      />
      <Graph
        title={'White to White - WtW (mm)'}
        histogramSeries={HISTOGRAM_DATA.wtw}
        value={wtw}
        gaugeValues={VALUES.WTW}
      />
      <div className="col-md-4"></div>
    </div>
  </>
);
