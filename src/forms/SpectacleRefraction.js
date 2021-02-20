import React from 'react';

import { UnitInput } from './components';


class SpectacleRefractionForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sphere: 0.0,
      cylinder: 0.0,
      axis: 0.0
    };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({
      value: event.target.value
    });
  }

  render() {
    return (
      <>
        <h2>Spectacle Refraction</h2>
        <UnitInput defaultValue="0" label="Sphere" unit="dpt" unitTyiyle="dioptres" />
        <UnitInput defaultValue="0" label="Cylinder" helpText="negative form" unit="dpt" unitTyiyle="dioptres" />
        <UnitInput defaultValue="0" label="Axis" unit="º" unitTitle="degrees" />
      </>
    );
  }
};

export default SpectacleRefractionForm;
