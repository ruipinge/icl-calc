export const Footer = () => (
  <footer
    className="p-3 p-md-5 mt-5 bg-light text-center text-sm-left"
    style={{ fontSize: '0.875rem', color: '#63707c' }}
  >
    <div className="container">
      <ul className="bd-footer-links pl-0 mb-3">
        <li className="d-inline-block">
          <a
            href={`https://github.com/ruipinge/icl-calc/releases/tag/v${process.env.REACT_APP_VERSION}`}
          >
            {`v${process.env.REACT_APP_VERSION}`}
          </a>
        </li>
        <li className="d-inline-block ml-3">
          <a href="https://github.com/ruipinge/icl-calc/blob/master/README.md#instructions">
            Instructions
          </a>
        </li>
        <li className="d-inline-block ml-3">
          <a href="https://github.com/ruipinge/icl-calc/blob/master/README.md#data">
            Data
          </a>
        </li>
        <li className="d-inline-block ml-3">
          <a href="https://github.com/ruipinge/icl-calc">GitHub</a>
        </li>
      </ul>
      <p className="mb-0">
        Designed and built with love by{' '}
        <a href="https://www.linkedin.com/in/pedro-serra-44697321/">
          Pedro Serra
        </a>{' '}
        and <a href="https://ruipinge.github.io/resume">Rui Pinge</a>.
      </p>
      <p className="mb-0">
        Available under the{' '}
        <a
          href="https://github.com/ruipinge/icl-calc/blob/master/LICENSE"
          target="_blank"
          rel="license noopener"
        >
          MIT License
        </a>{' '}
        without any kind of warranty.
      </p>
      <p className="mb-0">
        The authors cannot be held responsible for any consequense of its usage.
      </p>
    </div>
  </footer>
);
