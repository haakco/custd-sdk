import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
import tomllib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class PackagingTest(unittest.TestCase):
    """Guards the published artifact.

    The SDK is fully type-hinted, but without a PEP 561 ``py.typed`` marker
    (and its inclusion in package data) consumers' type checkers silently
    ignore those types.
    """

    def test_py_typed_marker_present(self) -> None:
        marker = ROOT / "src" / "custd" / "py.typed"
        self.assertTrue(marker.is_file(), "missing PEP 561 py.typed marker")

    def test_py_typed_declared_in_package_data(self) -> None:
        config = tomllib.loads((ROOT / "pyproject.toml").read_text())
        package_data = config["tool"]["setuptools"]["package-data"]
        self.assertIn("py.typed", package_data.get("custd", []))

    def test_clean_package_import_exposes_file_queue_storage(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            shutil.copytree(ROOT / "src" / "custd", pathlib.Path(directory) / "custd")
            environment = {**os.environ, "PYTHONPATH": directory}
            subprocess.run(
                [
                    sys.executable,
                    "-c",
                    "from custd import BatchRequestError, FileQueueStorage, QueueFullError; "
                    "assert BatchRequestError and FileQueueStorage and QueueFullError",
                ],
                check=True,
                env=environment,
            )


if __name__ == "__main__":
    unittest.main()
