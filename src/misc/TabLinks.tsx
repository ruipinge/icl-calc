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
  <ul className="tabs">
    {LINKS.map((link, index) => (
      <li key={index}>
        <NavLink end={true} to={link.to}>
          {link.label}
        </NavLink>
      </li>
    ))}
  </ul>
);
