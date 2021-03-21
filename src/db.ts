import raw from 'raw.macro';

const csv = raw('./data.csv');

export type Row = number[];

export const ROWS: Row[] = csv
  .split('\n')
  .reduce(
    (memo, row) => [...memo, row.split(';').map((col: string) => Number(col))],
    [] as Row[]
  )
  .filter((row) => !!row[0] && !isNaN(row[0]));

export enum Myopia {
  'low',
  'moderate',
  'high'
}

export const MYOPIA_KEYS = Object.keys(Myopia).filter((key) =>
  isNaN(Number(key))
);

export enum LensSize {
  small = 12.6,
  medium = 13.2,
  large = 13.7
}

export const LENS_SIZES = [LensSize.small, LensSize.medium, LensSize.large];

export type MyopiaIndex = {
  [key in Myopia]: Row[];
};

export type LensSizeIndex = {
  [key in LensSize]: MyopiaIndex;
};

export const getMyopia = (se: number): Myopia => {
  if (se >= -6) {
    return Myopia.low;
  }
  if (se < -12) {
    return Myopia.high;
  }
  return Myopia.moderate;
};

export const MYOPIA_LEVEL = [Myopia.low, Myopia.moderate, Myopia.high];

export const buildIndex = (rows: Row[]) => {
  // Initialize with all Lens Sizes and Myopia levels
  const initial: LensSizeIndex = LENS_SIZES.reduce((memoLens, lensSize) => {
    memoLens[lensSize] = MYOPIA_LEVEL.reduce((memoMyopia, myopia) => {
      memoMyopia[myopia] = [];
      return memoMyopia;
    }, {} as MyopiaIndex);
    return memoLens;
  }, {} as LensSizeIndex);

  return rows.reduce((memo: LensSizeIndex, row) => {
    const lensSize: LensSize = row[1],
      myopia = getMyopia(row[2]);

    // Reject Lens Sizes not matching the pre-defined values
    if (LensSize[lensSize] === undefined) {
      return memo;
    }

    memo[lensSize][myopia].push(row);

    return memo;
  }, initial);
};

export const INDEXED_ROWS: LensSizeIndex = buildIndex(ROWS);
