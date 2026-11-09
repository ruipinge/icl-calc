/*
 * VITE_APP_PREVIEW_LABEL is read inline, like the version and commit, so a
 * build where it is empty folds the branch away. It is empty everywhere
 * except the Cloudflare preview, which sets it at build time. It replaces
 * the release link with plain text: no release tag exists for a preview,
 * so the releases/tag URL would 404; the commit link beside it already
 * identifies the exact source; and a branch link would move under a
 * deployed bundle.
 */
export const Footer = () => (
  <footer className="site-footer">
    <div className="wrap">
      {/*
        The spectrum bar is a <div>, not an <hr>. An <hr> renders a
        `separator` in the accessibility tree and this one is decoration -
        the footer already carries its own border-top.
      */}
      <div className="rule" />
      <ul>
        <li>
          {import.meta.env.VITE_APP_PREVIEW_LABEL ? (
            <span>{import.meta.env.VITE_APP_PREVIEW_LABEL}</span>
          ) : (
            <a
              href={`https://github.com/ruipinge/icl-calc/releases/tag/v${
                import.meta.env.VITE_APP_VERSION
              }`}
            >
              {`v${import.meta.env.VITE_APP_VERSION}`}
            </a>
          )}{' '}
          <a
            href={`https://github.com/ruipinge/icl-calc/commit/${
              import.meta.env.VITE_APP_COMMIT
            }`}
            title="The commit this build was made from"
          >
            {`(${import.meta.env.VITE_APP_COMMIT})`}
          </a>
        </li>
        <li>
          <a href="https://github.com/ruipinge/icl-calc/blob/main/README.md#instructions">
            Instructions
          </a>
        </li>
        <li>
          <a href="https://github.com/ruipinge/icl-calc/blob/main/README.md#data">
            Data
          </a>
        </li>
        <li>
          <a href="https://github.com/ruipinge/icl-calc">GitHub</a>
        </li>
      </ul>
      <p>
        Designed and built with love by{' '}
        <a href="https://www.linkedin.com/in/pedro-serra-44697321/">
          Pedro Serra
        </a>{' '}
        and{' '}
        <span className="nowrap">
          <a href="https://ruipinge.github.io/resume">Rui Pinge</a>.
        </span>
      </p>
      <p>
        Available under the{' '}
        <a
          href="https://github.com/ruipinge/icl-calc/blob/main/LICENSE"
          target="_blank"
          rel="license noopener noreferrer"
        >
          MIT License
        </a>{' '}
        without any kind of warranty.
      </p>
      <p>
        The authors cannot be held responsible for any consequense of its usage.
      </p>
    </div>
  </footer>
);
