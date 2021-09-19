import { HISTOGRAM_DATA, VALUES } from '../db';

import { Gauge } from './Gauge';
import { Histogram } from './Histogram';

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
      <div className="col-md-4">
        <Histogram
          title={'Angle to Angle - AtA (mm)'}
          data={HISTOGRAM_DATA.ata}
        />
        <Gauge value={ata} values={VALUES.ATA} />
      </div>
      <div className="col-md-4">
        <Histogram
          title={'Crystalline Lens Rise - CLR (μm)'}
          data={HISTOGRAM_DATA.clr}
        />
        <Gauge value={clr} values={VALUES.CLR} />
      </div>
      <div className="col-md-4">
        <Histogram
          title={'Internal Anterior Chamber Depth  - ACQ (mm)'}
          data={HISTOGRAM_DATA.acq}
        />
        <Gauge value={acq} values={VALUES.ACQ} />
      </div>
    </div>
    <div className="row">
      <div className="col-md-4">
        <Histogram
          title={'Average Anterior Chamber Angle  - ACA (º)'}
          data={HISTOGRAM_DATA.aca}
        />
        <Gauge value={aca} values={VALUES.ACA} />
      </div>
      <div className="col-md-4">
        <Histogram
          title={'White to White  - WtW (mm)'}
          data={HISTOGRAM_DATA.wtw}
        />
        <Gauge value={wtw} values={VALUES.WTW} />
      </div>
      <div className="col-md-4"></div>
    </div>
  </>
);
