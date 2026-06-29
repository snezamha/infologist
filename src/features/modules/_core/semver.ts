type SemanticVersion = {
  major: number;
  minor: number;
  patch: number;
  prerelease: readonly (number | string)[];
};

const semanticVersionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?$/;

export function parseSemanticVersion(value: string): SemanticVersion | null {
  const match = semanticVersionPattern.exec(value);
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]
      ? match[4]
          .split(".")
          .map((part) => (/^\d+$/.test(part) ? Number(part) : part))
      : [],
  };
}

function comparePrereleaseIdentifiers(
  left: number | string,
  right: number | string,
) {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  if (typeof left === "number") return -1;
  if (typeof right === "number") return 1;
  return left.localeCompare(right);
}

export function compareSemanticVersions(left: string, right: string) {
  const leftVersion = parseSemanticVersion(left);
  const rightVersion = parseSemanticVersion(right);
  if (!leftVersion || !rightVersion) {
    throw new Error(`Invalid semantic version comparison: ${left}, ${right}`);
  }

  const coreDifference =
    leftVersion.major - rightVersion.major ||
    leftVersion.minor - rightVersion.minor ||
    leftVersion.patch - rightVersion.patch;
  if (coreDifference !== 0) return coreDifference;

  const leftPrerelease = leftVersion.prerelease;
  const rightPrerelease = rightVersion.prerelease;
  if (leftPrerelease.length === 0 && rightPrerelease.length === 0) return 0;
  if (leftPrerelease.length === 0) return 1;
  if (rightPrerelease.length === 0) return -1;

  const length = Math.max(leftPrerelease.length, rightPrerelease.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = leftPrerelease[index];
    const rightPart = rightPrerelease[index];
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;
    const difference = comparePrereleaseIdentifiers(leftPart, rightPart);
    if (difference !== 0) return difference;
  }

  return 0;
}
