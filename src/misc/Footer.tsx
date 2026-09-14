export const Footer = () => (
  <footer className="site-footer">
    <div className="wrap">
      <div className="rule" />
      <ul>
        <li>
          <a
            href={`https://github.com/ruipinge/icl-calc/releases/tag/v${
              import.meta.env.VITE_APP_VERSION
            }`}
          >
            {`v${import.meta.env.VITE_APP_VERSION}`}
          </a>{' '}
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
        and <a href="https://ruipinge.github.io/resume">Rui Pinge</a>.
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
