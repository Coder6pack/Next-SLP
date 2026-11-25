#!/usr/bin/env python3
import importlib.machinery
import importlib.util
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys
import tempfile
import time
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

    def test_supervisor_heartbeat_oversight_policy_is_enforced(self):
        providers = slp.load_providers(REPO_ROOT)["agents"]["providers"]
        expected_sup_disabled = {
            "rename_workspace",
            "archive_workspace",
            "get_agent_status",
            "cancel_agent",
            "kill_agent",
            "update_agent",
            "set_agent_mode",
            "list_pending_permissions",
            "respond_to_permission",
            "list_providers",
            "inspect_provider",
            "list_models",
            "list_profiles",
            "create_schedule",
        }
        for sup_id in ("codex-supervisor", "agy-supervisor"):
            disabled = set(providers[sup_id]["paseoTools"]["disabledTools"])
            self.assertNotIn("create_heartbeat", disabled)
            self.assertNotIn("delete_heartbeat", disabled)
            self.assertTrue(expected_sup_disabled.issubset(disabled))
        lead_disabled = set(providers["agy-lead"]["paseoTools"]["disabledTools"])
        self.assertIn("create_heartbeat", lead_disabled)
        self.assertIn("delete_heartbeat", lead_disabled)
        self.assertNotIn("cancel_agent", lead_disabled)
        self.assertTrue(
            {
                "get_agent_status",
                "kill_agent",
                "update_agent",
                "set_agent_mode",
                "list_pending_permissions",
                "respond_to_permission",
            }.issubset(lead_disabled)
        )

    def test_render_bundle_resolves_all_placeholders_and_includes_hooks_and_mcp(self):
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
            self.assertEqual(
                providers["agents"]["providers"]["agy-peer"]["paseoTools"]["enabled"],
                False,
            )
            codex_toml = tomllib.loads((out_dir / "codex" / "supervisor.config.toml").read_text(encoding="utf-8"))
            self.assertEqual(codex_toml["mcp_servers"]["paseo-projects"]["command"], "/usr/local/bin/node")
            self.assertEqual(
                codex_toml["mcp_servers"]["paseo-projects"]["args"],
                ["/opt/example-home/.local/share/slp/paseo-projects.mjs"],
            )
            hooks = json.loads((out_dir / "antigravity" / "hooks.json").read_text(encoding="utf-8"))
            self.assertIn("slp-role-guard", hooks)
            mcp = json.loads((out_dir / "antigravity" / "mcp_config.json").read_text(encoding="utf-8"))
            self.assertEqual(
                mcp["mcpServers"]["paseo-projects"]["args"],
                ["/opt/example-home/.local/share/slp/paseo-projects.mjs"],
            )
            self.assertTrue((out_dir / "bin" / "codex-room").stat().st_mode & stat.S_IXUSR)
            self.assertTrue((out_dir / "bin" / "codex-room-sync").stat().st_mode & stat.S_IXUSR)
            self.assertTrue((out_dir / "share" / "slp" / "slp-guard.mjs").stat().st_mode & stat.S_IXUSR)

    def test_check_live_reports_match_when_installed_matches_bundle(self):
        with tempfile.TemporaryDirectory() as tmp:
            fake_home = Path(tmp) / "home"
            bundle = Path(tmp) / "bundle"
            slp.build_bundle(
                bundle,
                home_dir=str(fake_home.resolve()),
                node_bin="/usr/local/bin/node",
                codex_bin="/usr/local/bin/codex",
                repo_root=REPO_ROOT,
            )

            # Simulate installing the rendered bundle into fake_home.
            install_map = [
                ("codex/supervisor.config.toml", fake_home / ".codex" / "supervisor.config.toml"),
                ("bin/codex-room", fake_home / ".local" / "bin" / "codex-room"),
                ("bin/codex-room-sync", fake_home / ".local" / "bin" / "codex-room-sync"),
                ("share/slp/paseo-projects.mjs", fake_home / ".local" / "share" / "slp" / "paseo-projects.mjs"),
                ("share/slp/slp-guard.mjs", fake_home / ".local" / "share" / "slp" / "slp-guard.mjs"),
                ("antigravity/agents/slp-supervisor.md", fake_home / ".gemini" / "config" / "agents" / "slp-supervisor.md"),
                ("antigravity/agents/slp-lead.md", fake_home / ".gemini" / "config" / "agents" / "slp-lead.md"),
                ("antigravity/agents/slp-peer.md", fake_home / ".gemini" / "config" / "agents" / "slp-peer.md"),
                ("paseo/providers.json", fake_home / ".paseo" / "config.json"),
                ("antigravity/hooks.json", fake_home / ".gemini" / "config" / "hooks.json"),
                ("antigravity/mcp_config.json", fake_home / ".gemini" / "config" / "mcp_config.json"),
            ]
            for src_rel, dst in install_map:
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(bundle / src_rel, dst)

            rows = slp.collect_live_drift(
                fake_home,
                node_bin="/usr/local/bin/node",
                codex_bin="/usr/local/bin/codex",
                repo_root=REPO_ROOT,
            )
            self.assertTrue(all(status == "MATCH" for status, _ in rows), msg=rows)

            # Introducing drift in one file is immediately flagged.
            (fake_home / ".gemini" / "config" / "agents" / "slp-peer.md").write_text("stale", encoding="utf-8")
            rows_after = slp.collect_live_drift(
                fake_home,
                node_bin="/usr/local/bin/node",
                codex_bin="/usr/local/bin/codex",
                repo_root=REPO_ROOT,
            )
            self.assertTrue(any(status == "DRIFT" and "slp-peer.md" in target for status, target in rows_after))

    def test_codex_room_sync_concurrent_isolation_precedence_and_stale_prune(self):
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

            role_root = root / "runtime"
            rt1 = role_root / "sup-1"
            rt2 = role_root / "sup-2"
            stale = role_root / "sup-old"
            default_rt = role_root / "default"
            stale.mkdir(parents=True)
            default_rt.mkdir(parents=True)
            old_ts = time.time() - (30 * 86400)
            (stale / "config.toml").write_text("", encoding="utf-8")
            (default_rt / "config.toml").write_text("", encoding="utf-8")
            os.utime(stale / "config.toml", (old_ts, old_ts))
            os.utime(default_rt / "config.toml", (old_ts, old_ts))

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
            cfg1_again = tomllib.loads((rt1 / "config.toml").read_text(encoding="utf-8"))
            self.assertIn("callerAgentId=agent-one", cfg1_again["mcp_servers"]["paseo"]["url"])
            self.assertEqual(cfg1["mcp_servers"]["external"]["url"], "https://example.com/mcp/agents")
            instr = cfg1["developer_instructions"]
            self.assertLess(
                instr.index("SLP Supervisor authoritative instructions."),
                instr.index("Personal baseline preference."),
            )
            self.assertTrue((rt1 / "auth.json").is_symlink())
            # Stale instance was pruned, while default & active instances remain.
            self.assertFalse(stale.exists())
            self.assertTrue(default_rt.exists())
            self.assertTrue(rt1.exists())
            self.assertTrue(rt2.exists())

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
