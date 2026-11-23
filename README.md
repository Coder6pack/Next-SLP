# Next-SLP

Bộ cấu hình điều phối SLP (`Supervisor → Lead → Peer`) chạy trên Paseo, tối ưu
theo nguyên tắc **một nguồn sự thật (single source of truth)**, phân quyền cứng
ở tầng server + Antigravity `PreToolUse` hook, và phân luồng theo cỡ task
(`tiny` / `standard` / `high-risk`).

## Menu hiện tại

| Role | Provider | Model / effort |
| --- | --- | --- |
| Supervisor | `codex-supervisor` | `gpt-6.1-sol` (mặc định `medium`), `gpt-6-astra` |
| Supervisor | `agy-supervisor` | `gemini-4-neon` (`low` / `medium` / `high`, mặc định `medium`) |
| Lead | `agy-lead` | `gemini-4-neon` (`high`, mặc định), `gemini-4-hydrogen` (`high`, fallback) |
| Peer | `agy-peer` | `gemini-4-neon` (`high` / `xhigh`), `gemini-4-hydrogen` (`high` / `xhigh`) |

Menu thực tế, `env.SLP_ROLE` và `paseoTools` lấy trực tiếp từ
[paseo/providers.json](paseo/providers.json); `scripts/slp.py build` tự đồng bộ
menu vào prompt, TOML và admission patch rồi kiểm chứng chéo bằng test & CI.

## Cấu trúc thư mục

```text
prompts/                         Nguồn duy nhất của instruction 3 role (supervisor/lead/peer)
paseo/providers.json             Fragment provider + env.SLP_ROLE + menu model/effort + paseoTools
paseo/mcp/paseo-projects.mjs     MCP server read-only liệt kê project Paseo (portable)
codex/supervisor.overlay.toml    Overlay cấu hình Codex Supervisor (không lặp prompt)
codex/supervisor.config.toml     Artifact đã build từ overlay + prompts/supervisor.md
codex/bin/                       Launcher codex-room (cô lập theo PASEO_AGENT_ID) & codex-room-sync (+ tự dọn runtime cũ)
antigravity/agents/              Artifact đã build từ prompts/*.md kèm frontmatter
antigravity/hooks/               PreToolUse guard (slp-guard.mjs) chặn bypass native subagent, sửa ~/shared, git push
antigravity/hooks.json           Fragment cấu hình hook cho ~/.gemini/config/hooks.json
antigravity/mcp_config.json      Fragment MCP paseo-projects cho ~/.gemini/config/mcp_config.json
shared/                          Thư viện tham chiếu phân vùng theo đối tượng (supervisor/lead/guides)
patches/                         Admission policy (slp-delegation-policy.js) + patch Paseo 0.11.2
scripts/slp.py                   CLI: build, verify, render, doctor, check-live, prune
tests/                           Unit test consistency, admission policy, slp-guard, codex-room-sync
docs/                            Hướng dẫn cài đặt có kiểm soát & giới hạn
```

## Lệnh nhanh

```sh
# 1. Build lại các artifact từ nguồn duy nhất (sau khi sửa prompts/, providers.json, hoặc policy)
python3 scripts/slp.py build

# 2. Kiểm tra đồng bộ toàn repo + chạy toàn bộ unit test
python3 scripts/slp.py verify
python3 -m unittest discover -s tests -v
node --test tests/test_*.mjs

# 3. Chẩn đoán môi trường & kiểm tra drift so với cấu hình đang cài trên máy (read-only)
python3 scripts/slp.py doctor
python3 scripts/slp.py check-live

# 4. Render bundle sẵn đường dẫn thực cho máy đích (không tự ghi đè máy)
python3 scripts/slp.py render --out dist/local-bundle --home "$HOME" --force

# 5. Dọn thư mục ~/.codex-runtime cũ (thêm --dry-run để xem trước)
python3 scripts/slp.py prune --days 14 --dry-run
```

## Điểm cần biết

- **Phân luồng theo cỡ task:** `tiny` (1–2 file, không cần `workspace-protocol.md` hay learning note), `standard` (dùng protocol nếu có hoặc default trong brief + learning note tiếng Việt gọn 5 mục), `high-risk` (bắt buộc `workspace-protocol.md` được Human duyệt).
- **Zero Paseo Tools & Chống Protocol Leak cho Peer:** `agy-peer` đặt `paseoTools.enabled = false` (tắt toàn bộ tool điều phối Paseo, tiết kiệm schema token và chặn tận gốc việc gọi `send_agent_prompt` / `kill_agent` / `create_agent`), đồng thời prompt Peer không dẫn tới tài liệu điều phối.
- **Khóa 2 tầng (Paseo Server + Antigravity `PreToolUse` Hook):**
  - Admission Gate đọc `env.SLP_ROLE` từ `config.json`: chặn `Peer` tạo agent, chặn `non-SLP` agent tạo role SLP, khóa `Lead` chỉ tạo `agy-peer` không `detached`, khóa `Supervisor` chỉ tạo `Lead`/`Supervisor` đúng menu.
  - `slp-guard.mjs` (`PreToolUse`, chỉ kích hoạt khi có `SLP_ROLE`): chặn cứng Peer/Lead gọi native `invoke_subagent` / `define_subagent` / `swarm` / `run_workflow`, khóa `~/shared` read-only (trừ append-only `supervisor_notebook.md` cho Supervisor), và chặn `git push` / `gh pr merge` không có ủy quyền.
- **Định tuyến & chịu lỗi:** `agy-lead` có fallback `gemini-4-hydrogen/high`; Lead có rubric chọn `high`/`xhigh`, ưu tiên **cross-model review** (`neon` ↔ `hydrogen`) và quản lý context (~45% compact/rotate).
- Không chứa token, tài khoản, baseline Codex cá nhân, hay incident thật.

Đọc [docs/setup.md](docs/setup.md) và [docs/limitations.md](docs/limitations.md) trước khi áp dụng.
