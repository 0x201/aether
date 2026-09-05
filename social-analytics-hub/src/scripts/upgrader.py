"""
Interactive dependency updater for uv with table display.
Features: arrow keys, Space to toggle, 'a' to select all, Enter to confirm.
"""

import json
import subprocess
import sys
import tomllib

import questionary


def get_project_dependencies(pyproject_path: str = "pyproject.toml") -> set[str]:
    try:
        with open(pyproject_path, "rb") as f:
            data = tomllib.load(f)
    except FileNotFoundError:
        print(f"❌ {pyproject_path} not found. Are you in the project root?")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Failed to parse {pyproject_path}: {e}")
        sys.exit(1)

    project = data.get("project", {})
    dependencies = project.get("dependencies", [])
    pkg_names = set()
    for dep in dependencies:
        pkg = dep.split()[0]
        if "[" in pkg:
            pkg = pkg.split("[")[0]
        pkg = pkg.strip()
        if pkg:
            pkg_names.add(pkg)
    return pkg_names


def get_outdated_packages() -> list[dict]:
    try:
        result = subprocess.run(
            ["uv", "pip", "list", "--outdated", "--format=json"],
            capture_output=True,
            text=True,
            check=True,
        )
        data = json.loads(result.stdout)
        if isinstance(data, list):
            all_outdated = data
        elif isinstance(data, dict) and "installed" in data:
            all_outdated = data["installed"]
        else:
            print("❌ Unexpected output format from uv.")
            return []
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to run uv: {e.stderr}")
        sys.exit(1)
    except json.JSONDecodeError:
        print("❌ Failed to parse uv output. Ensure your uv supports --format=json")
        sys.exit(1)

    direct_deps = get_project_dependencies()
    filtered = [pkg for pkg in all_outdated if pkg["name"] in direct_deps]
    return filtered


def upgrade_package(pkg_name: str, dry_run: bool = False):
    if dry_run:
        print(f"  [DRY-RUN] Would run: uv add --upgrade {pkg_name}")
        return
    try:
        subprocess.run(["uv", "add", "--upgrade", pkg_name], check=True)
        print(f"✅ {pkg_name} upgraded successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to upgrade {pkg_name}: {e}")


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Interactively upgrade Python packages in a uv environment"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without actually upgrading",
    )
    args = parser.parse_args()

    outdated = get_outdated_packages()
    if not outdated:
        print("🎉 No outdated packages found")
        return

    rows = []
    for pkg in outdated:
        name = pkg["name"]
        current = pkg.get("version", "?")
        latest = pkg.get("latest_version", "?")
        rows.append((name, current, latest))

    max_name_len = max((len(r[0]) for r in rows), default=0)
    max_cur_len = max((len(r[1]) for r in rows), default=0)
    max_latest_len = max((len(r[2]) for r in rows), default=0)

    name_width = max(max_name_len, 25)
    cur_width = max(max_cur_len, 12)
    latest_width = max(max_latest_len, 12)

    choices = []
    for name, current, latest in rows:
        label = (
            f"{name:<{name_width}}  {current:<{cur_width}}  →  {latest:<{latest_width}}"
        )
        choices.append(questionary.Choice(title=label, value=name, checked=False))

    header = f"{'Package':<{name_width}}  {'Current':<{cur_width}}  →  {'Latest':<{latest_width}}"
    print("\n" + header)
    print("-" * len(header))
    print("(Use ↑↓ to move, Space to toggle, 'a' to select all, Enter to confirm)\n")

    selected = questionary.checkbox(
        "Select packages to upgrade:",
        choices=choices,
    ).ask()

    if selected is None:
        print("Cancelled.")
        return
    if not selected:
        print("No packages selected, exiting.")
        return

    print(f"\nWill upgrade: {', '.join(selected)}")
    if not args.dry_run:
        confirm = questionary.confirm("Proceed with upgrade?").ask()
        if not confirm:
            print("Upgrade cancelled.")
            return

    for pkg in selected:
        upgrade_package(pkg, dry_run=args.dry_run)

    if args.dry_run:
        print("🔍 Dry run completed – no packages were actually upgraded")
    else:
        print("✨ All selected packages have been upgraded")


if __name__ == "__main__":
    main()
