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

interface GraphConfig {
  title: string;
  data: HistogramEntry[];
  arg: string;
  values: number[];
}

const GRAPH_CONFIGS: GraphConfig[] = [
  {
    title: 'Angle to Angle - AtA (mm)',
    data: HISTOGRAM_DATA.ata,
    arg: 'ata',
    values: VALUES.ATA
  },
  {
    title: 'Crystalline Lens Rise - CLR (μm)',
    data: HISTOGRAM_DATA.clr,
    arg: 'clr',
    values: VALUES.CLR
  },
  {
    title: 'Internal Anterior Chamber Depth - ACD (mm)',
    data: HISTOGRAM_DATA.acd,
    arg: 'acd',
    values: VALUES.ACD
  },
  {
    title: 'Average Anterior Chamber Angle - ACA (º)',
    data: HISTOGRAM_DATA.aca,
    arg: 'aca',
    values: VALUES.ACA
  },
  {
    title: 'White to White - WtW (mm)',
    data: HISTOGRAM_DATA.wtw,
    arg: 'wtw',
    values: VALUES.WTW
  },
  {
    title: 'Age (years)',
    data: HISTOGRAM_DATA.age,
    arg: 'age',
    values: VALUES.AGE
  }
];

export const Normality = ({ ...args }) => (
  <>
    <div className="row">
      {GRAPH_CONFIGS.map((config) => (
        <Graph
          title={config.title}
          histogramSeries={config.data}
          value={args[config.arg]}
          gaugeValues={config.values}
          key={config.arg}
        />
      ))}
    </div>
  </>
);
