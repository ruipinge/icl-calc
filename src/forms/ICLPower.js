import React from 'react';

import { UnitInput } from './components';


class ICLPowerForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sphere: 0.0,
      cylinder: 0.0,
      axis: 0.0,
      sphericalEquivalent: 0.0
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
        <h2>ICL Power</h2>

        <UnitInput defaultValue="0" label="Sphere" unit="dpt" unitTyiyle="dioptres" />
        <UnitInput defaultValue="0" label="Cylinder" helpText="positive form" unit="dpt" unitTyiyle="dioptres" />
        <UnitInput defaultValue="0" label="Axis" unit="º" unitTitle="degrees" />
        <UnitInput defaultValue="0" label="Spherical Equivalent" unit="º" unitTitle="degrees" />
      </>
    );
  }
};

export default ICLPowerForm;
