import { JUDGE0_URL, RAPIDAPI_KEY } from '../config/env';

export type JudgeResult = {
  judgeStatus: string;
  stdout: string;
  stderr: string;
};

// ---------------------------------------------------------------------------
// Driver injection — wraps bare function definitions so Judge0 can execute them
// ---------------------------------------------------------------------------

function wrapForExecution(sourceCode: string, languageId: number): string {
  const code = sourceCode.trim();

  // ── JavaScript / Node.js (63) ──
  if (languageId === 63) {
    // Already has stdout write → send as-is
    if (/console\.(log|info|warn|error)|process\.stdout\.write/.test(code)) {
      return code;
    }
    // Detect function name (regular or arrow)
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

  // ── Python (71) ──
  if (languageId === 71) {
    if (/\bprint\s*\(/.test(code)) {
      return code;
    }
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

  // ── C++ (54) — usually has main(), leave as-is ──
  return code;
}

// ---------------------------------------------------------------------------
// Execute on Judge0
// ---------------------------------------------------------------------------

export async function executeJudge0(
  sourceCode: string,
  languageId: number,
  stdin: string,
  expectedOutput: string,
): Promise<JudgeResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (RAPIDAPI_KEY) {
    headers['x-rapidapi-host'] = 'judge0-ce.p.rapidapi.com';
    headers['x-rapidapi-key'] = RAPIDAPI_KEY;
  }

  // Wrap bare function definitions with a stdin→stdout driver
  const wrappedCode = wrapForExecution(sourceCode, languageId);

  // Trim expected output to avoid whitespace mismatch false negatives
  const trimmedExpected = expectedOutput.trim();

  const response = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source_code: wrappedCode,
      language_id: languageId,
      stdin,
      expected_output: trimmedExpected ? trimmedExpected + '\n' : '',
    }),
  });

  const result = (await response.json()) as {
    status?: { description?: string; id?: number };
    stdout?: string | null;
    stderr?: string | null;
    compile_output?: string | null;
  };

  let judgeStatus = result.status?.description || 'Unknown';
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? result.compile_output ?? '';

  // Secondary check: if judge says Wrong Answer but trimmed output matches, override
  if (
    judgeStatus.toLowerCase().includes('wrong answer') &&
    trimmedExpected &&
    stdout.trim() === trimmedExpected
  ) {
    judgeStatus = 'Accepted';
  }

  return { judgeStatus, stdout, stderr };
}
