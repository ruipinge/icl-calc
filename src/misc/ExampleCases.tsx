import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { PRESETS, Preset } from '../presets';
import { ICLFormValues } from '../types';
import { useFormikContext } from 'formik';

const GROUPS = ['biometry', 'corneaProfile', 'spectacleRefraction'] as const;

const STEPS: Partial<Record<string, number>> = { ArrowDown: 1, ArrowUp: -1 };

/*
 * Example cases (#65, moved into the top bar by #206). The Examples button
 * beside Reset discloses a list of cases (the WAI-ARIA disclosure pattern,
 * not role=menu); only activating an item - a click, or Enter/Space, which a
 * native <button> turns into a click - loads it. Arrow keys move focus
 * between items and never load: #202 kept loading off a select's change
 * event because Chromium on Windows and Linux fires change while a closed
 * select is stepped through with the arrows, so one key would overwrite a
 * clinician's measurements (WCAG 3.2.2, On Input). The same rule holds here.
 *
 * Loading replaces biometry, cornea profile and spectacle refraction, and
 * nothing else: `patient` is spread from the current values, so the name,
 * date of birth and eye a clinician typed - and the PatientInfo instance
 * whose age() the form reads - stay.
 *
 * Neither control is a form field: no `name`, no form value. The loaded
 * case's id lives in Formik `status`, which resetForm() clears, so Reset
 * needs nothing of its own. The status line is derived from it: it names the
 * case only while the form still holds exactly that case's clinical values,
 * so an edit or a Reset clears it. ExampleStatus is rendered by the shell
 * under the tab strip, so a case loaded from any tab is confirmed there.
 *
 * setValues revalidates (validateOnChange), which only clears errors here:
 * every preset is valid, and errors show for touched fields only, as before.
 */
export const loadedExample = (
  values: ICLFormValues,
  status: unknown
): Preset | undefined => {
  const id = (status as { example?: unknown } | undefined)?.example;
  return PRESETS.find(
    (p) =>
      p.id === id &&
      GROUPS.every((group) =>
        Object.entries(p.values[group]).every(
          ([key, value]) =>
            (values[group] as unknown as Record<string, unknown>)[key] === value
        )
      )
  );
};

export const ExamplesMenu = () => {
  const { values, setValues, setStatus } = useFormikContext<ICLFormValues>();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const load = (preset: Preset) => {
    // values before status: Formik 2 applies each to its state ref at once,
    // so no render sees the new id beside the old values (which ExampleStatus
    // would read as an edit and clear)
    void setValues({ ...values, ...preset.values });
    setStatus({ example: preset.id });
    close();
    // Examples sits in the sticky header, the confirmation at the top of the
    // page: bring it into view for a clinician scrolled down a tab. jsdom
    // has no scrollIntoView.
    document
      .getElementById('example-status')
      ?.scrollIntoView?.({ block: 'nearest' });
  };

  const focusItem = (index: number) => {
    const count = PRESETS.length;
    itemRefs.current[(index + count) % count]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    if (event.key === 'Escape') {
      close();
      return;
    }
    const step = STEPS[event.key];
    if (step === undefined) return;
    // -1 is the Examples button, where only ArrowDown (to the first item) acts
    const index = itemRefs.current.indexOf(event.target as HTMLButtonElement);
    if (index === -1 && step < 0) return;
    focusItem(index + step);
    event.preventDefault();
  };

  return (
    <div
      className="examples"
      ref={wrapperRef}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next && !wrapperRef.current?.contains(next)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="btn-ghost"
        ref={buttonRef}
        aria-expanded={open}
        aria-controls={open ? 'examples-panel' : undefined}
        onClick={() => setOpen(!open)}
      >
        Examples
      </button>
      {open && (
        <div id="examples-panel" className="examples-panel">
          <p id="examples-caption" className="examples-caption">
            Load an example case. Name, date of birth and eye are kept.
          </p>
          <ul aria-labelledby="examples-caption">
            {PRESETS.map((p, index) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="examples-item"
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  onClick={() => load(p)}
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/*
 * Always mounted, so the live region exists before its text changes.
 *
 * The first edit away from the loaded case drops its id, so typing the
 * original value back does not bring the confirmation back: by then the
 * clinician has entered data. Clearing makes `example` undefined, so the
 * effect cannot loop.
 */
export const ExampleStatus = () => {
  const { values, status, setStatus } = useFormikContext<ICLFormValues>();
  const loaded = loadedExample(values, status);
  const example = (status as { example?: unknown } | undefined)?.example;
  const edited = example !== undefined && loaded === undefined;
  useEffect(() => {
    if (edited) setStatus(undefined);
  }, [edited, setStatus]);
  return (
    <p id="example-status" role="status" className="example-status">
      {loaded &&
        `Loaded "${loaded.label}". Name, date of birth and eye were kept as entered.`}
    </p>
  );
};
