declare global {
  const BOTCONNECTOR_VERSION: string
  const BOTCONNECTOR_CHANNEL: string
  const BOTCONNECTOR_PLUGIN_VERSION: string
  const OPENCODE_VERSION: string
  const OPENCODE_CHANNEL: string
  const OPENCODE_PLUGIN_VERSION: string
}

export const InstallationVersion =
  typeof BOTCONNECTOR_VERSION === "string"
    ? BOTCONNECTOR_VERSION
    : typeof OPENCODE_VERSION === "string"
      ? OPENCODE_VERSION
      : "local"
export const InstallationChannel =
  typeof BOTCONNECTOR_CHANNEL === "string"
    ? BOTCONNECTOR_CHANNEL
    : typeof OPENCODE_CHANNEL === "string"
      ? OPENCODE_CHANNEL
      : "local"
export const InstallationLocal = InstallationChannel === "local"
export const PluginCompatibilityVersion =
  typeof BOTCONNECTOR_PLUGIN_VERSION === "string"
    ? BOTCONNECTOR_PLUGIN_VERSION
    : typeof OPENCODE_PLUGIN_VERSION === "string"
      ? OPENCODE_PLUGIN_VERSION
      : InstallationVersion
