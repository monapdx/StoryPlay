import {
  SUPPORTED_FORMAT_VERSIONS,
  STORYPLAY_EXPORT_FORMAT_VERSION,
} from "./projectSchema";

export class UnsupportedFormatVersionError extends Error {
  /** @param {number} version */
  constructor(version) {
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
 *
 * @param {unknown} project
 * @returns {Record<string, unknown>}
 */
export function migrateStoryPlayProject(project) {
  if (!project || typeof project !== "object" || Array.isArray(project)) {
    throw new Error("Project file must be a JSON object.");
  }

  const version = project.formatVersion;

  if (version === STORYPLAY_EXPORT_FORMAT_VERSION) {
    return project;
  }

  throw new UnsupportedFormatVersionError(version);
}
