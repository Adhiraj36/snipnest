import { JUDGE0_URL, RAPIDAPI_KEY } from '../config/env';

export type JudgeResult = {
  judgeStatus: string;
  stdout: string;
  stderr: string;
};

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

  const response = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageId,
      stdin,
      expected_output: expectedOutput,
    }),
  });

  const result = (await response.json()) as {
    status?: { description?: string };
    stdout?: string | null;
    stderr?: string | null;
    compile_output?: string | null;
  };

  return {
    judgeStatus: result.status?.description || 'Unknown',
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? result.compile_output ?? '',
  };
}
