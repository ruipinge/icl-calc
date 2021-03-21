import { FieldWithUnit } from './FieldWithUnit';
import { FormikState } from 'formik';
import { ICLInputs } from '../types';

export const SpectacleRefraction = ({
  errors,
  touched
}: FormikState<Pick<ICLInputs, 'spectacleRefraction'>>) => (
  <>
    <h4>Spectacle Refraction</h4>
    <FieldWithUnit
      label="Sphere"
      name="spectacleRefraction.sphere"
      unit="dpt"
      error={errors.spectacleRefraction?.sphere}
      touched={touched.spectacleRefraction?.sphere}
    />
    <FieldWithUnit
      label="Cylindre"
      name="spectacleRefraction.cylindre"
      unit="dpt"
      error={errors.spectacleRefraction?.cylindre}
      touched={touched.spectacleRefraction?.cylindre}
    />
    <FieldWithUnit
      label="Axis"
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
  </>
);
