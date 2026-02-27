/**
 * Quick Judge0 test — run with: npx tsx test-judge0.ts
 * Tests that bare JS functions execute correctly with the auto-driver wrapper.
 */
import 'dotenv/config';

const JUDGE0_URL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

// Mirrors the wrapForExecution logic from judge0.ts
function wrapForExecution(sourceCode: string, languageId: number): string {
  const code = sourceCode.trim();

  if (languageId === 63) {
    if (/console\.(log|info|warn|error)|process\.stdout\.write/.test(code)) {
      return code;
    }
    const fnMatch =
      code.match(/function\s+(\w+)\s*\(/) ||
      code.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[a-zA-Z_]\w*)\s*=>/);
    if (fnMatch) {
      const fnName = fnMatch[1];
      return `${code}

// --- Judge0 auto-driver ---
const __input = require('fs').readFileSync(0, 'utf8').trim();
let __parsed;
try { __parsed = JSON.parse(__input); } catch (_) { __parsed = __input; }
const __result = Array.isArray(__parsed) ? ${fnName}(__parsed) : (typeof __parsed === 'object' && __parsed !== null) ? ${fnName}(...Object.values(__parsed)) : ${fnName}(__parsed);
if (__result !== undefined) console.log(typeof __result === 'object' ? JSON.stringify(__result) : __result);
`;
    }
  }

  if (languageId === 71) {
    if (/\bprint\s*\(/.test(code)) return code;
    const fnMatch = code.match(/def\s+(\w+)\s*\(/);
    if (fnMatch) {
      const fnName = fnMatch[1];
      return `${code}

# --- Judge0 auto-driver ---
import sys, json as _json
_raw = sys.stdin.read().strip()
try:
    _parsed = _json.loads(_raw)
except Exception:
    _parsed = _raw
if isinstance(_parsed, list):
    _res = ${fnName}(_parsed)
elif isinstance(_parsed, dict):
    _res = ${fnName}(**_parsed)
else:
    _res = ${fnName}(_parsed)
if _res is not None:
    print(_json.dumps(_res) if isinstance(_res, (list, dict)) else _res)
`;
    }
  }

  return code;
}

async function submit(
  label: string,
  sourceCode: string,
  languageId: number,
  stdin: string,
  expectedOutput: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (RAPIDAPI_KEY) {
    headers['x-rapidapi-host'] = 'judge0-ce.p.rapidapi.com';
    headers['x-rapidapi-key'] = RAPIDAPI_KEY;
  }

  const wrapped = wrapForExecution(sourceCode, languageId);
  const trimmedExpected = expectedOutput.trim();

  console.log(`\n── ${label} ──`);
  console.log('Wrapped code:\n', wrapped);
  console.log('stdin:', stdin, '| expected:', trimmedExpected);

  const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source_code: wrapped,
      language_id: languageId,
      stdin,
      expected_output: trimmedExpected ? trimmedExpected + '\n' : '',
    }),
  });

  const json = await res.json();
  console.log('Status:', json.status?.description, '| stdout:', JSON.stringify(json.stdout), '| stderr:', JSON.stringify(json.stderr || json.compile_output));

  let status = json.status?.description || 'Unknown';
  if (
    status.toLowerCase().includes('wrong answer') &&
    trimmedExpected &&
    (json.stdout ?? '').trim() === trimmedExpected
  ) {
    status = 'Accepted (override)';
  }
  console.log('Final:', status);
  return status;
}

async function main() {
  if (!RAPIDAPI_KEY) {
    console.error('RAPIDAPI_KEY not set in .env');
    process.exit(1);
  }

  console.log('Using Judge0 URL:', JUDGE0_URL);

  // ── Test 1: bare JS function (the broken case) ──
  await submit(
    'JS bare function',
    `function sumArray(arr) {\n  return arr.reduce((sum, a) => sum + a, 0);\n}`,
    63,
    '[1,2,3,4,5]',
    '15',
  );

  // ── Test 2: JS arrow function ──
  await submit(
    'JS arrow function',
    `const reverseStr = (s) => s.split('').reverse().join('');`,
    63,
    '"hello"',
    'olleh',
  );

  // ── Test 3: JS code that already has console.log (should NOT wrap) ──
  await submit(
    'JS with console.log',
    `const input = require('fs').readFileSync(0, 'utf8').trim();\nconst arr = JSON.parse(input);\nconsole.log(arr.reduce((s,a)=>s+a, 0));`,
    63,
    '[1,2,3,4,5]',
    '15',
  );

  // ── Test 4: Python bare function ──
  await submit(
    'Python bare function',
    `def sum_list(arr):\n    return sum(arr)`,
    71,
    '[1,2,3,4,5]',
    '15',
  );

  // ── Test 5: Python with print (should NOT wrap) ──
  await submit(
    'Python with print',
    `import sys, json\narr = json.loads(sys.stdin.read().strip())\nprint(sum(arr))`,
    71,
    '[1,2,3,4,5]',
    '15',
  );

  console.log('\n✅ All tests complete');
}

main().catch(console.error);
