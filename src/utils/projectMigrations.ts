import {
  SUPPORTED_FORMAT_VERSIONS,
  STORYPLAY_EXPORT_FORMAT_VERSION,
} from "./projectSchema";

export class UnsupportedFormatVersionError extends Error {
  version: unknown;

  constructor(version: unknown) {
    super(
      `Unsupported StoryPlay format version ${version}. This app supports version ${SUPPORTED_FORMAT_VERSIONS.join(", ")}.`
    );
    this.name = "UnsupportedFormatVersionError";
    this.version = version;
  }
}

/**
 * Migrate a parsed export document to the current in-app story shape.
 * Unknown versions throw UnsupportedFormatVersionError.
 */
export function migrateStoryPlayProject(
  project: unknown
): Record<string, unknown> {
  if (!project || typeof project !== "object" || Array.isArray(project)) {
    throw new Error("Project file must be a JSON object.");
  }

  const doc = project as Record<string, unknown>;
  const version = doc.formatVersion;

  if (version === STORYPLAY_EXPORT_FORMAT_VERSION) {
    return doc;
  }

  throw new UnsupportedFormatVersionError(version);
}
