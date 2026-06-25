function resolveItemCode(value, { envKey } = {}) {
  const resolvedValue = String(value || (envKey ? process.env[envKey] : '') || '').trim();
  if (!resolvedValue) {
    throw new Error(`Item Code is required. Pass a value or set ${envKey || 'the item code env variable'}.`);
  }

  return resolvedValue;
}

function getSalesItemCode(value) {
  return resolveItemCode(value, { envKey: 'BPI_SALES_ITEMCODE' });
}

function getItemCode(value) {
  return resolveItemCode(value, { envKey: 'BPI_ITEMCODE' });
}

module.exports = {
  getSalesItemCode,
  resolveItemCode,
  getItemCode
};

