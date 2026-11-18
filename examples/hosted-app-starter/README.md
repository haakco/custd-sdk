# Hosted app starter

A small Vite + React + TypeScript app that Custd hosts. It has one counter: create it with a
name and a target, add measurements, and see a live forecast of when you will reach the target.
Share a read-only link with anyone; the page updates by itself.

It uses only the released SDK (`@haakco/custd-sdk` and `@haakco/custd-react`). There are no keys
or URLs to configure: on its Custd host the app reads `/.well-known/custd.json`.

## Four commands to a live URL

You need [`custdctl`](https://github.com/haakco/custd-downloads/releases/latest), signed in
(`custdctl login`), plus Node 24+ and pnpm.

```bash
custdctl apps create my-counter
pnpm install
pnpm build
custdctl apps deploy ./dist --app my-counter
```

`apps create` prints the app's URL, such as `https://my-counter.apps.custd.com`. After the
deploy, open it.

## What is in it

| Path | What it does |
| --- | --- |
| `src/main.tsx` | Starts the app with `CustdHostedAppProvider`. |
| `src/CreateCounter.tsx` | `/`: creates the counter, then opens its owner page. |
| `src/OwnerPage.tsx` | `/edit/c#<owner token>`: add a measurement, run the forecast, copy the share link. |
| `src/SharePage.tsx` | `/c/<share token>`: the read-only page anyone with the link can open. |
| `src/Forecast.tsx` | The live forecast (`useAppForecast`), with loading, empty, reconnecting and error states. |
| `src/links.ts` | Owner and share links (`appItemOwnerUrl`, `appItemShareUrl`). |
| `public/custd-app.json` | How Custd serves the build: `/c/` and `/edit/` fall back to `index.html`, other unknown paths get `404.html`, and `assets/**` are cached as immutable. |

The owner token stays in the URL fragment, which browsers never send to a server, so it does not
end up in request logs or page views. Anyone with the owner link can change the counter. The share
token is shown once, at create, so this browser keeps it; elsewhere, the owner page offers to
make a new share link, which turns off the old one.

## Develop and test

```bash
pnpm test        # unit test against the SDK's in-memory Custd (@haakco/custd-sdk/testing)
pnpm test:e2e    # browser journey on a local build, with every Custd call answered by the same fake
pnpm lint
pnpm typecheck
```

`pnpm dev` shows "This app can't reach Custd" because only a Custd host serves
`/.well-known/custd.json`. Use the tests or a deploy to try a change.

## Deploy from GitHub Actions

Create a credential that can deploy this one app and nothing else. Its scope is
`apps.releases.write`, and the secret is shown once:

```bash
custdctl apps credentials create --app my-counter
```

Save the `client_id` and `client_secret` as the repository secrets `CUSTD_DEPLOY_CLIENT_ID` and
`CUSTD_DEPLOY_CLIENT_SECRET`. Then add `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile && pnpm build
      - name: Install custdctl
        run: |
          curl -fsSL -o custdctl https://github.com/haakco/custd-downloads/releases/latest/download/custdctl-linux-amd64
          chmod +x custdctl
      - name: Deploy
        env:
          CUSTD_DEPLOY_CLIENT_SECRET: ${{ secrets.CUSTD_DEPLOY_CLIENT_SECRET }}
        run: |
          ./custdctl config init --profile ci --api-url "https://custd.com" \
            --issuer-url "https://auth.custd.com/" --client-id "${{ secrets.CUSTD_DEPLOY_CLIENT_ID }}" \
            --audience "custd" --scope "apps.releases.write"
          ./custdctl auth token --profile ci --client-secret-env CUSTD_DEPLOY_CLIENT_SECRET
          ./custdctl apps deploy ./dist --profile ci --app my-counter
```

Each deploy is labelled with its commit. Custd keeps the live release and the newest ten.

## Walking skeleton

`scripts/walking-skeleton.sh` checks the whole path against a running Custd. It creates the app,
builds and deploys this starter, waits until the host serves it, and then runs
`e2e/walking-skeleton.spec.ts` against the live URL. The spec creates a counter, adds three
measurements, and opens the share link in a second browser to see the forecast. Each step prints
its name. On failure the script exits non-zero and names the step that failed.

```bash
CUSTD_PROFILE=local scripts/walking-skeleton.sh           # app "s1-walking-skeleton"
APP_NAME=my-counter CUSTDCTL=./custdctl scripts/walking-skeleton.sh
```

It is safe to run again: `apps create` replays for the same caller, and each deploy is a new
release.
