const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const sourceRoot = path.join(__dirname, '..', 'src', 'features', 'service-orders');
const cache = new Map();
function loadModule(name) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(sourceRoot, `${name}.ts`), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(
    compiled,
    {
      module,
      exports: module.exports,
      require: (id) => {
        if (id === './model') return loadModule('model');
        throw new Error(`Unexpected import: ${id}`);
      },
      Date,
      Math,
      String,
      Number,
      Set,
      Array,
      Object,
    },
    { filename: name },
  );
  cache.set(name, module.exports);
  return module.exports;
}

const { createEmptyServiceEntry, createEmptyDisassemblyChecklist } = loadModule('model');
const { getMissingServiceEntryFields } = loadModule('validation');

function prepared() {
  return {
    ...createEmptyServiceEntry(),
    orderType: 'Cilindro hidráulico',
    disassemblyOperator: 'Mecânico',
    cylinderInternalDiameter: '80',
    cylinderExternalDiameter: '95',
    cylinderLength: '500',
    cylinderStroke: '300',
    cylinderRodDiameter: '50',
    cylinderOptionalItems: ['Haste'],
    disassemblyChecklist: createEmptyDisassemblyChecklist(['Haste']),
  };
}

test('new orders have no fictitious disassembly time', () => {
  assert.equal(createEmptyServiceEntry().disassemblyStartedAt, '');
});

test('dimensions, components and start are required before advancing', () => {
  const form = prepared();
  form.cylinderStroke = '';
  assert.ok(getMissingServiceEntryFields(form, 2).includes('Curso do cilindro'));
  assert.ok(getMissingServiceEntryFields(form, 2).includes('início da desmontagem'));
  form.cylinderStroke = '300';
  form.cylinderOptionalItems = [];
  assert.ok(getMissingServiceEntryFields(form, 2).includes('componentes do cilindro'));
});

test('only confirmed selected components complete the checklist', () => {
  const form = prepared();
  form.disassemblyTimingVersion = 1;
  form.disassemblyComplete = true;
  form.disassemblyChecklist[0].status = 'Conforme';
  assert.ok(getMissingServiceEntryFields(form, 2).includes('Haste: confirmação'));
  form.disassemblyChecklist[0].confirmedAt = '2026-01-01T12:00:00+00:00';
  assert.equal(getMissingServiceEntryFields(form, 2).length, 0);
});

test('legacy advanced orders and non-cylinder orders need no new checklist', () => {
  assert.equal(getMissingServiceEntryFields({ ...prepared(), stage: 'orcamento', disassemblyOperator: '' }, 2).length, 0);
  assert.equal(getMissingServiceEntryFields({ ...prepared(), orderType: 'Acumulador' }, 2).length, 0);
});
