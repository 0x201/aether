from __future__ import annotations

import datetime
import os
import sys
from pathlib import Path

import coverage
import pytest


def run_tests_with_coverage():
    src_path = Path(__file__).parent.parent
    test_path = src_path.parent / "test"

    src_abs_path_str = f"{src_path.absolute()}"
    test_abs_path_str = f"{test_path.absolute()}"
    cov = coverage.Coverage(
        source=[src_abs_path_str],
        omit=["*/__pycache__/*"],
        config_file=True,
    )

    print("Starting to collect coverage data...")
    cov.start()

    try:
        print("Running pytest tests...")
        exit_code = pytest.main([test_abs_path_str, "-v", "--tb=short"])

    except Exception as e:
        print(f"Encountered an error while running tests: {e}")
        exit_code = 1

    finally:
        print("Stopping to collect coverage data...")
        cov.stop()
        cov.save()

    return exit_code


def generate_coverage_reports():
    cov = coverage.Coverage()
    cov.load()

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    os.makedirs("coverage_reports", exist_ok=True)

    reports = {}

    html_dir = f"coverage_reports/htmlcov_{timestamp}"
    cov.html_report(directory=html_dir)
    reports["html"] = html_dir

    print("\n" + "=" * 50)
    print("Summary of coverage:")
    cov.report()

    print("\nReport generated:")
    for format_name, path in reports.items():
        print(f"  {format_name.upper()}: {path}")

    return reports


def main():
    exit_code = run_tests_with_coverage()

    if exit_code == 0:
        generate_coverage_reports()
    else:
        print("Failed to test, Skip coverage report generation")

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
