import { JUDGE0_URL, RAPIDAPI_KEY } from '../config/env';

export type JudgeResult = {
  judgeStatus: string;
  stdout: string;
  stderr: string;
};

// ---------------------------------------------------------------------------
// Driver injection — wraps bare function definitions so Judge0 can execute them
// ---------------------------------------------------------------------------

/** Convert JSON-formatted stdin into plain text for compiled languages (C, C++, Java, Go, Rust, etc.) */
function preprocessStdin(stdin: string, languageId: number): string {
  // Only preprocess for compiled languages that use main() with scanf/cin
  // JS (63), TS (74), Python (71), Ruby (72) have auto-drivers that parse JSON themselves
  const compiledLangIds = [50, 51, 54, 60, 62, 73, 78, 82]; // C, C#, C++, Go, Java, Rust, Kotlin, SQL
  if (!compiledLangIds.includes(languageId)) return stdin;

  const raw = stdin.trim();
  if (!raw) return stdin;

  try {
    const parsed = JSON.parse(raw);

    // JSON array → "size\nelement1 element2 ...\n"
    if (Array.isArray(parsed)) {
      return `${parsed.length}\n${parsed.join(' ')}\n`;
    }

    // JSON object → each value on a new line
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.values(parsed).map((v) =>
        Array.isArray(v) ? `${v.length}\n${v.join(' ')}` : String(v)
      ).join('\n') + '\n';
    }

    // Primitive (number, string, bool) → just the value
    return String(parsed) + '\n';
  } catch {
    // Not JSON — pass through as-is
    return stdin;
  }
}

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

  // ── TypeScript (74) — same logic as JavaScript ──
  if (languageId === 74) {
    if (/console\.(log|info|warn|error)|process\.stdout\.write/.test(code)) {
      return code;
    }
    const fnMatch =
      code.match(/function\s+(\w+)\s*\(/) ||
      code.match(/(?:const|let|var)\s+(\w+)\s*(?::\s*\w[^=]*)?=\s*(?:\([^)]*\)|[a-zA-Z_]\w*)\s*=>/);

    if (fnMatch) {
      const fnName = fnMatch[1];
      return `${code}

// --- Judge0 auto-driver ---
const __input = require('fs').readFileSync(0, 'utf8').trim();
let __parsed: any;
try { __parsed = JSON.parse(__input); } catch (_) { __parsed = __input; }
const __result = Array.isArray(__parsed) ? ${fnName}(__parsed) : (typeof __parsed === 'object' && __parsed !== null) ? ${fnName}(...Object.values(__parsed)) : ${fnName}(__parsed);
if (__result !== undefined) console.log(typeof __result === 'object' ? JSON.stringify(__result) : __result);
`;
    }
  }

  // ── Ruby (72) — auto-driver for bare method definitions ──
  if (languageId === 72) {
    if (/\bputs\b|\bprint\b|\bp\b/.test(code) && /ARGF|STDIN|gets|readline/.test(code)) {
      return code;
    }
    const fnMatch = code.match(/def\s+(\w+)/);
    if (fnMatch) {
      const fnName = fnMatch[1];
      return `${code}

# --- Judge0 auto-driver ---
require 'json'
_raw = STDIN.read.strip
begin
  _parsed = JSON.parse(_raw)
rescue
  _parsed = _raw
end
if _parsed.is_a?(Array)
  _res = ${fnName}(_parsed)
elsif _parsed.is_a?(Hash)
  _res = ${fnName}(*_parsed.values)
else
  _res = ${fnName}(_parsed)
end
unless _res.nil?
  puts(_res.is_a?(Array) || _res.is_a?(Hash) ? JSON.generate(_res) : _res)
end
`;
    }
  }

  // ── C (50) / C++ (54) / Java (62) / Go (60) / Rust (73) / C# (51) / Kotlin (78) ──
  // These have main(), leave code as-is. stdin is preprocessed via preprocessStdin()
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

  // Preprocess stdin for compiled languages (convert JSON → plain text)
  const processedStdin = preprocessStdin(stdin, languageId);

  // Trim expected output to avoid whitespace mismatch false negatives
  const trimmedExpected = expectedOutput.trim();

  const response = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source_code: wrappedCode,
      language_id: languageId,
      stdin: processedStdin,
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
