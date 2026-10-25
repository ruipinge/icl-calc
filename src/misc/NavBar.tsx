/*
 * The Treeye mark links out to the group's site; the tool name links to the
 * calculator's own base path. Two links, deliberately: the owner decision on
 * #122 is that the calculator carries no cross-site nav while it is still
 * served from GitHub Pages (that arrives with #123), but it should still
 * offer one way back.
 *
 * The tool-name link is also the base-path guard. NavBar.test.tsx pins its
 * href to import.meta.env.BASE_URL, and vite.config.ts pins test.env.BASE_URL
 * to '/icl-calc/' because vitest 5 stopped deriving it from `base`. That
 * assertion is the only thing in the suite that would catch a base-path
 * regression, so the link's accessible name and href must not drift.
 *
 * The element stays a <nav>. Promoting it to <header> would read better as a
 * landmark, but it swaps `navigation` for `banner` in all four aria fixtures
 * and moves the shell screenshot locator - a semantic change wearing a
 * restyle's clothes. Worth doing deliberately later, not here.
 *
 * Inside it, the Treeye link is the treeye.science header's home link (#172):
 * the site's own symbol and wordmark, inlined from the files in
 * treeye-header/ (see SOURCE.md there for the commit they were copied from),
 * so no request leaves the origin. Its accessible name stays "Treeye", which
 * the four aria fixtures pin, rather than the site's "Treeye — home". The
 * wrapping spans are `display: contents`, so the SVGs lay out as direct
 * children of the link, as they do on the site.
 */
import icon from './treeye-header/icon.svg?raw';
import wordmark from './treeye-header/wordmark.svg?raw';

export const NavBar = ({ resetForm }: { resetForm: (a?: any) => void }) => (
  <nav className="chrome">
    <div className="chrome-bar wrap">
      <a className="home" href="https://treeye.science/" aria-label="Treeye">
        <span dangerouslySetInnerHTML={{ __html: icon }} />
        <span dangerouslySetInnerHTML={{ __html: wordmark }} />
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
