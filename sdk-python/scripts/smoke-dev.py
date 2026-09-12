import datetime
import os
import pathlib
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient


def main() -> None:
    base_url = os.environ.get("CUSTD_DEV_BASE_URL", "http://localhost:8087")
    company_slug = os.environ.get("CUSTD_DEV_COMPANY_SLUG", "test-company")
    # A process-level default is enough: one credential serves every
    # environment, so sending from dev needs no extra provisioning. Override it
    # with CUSTD_DEV_ENVIRONMENT, or per event with the event's environment.
    environment = os.environ.get("CUSTD_DEV_ENVIRONMENT", "dev")
    token = dev_token()
    client = CustdClient(
        base_url=base_url,
        token=token,
        environment=environment,
        retry={"max_attempts": 1},
    )
    response = client.ingest_event({
        "eventTypeSlug": "page-view",
        "schemaVersion": "1.0.0",
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
        "context": {
            "page": {"url": "https://example.com"},
            "device": {"type": "desktop"},
        },
        "companySlug": company_slug,
        "payload": {"source": "sdk-python-smoke"},
    })
    if int(response["status"]) >= 400:
        raise RuntimeError(f"custd sdk python smoke failed: {response['status']}")
    print(f"custd sdk python smoke OK environment={environment}")


def dev_token() -> str:
    output = subprocess.check_output(
        ["bash", "../../scripts/dev-hydra-token.sh"],
        text=True,
        stderr=subprocess.STDOUT,
    )
    token = output.strip()
    if not token:
        raise RuntimeError("get hydra token: empty token")
    return token


if __name__ == "__main__":
    main()
