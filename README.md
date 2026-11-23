# Next-SLP

Bộ cấu hình điều phối SLP (`Supervisor → Lead → Peer`) chạy trên Paseo, tối ưu
theo nguyên tắc **một nguồn sự thật (single source of truth)**, phân quyền ở
tầng server và phân luồng theo cỡ task (`tiny` / `standard` / `high-risk`).

## Menu hiện tại

| Role | Provider | Model / effort |
| --- | --- | --- |
| Supervisor | `codex-supervisor` | `gpt-6.1-sol` (mặc định `medium`), `gpt-6-astra` |
| Supervisor | `agy-supervisor` | `gemini-4-neon` (`low` / `medium` / `high`, mặc định `medium`) |
| Lead | `agy-lead` | `gemini-4-neon` (`high`) |
| Peer | `agy-peer` | `gemini-4-neon` (`high` / `xhigh`), `gemini-4-hydrogen` (`high` / `xhigh`) |

Menu thực tế và `disabledTools` lấy trực tiếp từ [paseo/providers.json](paseo/providers.json);
`scripts/slp.py build` tự đồng bộ menu này vào prompt và kiểm chứng chéo bằng test.

## Cấu trúc thư mục

```text
prompts/                         Nguồn duy nhất của instruction 3 role (supervisor/lead/peer)
paseo/providers.json             Fragment provider + menu model/effort + disabledTools
paseo/mcp/paseo-projects.mjs     MCP server read-only liệt kê project Paseo (portable)
codex/supervisor.overlay.toml    Overlay cấu hình Codex Supervisor (không lặp prompt)
codex/supervisor.config.toml     Artifact đã build từ overlay + prompts/supervisor.md
codex/bin/                       Launcher codex-room (cô lập theo PASEO_AGENT_ID) & codex-room-sync
antigravity/agents/              Artifact đã build từ prompts/*.md kèm frontmatter
shared/                          Thư viện tham chiếu phân vùng theo đối tượng (supervisor/lead/guides)
patches/                         Admission policy (slp-delegation-policy.js) + patch Paseo 0.11.2
scripts/slp.py                   CLI: build, verify, render (ra bundle theo máy đích), doctor
tests/                           Unit test consistency, codex-room-sync, admission policy
docs/                            Hướng dẫn cài đặt có kiểm soát & giới hạn
```

## Lệnh nhanh

```sh
# 1. Build lại các artifact từ nguồn duy nhất (sau khi sửa prompts/, providers.json, hoặc policy)
python3 scripts/slp.py build

# 2. Kiểm tra đồng bộ toàn repo + chạy unit test
python3 scripts/slp.py verify
python3 -m unittest discover -s tests -v
node --test tests/test_admission_policy.mjs

# 3. Kiểm tra môi trường máy hiện tại (read-only)
python3 scripts/slp.py doctor

# 4. Render bundle sẵn đường dẫn thực cho máy đích (không tự ghi đè máy)
python3 scripts/slp.py render --out dist/local-bundle --home "$HOME" --force
```

## Điểm cần biết

- **Phân luồng theo cỡ task:** `tiny` (1–2 file, không cần `workspace-protocol.md` hay learning note), `standard` (dùng protocol nếu có hoặc default trong brief + learning note tiếng Việt gọn 5 mục), `high-risk` (bắt buộc `workspace-protocol.md` được Human duyệt).
- **Chống Protocol Leak:** Prompt Peer không còn dẫn sang `shared/README.md` hay tài liệu điều phối của Lead/Supervisor; cấm rõ cả `create_agent` lẫn native `invoke_subagent` / `swarm`.
- **Admission Gate:** Chặn ở tầng server Paseo cho cả 4 provider SLP (`Peer` bị cấm tạo agent, `Lead` chỉ tạo được `agy-peer` không `detached`, `Supervisor` chỉ tạo được `agy-lead` hoặc `Supervisor` trong menu).
- **Bảo mật:** Antigravity chạy `--dangerously-skip-permissions`; Codex Supervisor chạy `danger-full-access` và `approval_policy = "never"`. Instruction là quy ước vận hành, không phải sandbox bảo mật.
- Không chứa token, tài khoản, baseline Codex cá nhân, hay incident thật.

Đọc [docs/setup.md](docs/setup.md) và [docs/limitations.md](docs/limitations.md) trước khi áp dụng.
