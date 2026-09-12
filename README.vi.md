# dsh-deep-whale · Bộ sưu tập giao diện Whale-Girl

[简体中文](README.md) · [English](README.en.md) · **[Tiếng Việt](README.vi.md)**

Bộ sưu tập giao diện (skin) mang chủ đề鲸鱼娘 (whale-girl) cho DeepSeek Harness Web GUI (kho phân phối độc lập).

## Xem trước

Nhấp vào ảnh để xem kích thước đầy đủ.

| Giao diện | Chế độ sáng | Chế độ tối |
|---|---|---|
| maid-atelier | [![maid-atelier chế độ sáng](maid-atelier/preview/light.webp)](maid-atelier/preview/light.webp) | [![maid-atelier chế độ tối](maid-atelier/preview/dark.webp)](maid-atelier/preview/dark.webp) |
| orca-link | [![orca-link chế độ sáng](orca-link/preview/light.png)](orca-link/preview/light.png) | [![orca-link chế độ tối](orca-link/preview/dark.png)](orca-link/preview/dark.png) |

## Các thành phần

| Giao diện | Tên package | Mô tả | Giấy phép |
|---|---|---|---|
| [maid-atelier](maid-atelier/) | `@dsh-external/dsh-client-ui-skin-maid-atelier` | Xưởng hầu biển sâu: nền hai hầu gái, giao diện ren xanh biển sâu và thanh bên chibi | MIT (code) / CC BY-NC-SA 4.0 (artwork) |
| [orca-link](orca-link/) | `@dsh-external/dsh-client-ui-skin-orca-link` | ORCA LINK: khoang cơ khí trắng ngọc, nhân vật orca-girl và tín hiệu liên kết xanh điện | MIT (code) / CC BY-NC-SA 4.0 (artwork) |
| [skin-manager](skin-manager/) | `@dsh-external/dsh-client-ui-skin-deep-whale-manager` | Trình quản lý giao diện: khám phá, chuyển đổi và tùy chỉnh theo giao diện tự khai báo | MIT |

## Chủ sở hữu bản quyền

