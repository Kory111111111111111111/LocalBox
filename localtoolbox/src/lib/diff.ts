// Line-based LCS diff used by text-diff and diff-checker tools.
export type DiffLine = { type: "same" | "add" | "del"; text: string };

export function diffLines(a: string, b: string): DiffLine[] {
  const A = a.split("\n");
  const B = b.split("\n");
  const n = A.length;
  const m = B.length;

  // LCS table (guard against absurdly large inputs)
  if (n * m > 4_000_000) {
    // Fallback: naive same-prefix/suffix trim then mark the middle as changed
    let start = 0;
    while (start < n && start < m && A[start] === B[start]) start++;
    let endA = n - 1;
    let endB = m - 1;
    while (endA >= start && endB >= start && A[endA] === B[endB]) {
      endA--;
      endB--;
    }
    const out: DiffLine[] = [];
    for (let i = 0; i < start; i++) out.push({ type: "same", text: A[i] });
    for (let i = start; i <= endA; i++) out.push({ type: "del", text: A[i] });
    for (let j = start; j <= endB; j++) out.push({ type: "add", text: B[j] });
    for (let i = endA + 1; i < n; i++) out.push({ type: "same", text: A[i] });
    return out;
  }

  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      out.push({ type: "same", text: A[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "del", text: A[i] });
      i++;
    } else {
      out.push({ type: "add", text: B[j] });
      j++;
    }
  }
  while (i < n) out.push({ type: "del", text: A[i++] });
  while (j < m) out.push({ type: "add", text: B[j++] });
  return out;
}
