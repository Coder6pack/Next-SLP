# Setup

## Phạm vi

Repo này đóng gói cấu hình để kiểm tra và áp dụng có kiểm soát — không có
installer tự ghi đè máy đích. Dùng `scripts/slp.py render` để xuất một thư mục
bundle đã thay sẵn đường dẫn thật trên máy đích trước khi chép vào vị trí chạy,
và dùng `scripts/slp.py check-live` để kiểm tra drift trước/sau khi áp dụng.

## Chuẩn bị

1. Có Paseo (snapshot kiểm chứng: `0.11.2`), Codex CLI, Antigravity CLI (`agy`
   `1.5.13`), Bash, Node.js và Python 3.11+ (`tomllib`).
2. Đăng nhập Codex và Antigravity trực tiếp trên máy đích. Không đưa credential
   vào Git.
3. Chạy chẩn đoán read-only và kiểm tra test:

```sh
python3 scripts/slp.py doctor
python3 scripts/slp.py verify
python3 -m unittest discover -s tests -v
node --test tests/test_*.mjs
```

4. Render bundle đã điền sẵn `HOME`, `node`, `codex` cho máy đích (có thể truyền
   `--node-bin` và `--codex-bin` nếu cần ghi đè):

```sh
python3 scripts/slp.py render --out dist/local-bundle --home "$HOME" --force
```

## Áp dụng file từ `dist/local-bundle/`

Sao lưu các file hiện có rồi kiểm tra diff trước khi chép:

| Nguồn trong `dist/local-bundle/` | Đích trên máy |
| --- | --- |
| `codex/supervisor.config.toml` | `~/.codex/supervisor.config.toml` |
| `bin/codex-room` | `~/.local/bin/codex-room` |
| `bin/codex-room-sync` | `~/.local/bin/codex-room-sync` |
| `share/slp/paseo-projects.mjs` | `~/.local/share/slp/paseo-projects.mjs` |
| `share/slp/slp-guard.mjs` | `~/.local/share/slp/slp-guard.mjs` |
| `antigravity/agents/slp-*.md` | `~/.gemini/config/agents/` |
| `antigravity/hooks.json` | Ghép khóa `slp-role-guard` vào `~/.gemini/config/hooks.json` |
| `antigravity/mcp_config.json` | Ghép khóa `mcpServers.paseo-projects` vào `~/.gemini/config/mcp_config.json` |
| `shared/**` | `~/shared/` |

Lưu ý:
- Không ghi đè `~/shared/supervisor/supervisor_notebook.md` nếu máy đã có
  notebook thật.
- Hook `slp-role-guard` tự động **no-op (`allow`)** khi biến môi trường
  `SLP_ROLE` không được đặt, nên không ảnh hưởng tới phiên Antigravity thông
  thường ngoài Paseo SLP.
- Baseline `~/.codex/config.toml` thuộc máy đích. Khi chạy, `codex-room` tự tạo
  runtime cô lập theo từng instance ở `~/.codex-runtime/supervisor/<PASEO_AGENT_ID>/`,
  nên chạy nhiều `codex-supervisor` song song sẽ không ghi đè `callerAgentId`
  của nhau. `codex-room-sync` tự dọn các thư mục runtime cũ hơn 14 ngày
  (`SLP_RUNTIME_TTL_DAYS`, đặt `0` để tắt; hoặc dọn tay bằng `python3 scripts/slp.py prune`).
- `codex-room` có cơ chế chống đệ quy nếu `CODEX_BIN` trỏ nhầm vào `codex-room`.

## Paseo config

`dist/local-bundle/paseo/providers.json` là fragment, **không** thay thế toàn
bộ `~/.paseo/config.json`. Ghép `daemon.mcp`, `daemon.browserTools` và 4 mục
`agents.providers` vào config hiện có, giữ nguyên thiết lập mạng/relay và các
provider ngoài SLP nếu bạn vẫn dùng.

## Admission patch

Xác định thư mục server Paseo (hiển thị sẵn qua `python3 scripts/slp.py doctor`)
và kiểm tra trước khi áp dụng:

```sh
git apply --check /absolute/path/to/next-slp/patches/paseo-slp-admission.patch
```

- Nếu máy đang dùng bản patch SLP cũ hơn, reverse bản cũ trước rồi mới áp bản
  mới (không dùng `--reject` để ép một bản Paseo khác).
- Nếu sửa code server, restart Paseo khi không còn tác vụ đang chạy.

## Kiểm tra sau khi cài

- Chạy `python3 scripts/slp.py check-live` — mọi mục khớp sẽ in `[MATCH]`.
- Chạy thử `PASEO_AGENT_ID=smoke-test codex-room-sync supervisor` và kiểm tra
  `~/.codex-runtime/supervisor/smoke-test/config.toml` (xóa thư mục test sau đó).
- Chạy `paseo provider models <provider-id> --json` để đối chiếu menu.
- Thử tạo `agy-lead` → `agy-peer` đúng menu, kiểm tra từ chối model/effort ngoài
  menu, từ chối `detached` Peer, từ chối `non-SLP` agent tạo SLP role, và kiểm
  tra `agy-peer` không có Paseo tools lẫn bị `slp-guard` chặn `invoke_subagent`.
