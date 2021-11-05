import ReactGA from 'react-ga';

const GA = {
  init: () => {
    debugger;
    const isGAEnabled = process.env.NODE_ENV === 'production';

    if (isGAEnabled) {
      ReactGA.initialize('G-MMRGFH8VF0');
    }

    return isGAEnabled;
  }
};

export default GA;
