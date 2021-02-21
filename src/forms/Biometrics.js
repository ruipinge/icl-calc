import React from 'react';

import { UnitInput } from './components';


class BiometricsForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ata: 0.0, // mm
      wtw: 0.0, // mm
      clr: 0.0, // microns
      acq: 0.0, // mm
      aca: 45.0 // degrees
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
        <h2>Biometrics</h2>

        <UnitInput defaultValue="0" label="Angle to Angle" unit="mm" labelTitle="" unitTitle="millimetres" />
        <UnitInput defaultValue="0" label="White to White" unit="mm" unitTitle="millimetres" />
        <UnitInput defaultValue="0" label="Crystaline Lens Rise" unit="nm" unitTitle="nanometres" />
        <UnitInput defaultValue="0" label="Anterior Chamber Depth" unit="mm" unitTitle="millimetres" />
        <UnitInput defaultValue="45" label="Anterior Chamber Angle nasal" unit="º" unitTitle="degrees" />
        <UnitInput defaultValue="45" label="Anterior Chamber Angle temporal" unit="º" unitTitle="degrees" />
        <UnitInput defaultValue="45" label="Keratometry - Flat Meridian" unit="dpt" unitTitle="dioptres" />
        <UnitInput defaultValue="45" label="Central Corneal Thickness" unit="μm" unitTitle="micrometres" />
      </>
    );
  }
};

export default BiometricsForm;
