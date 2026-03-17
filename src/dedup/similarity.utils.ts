import type { CandidateRepo } from '../github-trend-finder/github-trend-finder.types';

const NON_ALPHANUMERIC_REGEX = /[^a-z0-9]+/g;

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) {
    return 0;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / Math.sqrt(leftMagnitude * rightMagnitude);
}

export function normalizedStringSimilarity(
  left: string,
  right: string,
): number {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  if (!normalizedLeft || !normalizedRight) {
    return 0;
  }

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  const tokenScore = jaccardSimilarity(normalizedLeft, normalizedRight);
  const bigramScore = diceCoefficient(normalizedLeft, normalizedRight);

  return (tokenScore + bigramScore) / 2;
}

export function isObviousBatchDuplicate(
  left: CandidateRepo,
  right: CandidateRepo,
  threshold: number,
): boolean {
  if (normalizeText(left.url) === normalizeText(right.url)) {
    return true;
  }

  if (normalizeText(left.repoFullName) === normalizeText(right.repoFullName)) {
    return true;
  }

  const identitySimilarity = normalizedStringSimilarity(
    `${left.repoFullName} ${left.name}`,
    `${right.repoFullName} ${right.name}`,
  );
  const summarySimilarity = normalizedStringSimilarity(
    `${left.description} ${left.whyTrending}`,
    `${right.description} ${right.whyTrending}`,
  );

  return (
    identitySimilarity >= threshold ||
    (identitySimilarity >= threshold - 0.08 && summarySimilarity >= threshold)
  );
}

export function buildCandidateEmbeddingText(candidate: CandidateRepo): string {
  return [
    candidate.repoFullName,
    candidate.name,
    candidate.description,
    candidate.whyTrending,
    candidate.language ?? '',
    candidate.topics.join(' '),
  ]
    .filter(Boolean)
    .join('\n');
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(NON_ALPHANUMERIC_REGEX, ' ').trim();
}

function jaccardSimilarity(left: string, right: string): number {
  const leftTokens = new Set(left.split(' ').filter(Boolean));
  const rightTokens = new Set(right.split(' ').filter(Boolean));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  const intersectionSize = [...leftTokens].filter((token) =>
    rightTokens.has(token),
  ).length;
  const unionSize = new Set([...leftTokens, ...rightTokens]).size;

  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

function diceCoefficient(left: string, right: string): number {
  const leftBigrams = createBigrams(left);
  const rightBigrams = createBigrams(right);

  if (leftBigrams.length === 0 || rightBigrams.length === 0) {
    return 0;
  }

  let intersectionSize = 0;
  const remaining = [...rightBigrams];

  for (const bigram of leftBigrams) {
    const index = remaining.indexOf(bigram);
    if (index !== -1) {
      intersectionSize += 1;
      remaining.splice(index, 1);
    }
  }

  return (2 * intersectionSize) / (leftBigrams.length + rightBigrams.length);
}

function createBigrams(value: string): string[] {
  if (value.length < 2) {
    return [];
  }

  const bigrams: string[] = [];

  for (let index = 0; index < value.length - 1; index += 1) {
    bigrams.push(value.slice(index, index + 2));
  }

  return bigrams;
}
