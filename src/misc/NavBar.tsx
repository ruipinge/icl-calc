/*
 * The Treeye mark links out to the group's site; the tool name links to the
 * calculator's own base path. Two links, deliberately: #122's owner decision
 * is that the calculator carries no cross-site nav while it is still served
 * from GitHub Pages (that arrives with #123), but it should still offer one
 * way back. The tool-name link is also the base-path guard - NavBar.test.tsx
 * pins its href to import.meta.env.BASE_URL, which is the only assertion in
 * the suite that would catch a base-path regression.
 */
const TreeyeMark = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <circle
      cx="16"
      cy="16"
      r="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M16 25V13"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="16" cy="11" r="4.4" fill="currentColor" />
  </svg>
);

export const NavBar = ({ resetForm }: { resetForm: (a?: any) => void }) => (
  <nav className="chrome">
    <div className="chrome-bar wrap">
      <a className="brand" href="https://treeye.science/">
        <TreeyeMark />
        <span className="wordmark">Treeye</span>
      </a>
      <a className="toolname" href={import.meta.env.BASE_URL}>
        ICL Size Calc
      </a>
      <button
        type="button"
        className="btn-ghost"
        onClick={() => {
          resetForm();
        }}
      >
        Reset
      </button>
    </div>
  </nav>
);
