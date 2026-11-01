import { ChangeEvent } from 'react';
import { ICLInputs } from '../types';
import { PRESETS } from '../presets';
import { useFormikContext } from 'formik';

/*
 * "Load an example case" (#65). Choosing one replaces biometry, cornea
 * profile and spectacle refraction, and nothing else: `patient` is spread
 * from the current values, so the name, date of birth and eye a clinician
 * typed - and the PatientInfo instance whose age() the form reads - stay.
 *
 * The select is not a form field. It has no `name`, holds no form value and
 * always shows "Choose…", so the same case can be chosen again after an
 * edit, and Reset has nothing of its own to clear.
 *
 * setValues revalidates (validateOnChange), which only clears errors here:
 * every preset is valid, and errors show for touched fields only, as before.
 */
export const Presets = () => {
  const { values, setValues } = useFormikContext<ICLInputs>();

  const apply = (event: ChangeEvent<HTMLSelectElement>) => {
    const preset = PRESETS.find((p) => p.id === event.target.value);
    if (preset) {
      void setValues({ ...values, ...preset.values });
    }
  };

  return (
    <div className="preset-row">
      <label htmlFor="fieldPreset">Load an example case</label>
      <select id="fieldPreset" value="" onChange={apply}>
        <option value="">Choose…</option>
        {PRESETS.map((p) => (
          <option value={p.id} key={p.id}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
};