| Chủ sở hữu | Nội dung sở hữu | Giao diện tương ứng | Trang cá nhân |
|---|---|---|---|
| 上善 (Shangshan) | Thiết kế nhân vật whale-girl gốc | maid-atelier / orca-link | [Pixiv](https://www.pixiv.net/users/62155430) · [Bilibili（上善无形）](https://b23.tv/8h5L4xz) |
| ZipZipPipe | Thiết kế lại whale-girl hầu gái với yếu tố DeepSeek | maid-atelier | [Pixiv](https://www.pixiv.net/users/18604994) · [Bilibili（ZipZipPipe）](https://b23.tv/Pnw6nG8) |

\*Vui lòng báo cáo vấn đề qua GitHub issue thay vì liên hệ trực tiếp với hai nghệ sĩ trên. Tuy nhiên, bạn vẫn có thể theo dõi các tác phẩm whale-girl của họ, cảm ơn!

## Cài đặt

### Cài đặt một dòng (khuyến nghị)

Ba package phân phối (trình quản lý + hai giao diện) được cài đặt trực tiếp dưới dạng dependency GitHub — **không cần clone**; mỗi package là một thư mục con `#path:` trong kho. Yêu cầu **pnpm ≥ 9**: cú pháp thư mục con xuất hiện từ pnpm 9, pnpm 8 sẽ hiểu `path:...` là tham chiếu commit và báo lỗi.

**Linux / macOS / WSL:**

```sh
dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/skin-manager' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/maid-atelier' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/orca-link'
```

**PowerShell** (`#` bắt đầu注释, spec phải bọc trong ngoặc kép; dùng `;` thay cho `&&`):

```powershell
dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/skin-manager'; dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/maid-atelier'; dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/orca-link'
```

Chỉ muốn dùng một giao diện thì xóa dòng không cần (khuyến nghị giữ skin-manager vì chuyển đổi và xung đột đều dựa vào nó).

Lần đầu cài đặt là thêm package mới, cần khởi động lại DSH một lần. Khi khởi động lại, skin-manager sẽ phát hiện "hai giao diện cùng bật" và **tự động hoàn nguyên về mặc định chính thức**, nên lần đầu cài sẽ không bị chồng giao diện; sau đó mở «Cài đặt → Quản lý giao diện» nhấn «Chuyển» trên giao diện mong muốn — tải lại nóng sẽ áp dụng ngay. Các lần chuyển sau không cần khởi động lại hay AI hỗ trợ.

> Lối tắt: bạn có thể thay `github:Small-tailqwq/dsh-deep-whale#path:/` bằng **thư mục clone cục bộ** (xem [Cài đặt package con độc lập](#cài-đặt-package-con-độc-lập-phát-triển-và-dự-phòng-mạng-yếu)); cài đặt GitHub một dòng và link cục bộ là hai cách tham chiếu cùng tên package, trộn lẫn thì lần `add` cuối cùng sẽ thắng.

### Cập nhật

**Linux / macOS / WSL:**

```sh
dsh plugin --profile web update @dsh-external/dsh-client-ui-skin-deep-whale-manager @dsh-external/dsh-client-ui-skin-maid-atelier @dsh-external/dsh-client-ui-skin-orca-link
```

**PowerShell** (token bắt đầu bằng `@` nên thêm ngoặc kép):

```powershell
dsh plugin --profile web update '@dsh-external/dsh-client-ui-skin-deep-whale-manager' '@dsh-external/dsh-client-ui-skin-maid-atelier' '@dsh-external/dsh-client-ui-skin-orca-link'
```

Dependency GitHub bị pnpm khóa tại commit lúc cài đặt; `update` sẽ phân giải lại commit mới nhất. Bạn cũng có thể chạy `dsh plugin --profile web update` không kèm tên package (cập nhật toàn bộ profile; tương đương nếu chỉ cài các package này). Nội dung bundle cập nhật qua tải lại nóng cấu hình; chỉ khi thêm/xóa package mới cần khởi động lại.

### Lười gõ lệnh? Để AI cài

Dán đoạn sau vào bất kỳ AI (hoặc dsh本身). [INSTALL.md](INSTALL.md) là điểm vào chuẩn: AI sẽ đọc và được dẫn đến kỹ năng `dsh-skin-install` đi kèm — cài đặt thông thường chạy cùng lệnh một dòng ở trên, còn các luồng di chuyển cũ, phát triển cục bộ, kiểm tra commit cụ thể thì theo quy trình kỹ năng (dàn xếp xung đột trước, link đường dẫn tuyệt đối, xác minh khởi động lạnh).

```
Đọc https://github.com/Small-tailqwq/dsh-deep-whale/INSTALL.md và cài đặt các giao diện từ kho này theo hướng dẫn
```

### Cơ chế xung đột giao diện (bắt buộc đọc)

- Trước hết cần phân biệt: `skin-manager` không phải giao diện mà là **trình quản lý giao diện** (cung cấp khám phá, chuyển đổi và bảng tùy chỉnh), cần bật thường trực; đối tượng xung đột là **bản thân giao diện** — trong kho này là maid-atelier và orca-link.
- Bật/tắt giao diện được kiểm soát bởi lớp patch: `~/.dsh/profiles/web/cordis.patch.yml` (lớp profile) và `~/.dsh/cordis.patch.yml` (lớp home) mỗi file có các dòng `- id: <wiring.id>` + `disabled: true/false` (**cả hai lớp đều phải viết**; lớp home ưu tiên cao hơn).
- **Giao diện không có dòng `disabled` → mặc định bật.** Nên khi chỉ cài một giao diện, nó chạy ngay; cài cả hai cùng lúc mà chưa từng chuyển đổi thì chúng sẽ **chạy đồng thời**: lớp trang trí chồng lên nhau, thanh bên/khu vực cài đặt bị lỗi. Triệu chứng điển hình: **nút cài đặt biến mất, chiều rộng/bố cục thanh bên bất thường, giao diện lộn xộn** (giao diện gốc vẫn bình thường).
- **skin-manager bảo vệ xung đột**: cài đặt một dòng đăng ký cả ba package; khi khởi động lại lần đầu, trình quản lý gộp trạng thái profile→home, phát hiện hai giao diện trở lên cùng bật → tự động hoàn nguyên về "mặc định chính thức" và ghi dòng xung đột. Lựa chọn hợp lệ (không hoặc một giao diện) không bao giờ bị ghi đè. Không cần dàn xếp thủ công trước.
- skin-manager (Cài đặt → Quản lý giao diện) sẽ tự động ghi dòng xung đột vào cả hai lớp patch khi kích hoạt; khi sửa thủ công "chỉ giữ một giao diện" phải **tường minh tắt mọi giao diện khác**.
- Khi đã cài skin-manager, các mục tùy chỉnh giao diện (như khung giờ hiển thị của "chế độ ít anime hơn") được lưu trong trình duyệt hiện tại, do trình quản lý áp dụng thống nhất.

### Cài đặt package con độc lập (phát triển và dự phòng mạng yếu)

> Người dùng thông thường không cần phần này: cài đặt GitHub một dòng nhanh hơn (không cần clone). Phần này dành cho phát triển cục bộ, kiểm tra commit cụ thể, hoặc khi mạng GitHub không khả dụng. Spec GitHub và link cục bộ tham chiếu cùng tên package — chọn một và nhất quán.

```sh
git clone --depth 1 https://github.com/Small-tailqwq/dsh-deep-whale   # clone ở bất kỳ đâu (shallow là đủ, bỏ qua lịch sử)
node <đường dẫn tuyệt đối clone>/.agents/skills/dsh-skin-install/scripts/stage-mutual-exclusion.mjs --profile web --target maid-atelier
dsh plugin --profile web add <đường dẫn tuyệt đối clone>/skin-manager   # bảng quản lý giao diện thường trực (khuyến nghị)
dsh plugin --profile web add <đường dẫn tuyệt đối clone>/maid-atelier   # Xưởng hầu biển sâu
dsh plugin --profile web add <đường dẫn tuyệt đối clone>/orca-link      # ORCA LINK
```

> Lệnh `node` đầu tiên là **tối ưu tùy chọn**: dàn đặt trước mọi `plugin add`, đặt giao diện mục tiêu là唯一 bật để lần khởi động đầu tiên đã là giao diện đó; giữ nguyên YAML không phải giao diện, không ghi đè toàn bộ patch. Bỏ qua cũng an toàn — skin-manager sẽ hoàn nguyên về mặc định khi khởi động lạnh, sau đó chuyển trong Cài đặt → Quản lý giao diện. Dùng `--target orca-link` cho ORCA LINK hoặc `--target official` cho giao diện gốc.

**Cách A (khuyến nghị): Cài đặt → Quản lý giao diện → nhấn «Chuyển» trên giao diện muốn dùng.** Trình quản lý tự động ghi dòng `disabled` xung đột vào cả hai lớp patch và tải lại nóng; chỉ cần tải lại trang.

**Cách B: Sửa thủ công cả hai lớp patch.** Thêm các dòng sau vào **cả** `~/.dsh/profiles/web/cordis.patch.yml` **và** `~/.dsh/cordis.patch.yml` (cả hai đều bắt buộc; lớp home ghi đè lớp profile):

```yaml
# Ví dụ: chỉ bật maid-atelier; đổi sang orca-link thì chuyển false sang dòng đó, chỉ một trong hai giao diện được false
- id: ui-skin-maid-atelier
  disabled: false
- id: ui-skin-orca-link
  disabled: true
- id: ui-skin-deep-whale-manager
  disabled: false
```

> Nếu file patch vẫn là template mặc định của dsh (chú thích + một dòng `[]`), hãy **thay thế toàn bộ dòng `[]` bằng danh sách trên** — "chú thích + `[]` + các mục khác" là YAML không hợp lệ, phân tích cấu hình sẽ thất bại (máy chủ giữ cấu hình cũ tiếp tục chạy; sửa file rồi tải lại).

Ví dụ Windows (dấu gẩy chéo và gẩy chéo ngược đều được; pnpm sẽ chuẩn hóa):
```powershell
dsh plugin --profile web add C:/Users/<bạn>/code/dsh-deep-whale/skin-manager
dsh plugin --profile web add C:/Users/<bạn>/code/dsh-deep-whale/maid-atelier
```

### Cài đặt quá nhiều / Giao diện lỗi怎么办

Triệu chứng: nút cài đặt biến mất, thanh bị trang trí che hoặc chiều rộng bất thường, giao diện lộn xộn (khôi phục khi tắt giao diện).

1. Mở Cài đặt → Quản lý giao diện, nhấn «Mặc định chính thức» hoặc bất kỳ giao diện nào — trình quản lý sẽ tự động ghi dòng xung đột và tải lại nóng; tải lại để khôi phục;
2. Nếu trình quản lý không khả dụng (hoặc file cấu hình đã bị hỏng): chạy `stage-mutual-exclusion.mjs` ở trên với `--target official` hoặc giao diện mong muốn để khôi phục cả hai lớp patch;
3. Hoặc đơn giản gỡ package không cần: `dsh plugin --profile web remove <package>`, sau đó kiểm tra lại dòng xung đột.

### Quy tắc đường dẫn tương đối (dễ mắc lỗi)

- Đường dẫn tương đối (bắt đầu bằng `./`, `../`) được phân giải theo **thư mục gọi lệnh dsh**, không phải thư mục kho giao diện.
- **Không bao giờ dùng tên thư mục trần**: `dsh plugin --profile web add maid-atelier` sẽ bị当作 tên package npm kéo từ registry mà 404. Hãy dùng `./maid-atelier` (khi đã ở trong thư mục kho giao diện), `../dsh-deep-whale/maid-atelier` (khi dsh-deep-whale cùng cấp), hoặc đường dẫn tuyệt đối.
- `../dsh-deep-whale/maid-atelier` sau `cd <harness>` chỉ hoạt động khi **dsh-deep-whale cùng cấp với thư mục harness**; nếu clone ở nơi khác, đường dẫn tương đối sẽ link sai vị trí (lệnh không báo lỗi nhưng giao diện không hoạt động). Không chắc thì dùng đường dẫn tuyệt đối.

### Xác minh sau cài đặt

```sh
dsh plugin --profile web list          # phải thấy ba dependency @dsh-external/dsh-client-ui-skin-*
dsh --profile web --dump-config        # dòng manager disabled: false; hai giao diện xung đột: đúng một cái false
```

> Ngay sau cài đặt một dòng, **trước khi khởi động lại lần đầu**, `--dump-config` phụ thuộc vào lớp patch của bạn: môi trường sạch thì cả hai giao diện chưa có dòng xung đột (mặc định bật — trạng thái chuyển tiếp bình thường; skin-manager sẽ ghi dòng xung đột khi khởi động lại lần đầu). Nếu lớp home đã có dòng xung đột từ lần cài trước, trạng thái đó được tái sử dụng. Sau khởi động lạnh, phải kiểm tra danh sách client trong console trình duyệt (chỉ có entry cấu hình không chứng minh bundle trình duyệt đã đăng ký). Trang HTML khởi động phải tham chiếu `/plugins/<tên package thật>/client.js` cho manager và giao diện đang bật; carrier khác nhau theo phiên bản DSH (bản cũ đặt trong JSON `window.__DSH_BOOT__`, 0.1.1rc2+ dùng thẻ `<script src>` trực tiếp), dòng lệnh sau hoạt động cho cả hai:

```js
document.documentElement.outerHTML.match(/\/plugins\/@dsh-external\/[^"'\s]+/g) ?? []
```

Kết quả phải chứa manager và package giao diện đang bật; giao diện bị tắt có thể không xuất hiện. Tải lại trình duyệt để thấy giao diện; bật/tắt giao diện qua tải lại nóng cấu hình, không cần khởi động lại dsh (chỉ khi thêm/xóa package mới cần khởi động lại).

### Bảng tra lỗi cài đặt

| Triệu chứng | Nguyên nhân | Khắc phục |
|---|---|---|
| `ERR_PNPM_FETCH_404` | Spec GitHub viết sai, mạng không khả dụng, hoặc dùng tên thư mục trần cho package con | Sao chép spec đầy đủ ở trên; dùng đường dẫn tuyệt đối cho link phát triển |
| `The matching commit...`/Không phân giải ref | **pnpm < 9**, cú pháp thư mục con `#path:` không được hỗ trợ | Nâng cấp pnpm lên ≥ 9 (`npm i -g pnpm@latest`) |
| `ERR_PNPM_EXOTIC_SUBDEP` | Cố gắng cài "package gốc/tổng hợp" mang theo Git dependency (chính sách an ninh chuỗi cung ứng pnpm 11; kho này không cung cấp package như vậy) | Cài ba package con `#path:` như ở trên |
| `pnpm not found on PATH` | Môi trường thiếu pnpm | Cài pnpm (`npm i -g pnpm`) rồi thử lại |
| Package có trong danh sách nhưng trang không hiệu ứng | Giao diện bị `disabled` (công tắc xung đột đa giao diện) hoặc trình duyệt chưa tải lại | Kiểm tra `disabled` trong `--dump-config`; tải lại trang |
| Lệnh PowerShell không hoàn thành/lỗi | `#` không ngoặc kép bị当作注释 | Luôn bọc spec trong ngoặc kép đơn |

## Người đóng góp

Cảm ơn các nhà phát triển sau đã đóng góp cho dsh-deep-whale:

<a href="https://github.com/Small-tailqwq/dsh-deep-whale/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Small-tailqwq/dsh-deep-whale" />
</a>

### PR giá trị nhưng chưa được gộp

Các PR sau xung đột với implementation upstream hiện có nên chưa được gộp, nhưng nhu cầu tính năng đã được thực hiện trong kho. Cảm ơn:

- **@yaoyiqun** — chuyển vị trí nhân vật theo model đã chọn (#15)
- **@Chartreuse310** — font serif cho khu vực hội thoại (#22)
- **@Vergemesh** — chuyển giao diện gốc/whale-girl tức thì (#27)
- **@joejojoking-cloud** — phân lớp trang trí top-trim (#26), sửa phân lớp nhân vật (#31)

> Phần này được bảo trì thủ công; cập nhật khi có PR mới như vậy.

## Giấy phép

Code thuộc dự án được cấp phép theo **MIT**; xem [LICENSE](LICENSE) for scope. Bản quyền artwork và các quyền hiện có vẫn thuộc về tác giả gốc. Toàn bộ artwork trong cả hai giao diện, bao gồm ảnh do AI tạo và AI hỗ trợ, vẫn thuộc CC BY-NC-SA 4.0; **cấm sử dụng thương mại**; xem `NOTICE` và `LICENSE-ARTWORK` của mỗi giao diện. Ảnh nhúng trong source, CSS, hoặc bundle sinh ra vẫn nằm ngoài phạm vi MIT. Tài liệu bên thứ ba giữ giấy phép áp dụng; các quyền đã cấp cho phiên bản trước không bị thu hồi.

Khung sườn giao diện bắt nguồn từ [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui); kho này chỉ phân phối giao diện hoàn chỉnh, không bao gồm khung sườn.
