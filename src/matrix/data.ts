import { DATA_POINTS, DataPoint } from '../db';

const ATA_DEVIATION: number = 0.1; // millimetres
const CLR_DEVIATION: number = 100; // micrometres

export const NUM_DATA_POINTS = DATA_POINTS.length;

export interface VaultRange {
  min?: number;
  max?: number;
}

export type LensSizeId = 'small' | 'medium' | 'large';
export interface LensSize {
  id: LensSizeId;
  label: string;
  value: number;
}

export const LENS_SIZE_SMALL: LensSize = {
  label: '12.6 mm',
  id: 'small',
  value: 12.6
};
export const LENS_SIZE_MEDIUM: LensSize = {
  label: '13.2 mm',
  id: 'medium',
  value: 13.2
};
export const LENS_SIZE_LARGE: LensSize = {
  label: '13.7 mm',
  id: 'large',
  value: 13.7
};

export const LENS_SIZES: LensSize[] = [
  LENS_SIZE_SMALL,
  LENS_SIZE_MEDIUM,
  LENS_SIZE_LARGE
];

type LensSizesType = {
  [key in LensSizeId]: LensSize;
};

export const LENS_SIZES_MAP: LensSizesType = {
  small: LENS_SIZE_SMALL,
  medium: LENS_SIZE_MEDIUM,
  large: LENS_SIZE_LARGE
};

type MyopiaId = 'low' | 'moderate' | 'high';
interface MyopiaLevel {
  id: MyopiaId;
  label: string;
  title: string;
  min: number;
  max: number;
}
export const MYOPIA_LEVELS: MyopiaLevel[] = [
  {
    id: 'low',
    label: 'Low',
    title: 'Spherical Equivalent (SE) less than -6 dpt',
    min: -6,
    max: Infinity
  },
  {
    id: 'moderate',
    label: 'Moderate',
    title: 'Spherical Equivalent (SE) between -6 dpt and -12 dpt',
    min: -12,
    max: -6
  },
  {
    id: 'high',
    label: 'High',
    title: 'Spherical Equivalent (SE) greater than -12 dpt',
    min: -Infinity,
    max: -12
  }
];

export interface MatrixFilter {
  readonly ata: number;
  readonly clr: number;
  readonly dataPoints?: DataPoint[];
}

interface CacheEntry {
  lens: LensSize;
  myopia: MyopiaLevel;
  dataPoints?: DataPoint[];
}

export const getDataPoints = ({
  lens,
  myopia,
  dataPoints = DATA_POINTS
}: CacheEntry): DataPoint[] =>
  dataPoints.filter(
    (point) =>
      lens.value === point.iclSize &&
      myopia.min <= point.iclSe &&
      point.iclSe < myopia.max
  );

export const filterPoint = ({
  ata,
  clr,
  point
}: {
  ata: number;
  clr: number;
  point: DataPoint;
}) =>
  ata >= point.ata - ATA_DEVIATION &&
  ata <= point.ata + ATA_DEVIATION &&
  clr >= point.clr - CLR_DEVIATION && // clr in db is in micrometres
  clr <= point.clr + CLR_DEVIATION; // clr in db is in micrometres

export const filterFlatRows = ({
  ata,
  clr,
  dataPoints = DATA_POINTS
}: MatrixFilter): DataPoint[][] =>
  LENS_SIZES.reduce(
    (memoLens, lens) => [
      ...memoLens,
      ...MYOPIA_LEVELS.reduce(
        (memoMyopia, level) => [
          ...memoMyopia,
          ...[
            getDataPoints({
              lens: lens,
              myopia: level,
              dataPoints: dataPoints
            }).filter((point: DataPoint) => filterPoint({ ata, clr, point }))
          ]
        ],
        [] as DataPoint[][]
      )
    ],
    [] as DataPoint[][]
  );
