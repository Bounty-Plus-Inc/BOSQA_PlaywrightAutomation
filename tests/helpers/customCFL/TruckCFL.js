// This is for shared custom CFL selection behavior.
const { selectFirstCflValue } = require('./customCflUtils');

const TRUCK_CFL_SELECTORS = {
  label: 'Truck Code',
  trigger: 'xpath=//*[@id="cfl_u_truckercode"]',
  resultColumn: 'xpath=//*[@id="col_codeT1"]',
  valueField: 'code',
  output: 'xpath=//*[@id="df_u_truckercode"]'
};

class TruckCFL {
  static async selectFirstTruck(pageOrPageObject) {
    return selectFirstCflValue(pageOrPageObject, TRUCK_CFL_SELECTORS, 'TruckCFL');
  }
}

module.exports = {
  TRUCK_CFL_SELECTORS,
  TruckCFL
};
