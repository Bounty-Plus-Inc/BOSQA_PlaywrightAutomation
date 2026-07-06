function getValue(value, envKey, label = envKey) {
  const resolved = String(value ?? process.env[envKey] ?? '').trim();

  if (!resolved) {
    throw new Error(`${label} is required. Pass a value or set ${envKey}.`);
  }

  return resolved;
}

module.exports = { getValue };