// This is for shared custom CFL selection behavior.
const { selectFirstCflValue } = require('./customCflUtils');

const PLATE_NUMBER_CFL_SELECTORS = {
  label: 'Plate Number',
  trigger: 'xpath=//*[@id="cfl_u_plateno"]',
  resultColumn: 'xpath=//*[@id="col_u_platenoT1"]',
  valueField: 'u_plateno',
  output: 'xpath=//*[@id="df_u_plateno"]'
};

class PlateNumberCFL {
  static async selectFirstPlateNumber(pageOrPageObject) {
    return selectFirstCflValue(
      pageOrPageObject,
      PLATE_NUMBER_CFL_SELECTORS,
      'PlateNumberCFL'
    );
  }
}

module.exports = {
  PLATE_NUMBER_CFL_SELECTORS,
  PlateNumberCFL
};
