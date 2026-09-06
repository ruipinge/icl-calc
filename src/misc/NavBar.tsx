export const NavBar = ({ resetForm }: { resetForm: (a?: any) => void }) => (
  <nav className="navbar navbar-expand navbar-dark bg-dark fixed-top">
    <div className="container">
      <a className="navbar-brand" href={import.meta.env.BASE_URL}>
        ICL Size Calc
      </a>
      <form className="form-inline">
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            resetForm();
          }}
        >
          Reset
        </button>
      </form>
    </div>
  </nav>
);
