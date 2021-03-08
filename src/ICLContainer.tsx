import { useState } from 'react';

import { INITIAL_VALUES } from './patient';
import { ICLForm } from './ICLForm';

export const ICLContainer = () => {
  const [val, setVal] = useState(0);

  return (
    <>
      <nav className="navbar navbar-expand navbar-dark bg-dark fixed-top">
        <div className="container">
          <a className="navbar-brand" href="/icl-calc">
            ICL Size Calc
          </a>
          <ul className="navbar-nav mr-auto">
            {/*
            <li class="nav-item active">
              <a class="nav-link" href="#home">Home <span class="sr-only">(current)</span></a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">Link</a>
            </li>
            */}
          </ul>
          <form className="form-inline">
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                setVal((state) => state + 1);
              }}
            >
              Reset
            </button>
          </form>
        </div>
      </nav>
      <div className="container">
        <ICLForm initialValues={INITIAL_VALUES} key={val} />
      </div>
    </>
  );
};
