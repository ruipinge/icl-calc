import { PRESETS, Preset } from '../presets';
import { useRef, useState } from 'react';
import { ICLInputs } from '../types';
import { useFormikContext } from 'formik';

const GROUPS = ['biometry', 'corneaProfile', 'spectacleRefraction'] as const;

/*
 * "Load an example case" (#65). Choosing a case in the select does nothing
 * to the form; the Load button applies it. A select that applied on change
 * would overwrite a clinician's measurements on a single arrow key, since
 * Chromium on Windows and Linux fires change while a closed select is
 * stepped through (WCAG 3.2.2, On Input).
 *
 * Loading replaces biometry, cornea profile and spectacle refraction, and
 * nothing else: `patient` is spread from the current values, so the name,
 * date of birth and eye a clinician typed - and the PatientInfo instance
 * whose age() the form reads - stay. The select then returns to "Choose…".
 *
 * Neither control is a form field: no `name`, no form value, so Reset has
 * nothing of their own to clear. The status line is derived, not stored: it
 * names the loaded case only while the form still holds exactly that case's
 * clinical values, so an edit or a Reset clears it. It sits outside the
 * row's grid, so its width never resizes the row's columns.
 *
 * setValues revalidates (validateOnChange), which only clears errors here:
 * every preset is valid, and errors show for touched fields only, as before.
 */
export const Presets = () => {
  const { values, setValues } = useFormikContext<ICLInputs>();
  const [chosen, setChosen] = useState('');
  const [loadedId, setLoadedId] = useState('');
  const selectRef = useRef<HTMLSelectElement>(null);

  // undefined while "Choose…" is shown, which is also what disables Load
  const preset = PRESETS.find((p) => p.id === chosen);

  const load = (preset: Preset) => {
    void setValues({ ...values, ...preset.values });
    setLoadedId(preset.id);
    setChosen('');
    // Load disables itself, and a disabled control drops focus to <body>
    selectRef.current?.focus();
  };

  const loaded = PRESETS.find(
    (p) =>
      p.id === loadedId &&
      GROUPS.every((group) =>
        Object.entries(p.values[group]).every(
          ([key, value]) =>
            (values[group] as unknown as Record<string, unknown>)[key] === value
        )
      )
  );

  return (
    <div className="presets">
      <div className="preset-row">
        <label htmlFor="fieldPreset">Load an example case</label>
        <select
          id="fieldPreset"
          ref={selectRef}
          value={chosen}
          onChange={(event) => setChosen(event.target.value)}
        >
          <option value="">Choose…</option>
          {PRESETS.map((p) => (
            <option value={p.id} key={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-ghost"
          disabled={!preset}
          onClick={preset && (() => load(preset))}
        >
          Load
        </button>
      </div>
      <p role="status" className="preset-status">
        {loaded &&
          `Loaded "${loaded.label}". Name, date of birth and eye were kept as entered.`}
      </p>
    </div>
  );
};
