# Setup

## Phạm vi

Đây là bản cấu hình để xem xét và áp dụng thủ công, chưa có installer tự ghi đè
máy đích. Không chạy lại setup trên máy nguồn chỉ vì vừa clone repo.

## Chuẩn bị

1. Có Paseo, Codex CLI, Antigravity CLI (`agy`), Bash, Node.js và Python 3.11+
   (`tomllib`). Phiên bản snapshot: Paseo 0.11.2, agy 1.5.13.
2. Đăng nhập Codex và Antigravity trực tiếp trên máy đích. Không copy credential
   từ repo hoặc đưa credential vào Git.
3. Sao lưu các file đích hiện có. Dùng một bản sao ngoài Git, thay toàn bộ
   `__SLP_HOME__` bằng home tuyệt đối của máy đích rồi xem lại diff.
4. Kiểm tra binary paths. Launcher `codex-room-sync` dùng `python3` trên PATH;
   `CODEX_BIN` trong fragment chỉ ra binary Codex, không phải `codex-room`.
   Tránh đặt `CODEX_BIN` thành launcher gây đệ quy.

## Đặt file

| Nguồn repo đã render đường dẫn | Đích máy |
| --- | --- |
| `codex/supervisor.config.toml` | `~/.codex/supervisor.config.toml` |
| `codex/bin/codex-room` | `~/.local/bin/codex-room` |
| `codex/bin/codex-room-sync` | `~/.local/bin/codex-room-sync` |
| `antigravity/agents/slp-*.md` | `~/.gemini/config/agents/` |
| `shared/*` | `~/shared/` |

Đặt quyền thực thi cho hai launcher và thêm `~/.local/bin` vào PATH nếu cần.
Không ghi đè notebook hiện có: chỉ khởi tạo từ mẫu nếu máy chưa có notebook.

Baseline `~/.codex/config.toml` thuộc máy đích, không được đóng gói. Cần cấu hình
model/provider và đăng nhập ở đó. Script giữ lại guidance trong baseline rồi ghép
overlay Supervisor; kiểm tra instruction chung có xung đột trước khi sử dụng.
Các file `AGENTS.md`, `model-instructions.md`, auth, plugins và skills không nằm
trong repo này: launcher chỉ symlink những mục đã tồn tại trên máy đích. Không
copy một đường dẫn `model_instructions_file` không tồn tại từ máy khác.

## Paseo

`paseo/providers.json` là fragment, KHÔNG thay thế toàn bộ `~/.paseo/config.json`.
Ghép `daemon.mcp`, `daemon.browserTools` và bốn mục `agents.providers` vào config
hiện có, giữ lại thiết lập mạng/relay và các provider ngoài SLP của máy đích.
Nếu muốn setup chỉ có SLP, tự xác nhận và tắt provider khác riêng; fragment
không mặc định tắt toàn bộ provider của một máy mới.

## Admission patch

Patch có đường dẫn tương đối từ thư mục chứa `agent/` và `session.js` của server
Paseo, không phụ thuộc vị trí global npm của máy nguồn. Với Paseo 0.11.2,
xác định đúng thư mục server đã cài rồi kiểm tra trước:

```sh
git apply --check /absolute/path/to/next-slp/patches/paseo-slp-admission.patch
```

Chỉ áp dụng sau khi đã sao lưu và kiểm tra diff, không dùng force/reject để
ép một bản Paseo khác nhận patch. Nếu đã có patch, kiểm tra reverse thay vì
áp dụng lần hai. Mã này phụ thuộc build cụ thể, không chỉ số version.

## Kiểm tra và nạp lại

- Chạy `codex-room-sync supervisor`; xem config dựng ra trong
  `~/.codex-runtime/supervisor/config.toml`, không commit runtime đó.
- Dùng `paseo provider models <provider-id> --json` và diagnostic để đối chiếu
  menu và khả năng khởi tạo ACP. Không coi menu là bằng chứng model inference.
- Nếu chỉ ghép config, chạy `paseo reload --json` và xem có yêu cầu restart không.
  Nếu đã sửa code server, restart Paseo khi không có tác vụ đang chạy.
- Reload agent hiện có để nhận instruction mới. Không tạo project hay task
  triển khai tự động chỉ để kiểm tra cài đặt.
- Kiểm tra Lead → Peer với model/effort được phép, từ chối ngoài menu và từ
  chối Peer tạo agent. Dọn các agent kiểm tra theo lifecycle bình thường.

Không tự động push/deploy hoặc cấp scope dự án khi cài bộ cấu hình này.
