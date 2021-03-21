import { NavLink } from 'react-router-dom';

interface Link {
  to: string;
  label: string;
}

const LINKS: Link[] = [
  {
    to: '/',
    label: 'Patient'
  },
  {
    to: '/normality',
    label: 'Biometric Normality'
  },
  {
    to: '/matrix',
    label: 'Floating Matrix'
  },
  {
    to: '/regression',
    label: 'Regression'
  }
];

export const TabLinks = () => (
  <ul className="nav nav-pills" style={{ marginBottom: '1rem' }}>
    {LINKS.map((link, index) => (
      <li className="nav-item" key={index}>
        <NavLink
          exact={true}
          className="nav-link"
          activeClassName="active"
          to={link.to}
        >
          {link.label}
        </NavLink>
      </li>
    ))}
  </ul>
);
