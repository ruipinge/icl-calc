import { ICLInputs, PreviousSurgery } from './types';

/*
 * Built-in example cases a clinician can load into the form.
 *
 * The values are copied, not imported, from the replay fixture's input rows.
 * That fixture is CI-guarded, and a wording change here must never touch it
 * (see issue #65). A test pins each copy to the row it came from.
 *
 * Rows 05/06 (the axis hinge) and 09/10 (schema bounds) are test instruments,
 * not clinical cases, and are excluded.
 *
 * Labels never name a lens size: that would read as a recommendation.
 */

export interface Preset {
  id: string;
  label: string;
  values: Omit<ICLInputs, 'patient'>;
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'typical-myope',
    label: 'Myopia with astigmatism, average anterior segment',
    values: {
      biometry: {
        ata: 11.8,
        wtw: 11.9,
        clr: 250,
        acd: 3.2,
        acan: 38,
        acat: 39
      },
      corneaProfile: {
        kaf: 43,
        axisaf: 180,
        kas: 44,
        axisas: 90,
        kpf: 0,
        axispf: 0,
        kps: 0,
        axisps: 0,
        cct: 540,
        previousSurgery: PreviousSurgery.none
      },
      spectacleRefraction: {
        sphere: -6,
        cylindre: -1,
        axis: 180,
        vertex: 12
      }
    }
  },
  {
    id: 'steep-cornea',
    label: 'Myopia with astigmatism, steep posterior cornea measured',
    values: {
      biometry: {
        ata: 11.8,
        wtw: 11.9,
        clr: 250,
        acd: 3.2,
        acan: 38,
        acat: 39
      },
      corneaProfile: {
        kaf: 43,
        axisaf: 180,
        kas: 44,
        axisas: 90,
        kpf: 7,
        axispf: 180,
        kps: 7.4,
        axisps: 90,
        cct: 540,
        previousSurgery: PreviousSurgery.none
      },
      spectacleRefraction: {
        sphere: -6,
        cylindre: -1,
        axis: 180,
        vertex: 12
      }
    }
  },
  {
    id: 'after-myopic-surgery',
    label: 'After myopic laser surgery: flat, thinner cornea',
    values: {
      biometry: {
        ata: 12.1,
        wtw: 12.2,
        clr: 180,
        acd: 3.35,
        acan: 40,
        acat: 41
      },
      corneaProfile: {
        kaf: 39.5,
        axisaf: 175,
        kas: 40.5,
        axisas: 85,
        kpf: 0,
        axispf: 0,
        kps: 0,
        axisps: 0,
        cct: 490,
        previousSurgery: PreviousSurgery.myopia
      },
      spectacleRefraction: {
        sphere: -1.5,
        cylindre: -0.5,
        axis: 175,
        vertex: 12
      }
    }
  },
  {
    id: 'after-hyperopic-surgery',
    label: 'After hyperopic laser surgery: steep cornea',
    values: {
      biometry: {
        ata: 12.1,
        wtw: 12.2,
        clr: 180,
        acd: 3.35,
        acan: 40,
        acat: 41
      },
      corneaProfile: {
        kaf: 47,
        axisaf: 10,
        kas: 48,
        axisas: 100,
        kpf: 0,
        axispf: 0,
        kps: 0,
        axisps: 0,
        cct: 520,
        previousSurgery: PreviousSurgery.hyperopia
      },
      spectacleRefraction: {
        sphere: -2,
        cylindre: -0.75,
        axis: 10,
        vertex: 12
      }
    }
  },
  {
    id: 'smaller-segment',
    label: 'Shallow anterior chamber, narrow angle',
    values: {
      biometry: {
        ata: 11.9,
        wtw: 12,
        clr: 100,
        acd: 2.85,
        acan: 33,
        acat: 34
      },
      corneaProfile: {
        kaf: 44.5,
        axisaf: 170,
        kas: 45.75,
        axisas: 80,
        kpf: 0,
        axispf: 0,
        kps: 0,
        axisps: 0,
        cct: 555,
        previousSurgery: PreviousSurgery.none
      },
      spectacleRefraction: {
        sphere: -4.5,
        cylindre: -0.5,
        axis: 170,
        vertex: 12
      }
    }
  },
  {
    id: 'larger-segment',
    label: 'High myopia, wide, deep anterior segment',
    values: {
      biometry: {
        ata: 12.7,
        wtw: 12.8,
        clr: 200,
        acd: 3.6,
        acan: 43,
        acat: 44
      },
      corneaProfile: {
        kaf: 41.5,
        axisaf: 5,
        kas: 42.25,
        axisas: 95,
        kpf: 0,
        axispf: 0,
        kps: 0,
        axisps: 0,
        cct: 525,
        previousSurgery: PreviousSurgery.none
      },
      spectacleRefraction: {
        sphere: -12,
        cylindre: -3,
        axis: 5,
        vertex: 12
      }
    }
  }
];
