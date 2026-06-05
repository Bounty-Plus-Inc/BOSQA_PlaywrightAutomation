// This is for creating new module and test scaffolds.
const {
  createTestScaffold,
  parseArgs,
  toPascalCase,
  toSlug
} = require('../add-ons/scaffold-generator/createTestScaffold');

function main() {
  const args = parseArgs(process.argv.slice(2));

  try {
    const result = createTestScaffold(args);
    console.log(`Scaffold complete for ${result.moduleLabel} / ${result.testLabel}`);
    console.log(`Guide: ${result.guidePath}`);
  } catch (error) {
    console.error(error.message);
    console.error('Usage: npm run create-scaffold -- --module "Invoices" --test "AR Invoice"');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  createTestScaffold,
  parseArgs,
  toPascalCase,
  toSlug
};
