# ICL Size Calc

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![build](https://github.com/ruipinge/icl-calc/workflows/main/badge.svg)](https://github.com/ruipinge/icl-calc/actions)
[![Maintainability](https://api.codeclimate.com/v1/badges/386ed8d68c41f3873530/maintainability)](https://codeclimate.com/github/ruipinge/icl-calc/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/386ed8d68c41f3873530/test_coverage)](https://codeclimate.com/github/ruipinge/icl-calc/test_coverage)
[![codecov](https://codecov.io/gh/ruipinge/icl-calc/branch/master/graph/badge.svg?token=XVTKUDYAU6)](https://codecov.io/gh/ruipinge/icl-calc)

An Implantable Collamer Lenses (ICL) vault size calculator available as a web application. The last working version can be found [here](https://ruipinge.github.io/icl-calc/).

## Instructions

TODO: write some instructions

![alt text](https://ruipinge.github.io/icl-calc/instructions.png)

## Development

1. Install [Node.js](https://nodejs.org/en/download/current/)
2. Clone git repository: `git clone git@github.com:ruipinge/icl-calc.git && cd icl-calc`
3. Install npm dependencies: `npm ci`
4. Run the local server: `npm start`

Run tests: `npm test` (or `npm test -- --watchAll=false` to build coverage report from scratch)

## Tech

- [JavaScript](https://www.javascript.com/), [TypeScript](https://www.typescriptlang.org/)
- [React](https://reactjs.org/), [Formik](https://formik.org/), [Yup](https://github.com/jquense/yup)
- [Jest](https://jestjs.io/)
- [Bootstrap](https://getbootstrap.com/)
- [amCharts 4: Charts](https://www.amcharts.com/javascript-charts/)
- [GitHub Actions](https://github.com/features/actions), [GitHub Pages](https://pages.github.com/)

## Data

TODO: Disclaimer: the statistical data used in this appliction is real data, blabla...

## Authors

- [Pedro Miguel Serra](https://www.linkedin.com/in/pedro-serra-44697321/), MSc, PhD
- [Rui Pinge](https://ruipinge.github.io/resume), Software Engineer

## References

[1] [Determining vault size in implantable collamer lenses: preoperative anatomy and lens parameters](https://doi.org/10.1097/j.jcrs.0000000000000146) (also available in [pdf](docs/2020-01-27_ASCRS_ESCRS_article.pdf))

[2] [Biometric and ICL-related risk factors associated to sub-optimal vaults in eyes implanted with implantable collamer lenses](https://eandv.biomedcentral.com/articles/10.1186/s40662-021-00250-6) (also available in [pdf](docs/2021-07-05_eye_and_vision_article.pdf))

## Warranty

This project is available under the [MIT License](https://github.com/ruipinge/icl-calc/blob/master/LICENSE) without any kind of warranty. The authors cannot be held responsible for any consequense of its usage.
