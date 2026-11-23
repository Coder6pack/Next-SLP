# Giới hạn của bộ cấu hình

- **Phạm vi đóng gói:** Không chứa credential, baseline `~/.codex/config.toml`,
  trạng thái phiên chạy hay incident thật trong `supervisor_notebook.md`.
- **Phụ thuộc phiên bản:** Kiểm chứng trên Paseo `0.11.2` và Antigravity CLI
  `1.5.13`. Patch server có thể mất khi nâng cấp npm/Paseo và cần kiểm tra lại
  bằng `git apply --check` với đúng build.
- **Không phải sandbox bảo mật:** Admission policy kiểm soát các entry point tạo
  agent của Paseo. Nó không ngăn một tiến trình chạy `--dangerously-skip-permissions`
  hoặc `danger-full-access` gọi CLI ngoài Paseo hoặc tự dùng native tool nếu
  runtime không tắt ở tầng ngoài.
- **Ngưỡng auto-compact 300.000 tokens:** Chỉ áp dụng cho `codex-supervisor`;
  context thực tế của model vẫn là giới hạn trên. Chưa có cấu hình 300k được xác
  minh cho các role Antigravity.
- **Browser tools & disabledTools:** Browser tools tắt global trong fragment;
  danh sách `disabledTools` từng provider phản ánh đúng snapshot đã chốt.
- **Phân quyền `shared/`:** Quy tắc read-only (trừ append `supervisor_notebook.md`)
  là quy ước qua instruction, không phải quyền filesystem.
- **Phạm vi kiểm thử tự động:** Bộ test trong `tests/` kiểm chứng consistency
  toàn repo, `scripts/slp.py render`, `codex-room`/`codex-room-sync` (cô lập
  concurrent + chống đệ quy + custom port), và mọi nhánh của
  `slp-delegation-policy.js`. Chưa chạy E2E inference trực tiếp qua tài khoản
  LLM thật trong CI.
