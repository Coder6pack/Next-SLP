#!/usr/bin/env python3
import importlib.machinery
import importlib.util
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import tomllib
import unittest

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))
import slp  # noqa: E402


def load_codex_room_sync():
    script = REPO_ROOT / "codex" / "bin" / "codex-room-sync"
    loader = importlib.machinery.SourceFileLoader("codex_room_sync", str(script))
    spec = importlib.util.spec_from_loader("codex_room_sync", loader)
    module = importlib.util.module_from_spec(spec)
    loader.exec_module(module)
    return module


class SlpConsistencyTests(unittest.TestCase):
    def test_verify_passes_with_zero_errors(self):
        errors = slp.collect_verification_errors(REPO_ROOT)
        self.assertEqual(errors, [])

    def test_render_bundle_resolves_all_placeholders(self):
        with tempfile.TemporaryDirectory() as tmp:
            out_dir = Path(tmp) / "bundle"
            proc = subprocess.run(
                [
                    sys.executable,
                    str(REPO_ROOT / "scripts" / "slp.py"),
                    "render",
                    "--out",
                    str(out_dir),
                    "--home",
                    "/opt/example-home",
                    "--node-bin",
                    "/usr/local/bin/node",
                    "--codex-bin",
                    "/usr/local/bin/codex",
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(proc.returncode, 0, msg=proc.stderr)

            for path in out_dir.rglob("*"):
                if path.is_file():
                    text = path.read_text(encoding="utf-8")
                    self.assertNotIn("__SLP_", text, msg=f"Unresolved placeholder in {path}")

            providers = json.loads((out_dir / "paseo" / "providers.json").read_text(encoding="utf-8"))
            self.assertEqual(
                providers["agents"]["providers"]["codex-supervisor"]["env"]["CODEX_BIN"],
                "/usr/local/bin/codex",
            )
            codex_toml = tomllib.loads((out_dir / "codex" / "supervisor.config.toml").read_text(encoding="utf-8"))
            self.assertEqual(codex_toml["mcp_servers"]["paseo-projects"]["command"], "/usr/local/bin/node")
            self.assertEqual(
                codex_toml["mcp_servers"]["paseo-projects"]["args"],
                ["/opt/example-home/.local/share/slp/paseo-projects.mjs"],
            )
            self.assertTrue((out_dir / "bin" / "codex-room").stat().st_mode & stat.S_IXUSR)
            self.assertTrue((out_dir / "bin" / "codex-room-sync").stat().st_mode & stat.S_IXUSR)

    def test_codex_room_sync_concurrent_isolation_and_precedence(self):
        sync = load_codex_room_sync()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            canonical = root / "canonical"
            canonical.mkdir()
            (canonical / "auth.json").write_text("{}", encoding="utf-8")
            (canonical / "config.toml").write_text(
                'developer_instructions = "Personal baseline preference."\n\n'
                "[mcp_servers.paseo]\n"
                'url = "http://127.0.0.1:7777/mcp/agents?token=abc"\n\n'
                "[mcp_servers.external]\n"
                'url = "https://example.com/mcp/agents"\n',
                encoding="utf-8",
            )
            (canonical / "supervisor.config.toml").write_text(
                'approval_policy = "never"\n'
                'developer_instructions = "SLP Supervisor authoritative instructions."\n',
                encoding="utf-8",
            )

            rt1 = root / "runtime" / "sup-1"
            rt2 = root / "runtime" / "sup-2"
            cfg1 = tomllib.loads(
                sync.sync_role("supervisor", canonical=canonical, runtime=rt1, agent_id="agent-one").read_text(
                    encoding="utf-8"
                )
            )
            cfg2 = tomllib.loads(
                sync.sync_role("supervisor", canonical=canonical, runtime=rt2, agent_id="agent-two").read_text(
                    encoding="utf-8"
                )
            )

            self.assertIn("callerAgentId=agent-one", cfg1["mcp_servers"]["paseo"]["url"])
            self.assertIn("callerAgentId=agent-two", cfg2["mcp_servers"]["paseo"]["url"])
            # Ensure agent-two did not overwrite agent-one's config.
            cfg1_again = tomllib.loads((rt1 / "config.toml").read_text(encoding="utf-8"))
            self.assertIn("callerAgentId=agent-one", cfg1_again["mcp_servers"]["paseo"]["url"])
            # External host is never mutated.
            self.assertEqual(cfg1["mcp_servers"]["external"]["url"], "https://example.com/mcp/agents")
            # Overlay instructions precede baseline instructions.
            instr = cfg1["developer_instructions"]
            self.assertLess(
                instr.index("SLP Supervisor authoritative instructions."),
                instr.index("Personal baseline preference."),
            )
            self.assertTrue((rt1 / "auth.json").is_symlink())

    def test_codex_room_blocks_recursive_codex_bin(self):
        with tempfile.TemporaryDirectory() as tmp:
            home = Path(tmp)
            canonical = home / ".codex"
            canonical.mkdir()
            (canonical / "config.toml").write_text('model = "gpt-6.1-sol"\n', encoding="utf-8")
            (canonical / "supervisor.config.toml").write_text('approval_policy = "never"\n', encoding="utf-8")

            room_script = REPO_ROOT / "codex" / "bin" / "codex-room"
            env = {
                **os.environ,
                "HOME": str(home),
                "PASEO_AGENT_ID": "sup-recursion-test",
                "CODEX_BIN": str(room_script),
            }
            proc = subprocess.run(
                [str(room_script), "supervisor", "--version"],
                env=env,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(proc.returncode, 2)
            self.assertIn("refusing recursive exec", proc.stderr)


if __name__ == "__main__":
    unittest.main()
