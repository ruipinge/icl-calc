import ReactGA from 'react-ga';

const GA = {
  init: () => {
    const isGAEnabled = process.env.NODE_ENV === 'production';

    if (isGAEnabled) {
      ReactGA.initialize('UA-212134595-1');
      ReactGA.pageview(window.location.pathname + window.location.search);
    }

    return isGAEnabled;
  }
};

export default GA;
