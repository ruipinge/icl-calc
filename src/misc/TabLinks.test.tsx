import { HashRouter as Router } from 'react-router-dom';
import { TabLinks } from './TabLinks';
import { render } from '@testing-library/react';

it('renders without crashing', () => {
  const { asFragment } = render(
    <Router>
      <TabLinks />
    </Router>
  );
  expect(asFragment()).toMatchSnapshot();
});
