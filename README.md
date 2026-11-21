# Next-SLP

Bản đóng gói cấu hình SLP (Supervisor → Lead → Peer) từ setup đang chạy,
không phải một bản fork Paseo hoặc một ứng dụng agent mới.

## Menu hiện tại

| Role | Provider | Model / effort |
| --- | --- | --- |
| Supervisor | `codex-supervisor` | GPT-6.1-Sol (mặc định Medium), GPT-6-Astra |
| Supervisor | `agy-supervisor` | Neon Low / Medium / High (mặc định Medium) |
| Lead | `agy-lead` | Neon High |
| Peer | `agy-peer` | Neon High / XHigh hoặc Hydrogen High / XHigh |

Menu đầy đủ và quyền tool theo provider nằm trong `paseo/providers.json`.
Đây là snapshot hiện tại, không khôi phục menu Carbon/Argon/Opus/DeepSeek cũ.

## Cây thư mục

```text
paseo/providers.json             Cấu hình fragment để ghép vào Paseo
codex/supervisor.config.toml     Overlay Supervisor; compact 300.000 tokens
codex/bin/                      Launcher và script dựng runtime Codex
antigravity/agents/             Instruction Supervisor, Lead, Peer
shared/                         Tài liệu định tuyến, protocol, audit, learning notes
patches/                        Thay đổi admission policy của Paseo đang cài
docs/setup.md                   Hướng dẫn áp dụng có kiểm soát
docs/limitations.md             Giới hạn, quyền truy cập và phụ thuộc
```

Các đường dẫn home được thay bằng `__SLP_HOME__`. Phải thay placeholder bằng
home tuyệt đối trên máy đích trước khi dùng; JSON/TOML không tự mở rộng nó.

## Điểm cần biết

- Browser tools Paseo đang tắt. Các tool khác chặn theo từng provider.
- Antigravity chạy với `--dangerously-skip-permissions`; Codex Supervisor dùng
  `danger-full-access` và `approval_policy = "never"`. Scope vẫn giới hạn bởi
  brief, nhưng instruction không phải sandbox bảo mật.
- Lead chỉ tạo Peer; Peer không tạo agent. Patch kiểm tra menu model/effort
  khi tạo qua các entry point đã sửa, không kiểm soát mọi cách chạy process.
- Mỗi task triển khai có learning note tiếng Việt trong project, Supervisor
  gửi đường dẫn và bài học cho Human.
- `shared/supervisor_notebook.md` chỉ chứa hướng dẫn và mẫu, không có incident thật.
- Không chứa token, tài khoản, baseline Codex cá nhân, lịch sử agent hoặc project.

Đọc [setup](docs/setup.md) và [limitations](docs/limitations.md) trước khi cài.
Việc tạo repo này không cài đè hay thay đổi setup gốc.
