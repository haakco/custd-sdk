import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const wrapper = path.join(repositoryRoot, "scripts/infisical-docker.sh");

function runStatus(authenticated = true) {
  const directory = mkdtempSync(path.join(tmpdir(), "custd-sdk-infisical-"));
  const dockerLog = path.join(directory, "docker.log");
  const docker = path.join(directory, "docker");
  writeFileSync(dockerLog, "");
  writeFileSync(
    docker,
    `#!/bin/sh
printf '%s\\n' "$*" >>"$DOCKER_LOG"
case "$*" in
  *"image inspect "*) exit 0 ;;
  *" login status "*) [ "$AUTHENTICATED" = true ] || exit 23 ;;
esac
`,
  );
  chmodSync(docker, 0o755);

  try {
    const result = spawnSync("bash", [wrapper, "status"], {
      encoding: "utf8",
      env: {
        ...process.env,
        INFISICAL_TOKEN: "",
        PATH: `${directory}:${process.env.PATH}`,
        AUTHENTICATED: String(authenticated),
        DOCKER_LOG: dockerLog,
      },
    });
    return { result, calls: readFileSync(dockerLog, "utf8").trim().split("\n") };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("status uses custd-sdk's isolated, value-free Docker profile", () => {
  const { result, calls } = runStatus();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "Custd SDK Infisical profile: authenticated\n");
  assert.equal(calls.length, 3);

  for (const call of calls.slice(1)) {
    assert.match(call, /source=custd-sdk-infisical,target=\/root\/\.infisical/u);
    assert.match(call, /source=custd-sdk-infisical-keyring,target=\/root\/infisical-keyring/u);
    assert.match(call, /INFISICAL_API_URL=https:\/\/secrets\.k8\.haak\.co\/api/u);
    assert.match(call, /INFISICAL_DISABLE_UPDATE_CHECK=true/u);
    assert.match(call, /infisical\/cli@sha256:[a-f0-9]{64}/u);
    assert.doesNotMatch(call, /docker\.sock|target=\/root\/\.ssh|\.infisical\.json/u);
  }

  assert.match(calls[1], / vault set file --silent$/u);
  assert.match(calls[2], / login status --silent$/u);
});

test("status reports only the recovery action when unauthenticated", () => {
  const { result } = runStatus(false);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(
    result.stderr,
    "Custd SDK Infisical profile: not authenticated; run: just infisical-login\n",
  );
});

test("the Justfile uses browser login rather than prompting for a password", () => {
  const justfile = readFileSync(path.join(repositoryRoot, "justfile"), "utf8");
  assert.match(justfile, /^infisical-login:\n    scripts\/infisical-docker\.sh login$/mu);
  assert.doesNotMatch(justfile, /infisical-docker\.sh login --interactive/u);
});

test("mise cannot reintroduce the retired Infisical startup loader", () => {
  const config = readFileSync(path.join(repositoryRoot, "mise.toml"), "utf8");
  assert.doesNotMatch(config, /_\.source\s*=|\.env\.infisical\.local|refresh-secrets/u);
  assert.equal(existsSync(path.join(repositoryRoot, ".mise/infisical-env.sh")), false);
});
