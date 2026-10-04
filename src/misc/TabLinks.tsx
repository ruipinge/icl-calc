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

/*
 * The active tab is marked by aria-current="page", which NavLink sets on its
 * own - the `active` class this used to carry was presentational, and the
 * browser gates were repointed off it before this reskin began. TabLinks.test
 * asserts aria-current directly.
 */
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
