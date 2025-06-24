/**
 * @type {import('knip/dist/types').Config}
 */
const config = {
  // ─── WHAT TO SCAN ─────────────────────────────────────────────────────────────
  entry: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "utils/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
  project: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "utils/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],

  // ─── IGNORE SPECIFIC FILES ─────────────────────────────────────────────────────
  // don’t report issues in your own config
  ignore: ["knip.config.ts"],

  // ─── IGNORE DEPENDENCIES YOU KNOW YOU NEED ────────────────────────────────────
  // Knip will not report these as “unused”
  ignoreDependencies: [],

  // ─── ONLY REPORT UNUSED FILES & EXPORTS ────────────────────────────────────────
  // these flags are CLI‐only, so you’ll still pass them on the command line:
  //   --fail-on-unused
  //   --detect-unused-exports

  // ─── TREAT DEV‐DEPS AS ALWAYS USED ──────────────────────────────────────────────
  // Knip doesn’t have an 'ignoreDevDependencies' root key; instead you disable
  // the devDependencies issue type:
  rules: {
    // turn off the “unused devDependencies” check
    devDependencies: "off",
  },
};

export default config;
