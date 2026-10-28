import { FieldWithUnit } from './FieldWithUnit';
import { FormikState } from 'formik';
import { ICLInputs } from '../types';

export const SpectacleRefraction = ({
  errors,
  touched
}: FormikState<Pick<ICLInputs, 'spectacleRefraction'>>) => (
  <section className="fieldgroup-section">
    <h4>Spectacle Refraction</h4>
    <div className="fieldgroup">
      <FieldWithUnit
        label="Sphere"
        qualifier=" (spectacle refraction)"
        name="spectacleRefraction.sphere"
        unit="dpt"
        error={errors.spectacleRefraction?.sphere}
        touched={touched.spectacleRefraction?.sphere}
      />
      <FieldWithUnit
        label="Cylindre"
        qualifier=" (spectacle refraction)"
        name="spectacleRefraction.cylindre"
        unit="dpt"
        error={errors.spectacleRefraction?.cylindre}
        touched={touched.spectacleRefraction?.cylindre}
      />
      <FieldWithUnit
        label="Axis"
        qualifier=" (spectacle refraction)"
        name="spectacleRefraction.axis"
        unit="º"
        error={errors.spectacleRefraction?.axis}
        touched={touched.spectacleRefraction?.axis}
      />
      <FieldWithUnit
        label="Vertex"
        name="spectacleRefraction.vertex"
        unit="mm"
        error={errors.spectacleRefraction?.vertex}
        touched={touched.spectacleRefraction?.vertex}
      />
    </div>
  </section>
);
