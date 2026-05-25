const { LoginPage } = require('../pages/base/LoginPage');

/**
 * Compatibility helper for existing tests.
 * Prefer using LoginPage directly in new specs.
 */
async function login(
  page,
  userId = process.env.BPI_USERID || 'playwrightAut',
  password = process.env.BPI_PASSWORD || 'playwrightPass'
) {
  const loginPage = new LoginPage(page);
  return loginPage.loginAs(userId, password);
}

module.exports = { login };
