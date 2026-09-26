# dsh-deep-whale · Bộ sưu tập giao diện Whale-Girl

[简体中文](README.md) · [English](README.en.md) · **Tiếng Việt**

Bộ sưu tập giao diện (skin) mang chủ đề cô gái cá voi (whale-girl) cho DeepSeek Harness Web GUI (kho phân phối độc lập).

## Xem trước

Nhấp vào ảnh để xem kích thước đầy đủ.

| Giao diện | Chế độ sáng | Chế độ tối |
|---|---|---|
| maid-atelier | [![maid-atelier chế độ sáng](maid-atelier/preview/light.webp)](maid-atelier/preview/light.webp) | [![maid-atelier chế độ tối](maid-atelier/preview/dark.webp)](maid-atelier/preview/dark.webp) |
| orca-link | [![orca-link chế độ sáng](orca-link/preview/light.png)](orca-link/preview/light.png) | [![orca-link chế độ tối](orca-link/preview/dark.png)](orca-link/preview/dark.png) |

## Các thành phần

| Giao diện | Tên package | Mô tả | Giấy phép |
|---|---|---|---|
| [maid-atelier](maid-atelier/) | `@smalltailqwq/dsh-client-ui-skin-maid-atelier` | Xưởng hầu biển sâu: hai cô hầu gái cá voi, ren xanh biển sâu và thanh bên chibi biến DSH thành xưởng hầu gái | MIT (code) / CC BY-NC-SA 4.0 (artwork) |
| [orca-link](orca-link/) | `@smalltailqwq/dsh-client-ui-skin-orca-link` | ORCA LINK: cô bé điều hành cá voi đen cực ngầu, giao diện toàn góc vuông cùng biểu tượng vẽ lại bằng nét thẳng; chế độ sáng thực dụng, chế độ tối dịu mắt | MIT (code) / CC BY-NC-SA 4.0 (artwork) |
| [skin-manager](skin-manager/) | `@smalltailqwq/dsh-client-ui-skin-deep-whale-manager` | Trình quản lý giao diện: chuyển giữa các giao diện đã cài và điều chỉnh tùy chọn riêng của từng giao diện, trong «Cài đặt → Quản lý giao diện» | MIT |

## Chủ sở hữu bản quyền

| Chủ sở hữu | Nội dung sở hữu | Giao diện tương ứng | Trang cá nhân |
|---|---|---|---|
| 上善 (Shangshan) | Thiết kế nhân vật whale-girl gốc | maid-atelier / orca-link | [Pixiv](https://www.pixiv.net/users/62155430) · [Bilibili（上善无形）](https://b23.tv/8h5L4xz) |
| ZipZipPipe | Thiết kế lại whale-girl hầu gái với yếu tố DeepSeek | maid-atelier | [Pixiv](https://www.pixiv.net/users/18604994) · [Bilibili（ZipZipPipe）](https://b23.tv/Pnw6nG8) |

\*Vui lòng báo cáo vấn đề qua GitHub issue thay vì liên hệ trực tiếp với hai nghệ sĩ trên. Tuy nhiên, bạn vẫn có thể theo dõi các tác phẩm whale-girl của họ, cảm ơn!

## Cài đặt

> [!NOTE]
> Nếu bạn dùng dsh-web (đã cài `@linxin666/dsh-web-all`), hãy cài `maid-atelier` và `orca-link` từ trung tâm giao diện của chính dsh-web, đừng chạy các lệnh bên dưới. Hai bản được điều chỉnh riêng, cài lẫn vào cùng một profile sẽ làm giao diện hiển thị sai.

Bạn có thể cài từ npm hoặc từ GitHub. Cả hai đều là cùng một bộ giao diện, chỉ khác ở tốc độ nhận bản cập nhật:

| | npm (khuyến nghị) | GitHub |
|---|---|---|
| Nhận được gì | Các bản phát hành chính thức với số phiên bản cố định | Code mới nhất trên nhánh `main` |
| Khi nào nhận được bản sửa lỗi | Khoảng 24 giờ sau khi phát hành (pnpm đi kèm DSH chỉ cài các phiên bản đã phát hành ít nhất một ngày) | Ngay khi bản sửa được gộp |
| Mạng | Dùng được với mirror của npm registry | Cần truy cập được GitHub |

Nếu không chắc, hãy chọn npm. Chỉ cần sao chép lệnh phù hợp với shell của bạn và chạy, không cần clone kho.

**Cài từ npm**

```sh
# Linux / macOS / WSL
dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-deep-whale-manager' && dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-maid-atelier' && dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-orca-link'
```

```powershell
# PowerShell
dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-deep-whale-manager'; dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-maid-atelier'; dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-orca-link'
```

**Cài từ GitHub**

```sh
# Linux / macOS / WSL
dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/skin-manager' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/maid-atelier' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/orca-link'
```

```powershell
# PowerShell
dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/skin-manager'; dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/maid-atelier'; dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/orca-link'
```

Hai nguồn dùng cùng tên package, nên nguồn cài sau sẽ thay thế nguồn cài trước. Muốn đổi nguồn, chỉ cần chạy bộ lệnh còn lại.

Sau đó **khởi động lại DSH một lần**, mở «Cài đặt → Quản lý giao diện» và nhấn «Chuyển» trên giao diện bạn muốn. Từ đó trở đi, đổi giao diện có hiệu lực ngay, không cần khởi động lại.

- Chỉ muốn một giao diện? Bỏ phần `add` của giao diện còn lại khỏi lệnh. Nên giữ trình quản lý vì việc chuyển đổi cần đến nó.
- Nếu cài cả hai giao diện, sau lần khởi động lại đầu tiên DSH vẫn trông như mặc định chính thức. Đó là bình thường: hai giao diện chạy cùng lúc sẽ xung đột, nên trình quản lý tắt cả hai để bạn tự chọn.
- Không muốn gõ lệnh? Gửi câu sau cho bất kỳ trợ lý AI nào (hoặc chính DSH), nó sẽ cài theo [INSTALL.md](INSTALL.md):

  ```
  Đọc https://github.com/Small-tailqwq/dsh-deep-whale/INSTALL.md và cài các giao diện của kho này theo hướng dẫn
  ```

## Cập nhật

```sh
# Linux / macOS / WSL
dsh plugin --profile web update @smalltailqwq/dsh-client-ui-skin-deep-whale-manager @smalltailqwq/dsh-client-ui-skin-maid-atelier @smalltailqwq/dsh-client-ui-skin-orca-link
```

```powershell
# PowerShell
dsh plugin --profile web update '@smalltailqwq/dsh-client-ui-skin-deep-whale-manager' '@smalltailqwq/dsh-client-ui-skin-maid-atelier' '@smalltailqwq/dsh-client-ui-skin-orca-link'
```

Lệnh này dùng được cho cả hai nguồn: nguồn npm sẽ lên bản phát hành mới nhất, nguồn GitHub sẽ kéo code mới nhất trên `main`. Cập nhật xong chỉ cần tải lại trang, không cần khởi động lại DSH. Nếu profile này chỉ có các giao diện của kho, có thể chạy `dsh plugin --profile web update` để cập nhật tất cả.

## Khi gặp sự cố

**Giao diện biến mất sau khi nâng cấp DSH**

Mỗi giao diện chỉ khai báo hỗ trợ những phiên bản DSH đã được điều chỉnh (hiện là dòng 0.1.7). Khi DSH mới hơn giao diện, DSH sẽ tự tắt giao diện và trở về giao diện chính thức, tránh việc giao diện cũ che mất các điều khiển như ô nhập.

Hãy cập nhật giao diện trước. Nếu chưa có bản mới mà vẫn muốn dùng tạm bản cũ, mở «Cài đặt → Quản lý giao diện»: giao diện bị tắt sẽ được ghi chú là chưa khai báo hỗ trợ phiên bản DSH hiện tại. Nhấn «Chuyển» và xác nhận. Việc cho phép này chỉ áp dụng cho phiên bản giao diện và phiên bản DSH hiện tại, sẽ được kiểm tra lại khi một trong hai thay đổi; bạn có thể quay về «Mặc định chính thức» bất cứ lúc nào.

<details>
<summary>Cho phép bằng dòng lệnh</summary>

```sh
dsh plugin --profile web allow-version @smalltailqwq/dsh-client-ui-skin-orca-link@<phiên bản giao diện> --dsh-version <phiên bản DSH> --accept-risk
```

</details>

**Giao diện bị rối: mất nút cài đặt, thanh bên sai độ rộng, trang trí chồng lên nhau**

Thường là do hai giao diện đang chạy cùng lúc. Mở «Cài đặt → Quản lý giao diện», nhấn «Mặc định chính thức» hoặc một giao diện bất kỳ rồi tải lại trang. Nếu không mở được Cài đặt, hãy mở mục [Cơ chế loại trừ giao diện](#mutual-exclusion) bên dưới để sửa thủ công.

**Đã cài nhưng trang không thay đổi**

Hãy tải lại trình duyệt trước. Nếu vẫn không đổi, kiểm tra trong «Cài đặt → Quản lý giao diện» xem giao diện đã được bật chưa.

Xem thêm [Các lỗi cài đặt thường gặp](#install-errors) bên dưới.

## Nâng cao

Phần lớn người dùng không cần đến các mục dưới đây; hãy mở khi cần.

<details>
<summary><b>Chuyển từ phiên bản trước 0.1.3</b></summary>

Các bản cài từ GitHub trước `0.1.3` dùng tên package cũ `@dsh-external/*`. Hãy gỡ ba package này trước rồi cài lại theo mục [Cài đặt](#cài-đặt); nếu không, DSH sẽ giữ hai bản của cùng một plugin:

```sh
dsh plugin --profile web remove '@dsh-external/dsh-client-ui-skin-orca-link'
dsh plugin --profile web remove '@dsh-external/dsh-client-ui-skin-maid-atelier'
dsh plugin --profile web remove '@dsh-external/dsh-client-ui-skin-deep-whale-manager'
```

Sau đó khởi động lại DSH một lần. Giao diện bạn đã chọn và các thiết lập của nó được giữ nguyên, không bị ảnh hưởng bởi việc đổi tên.

</details>

<details>
<summary><b>Cài từ thư mục cục bộ (phát triển / thử một commit cụ thể)</b></summary>

Khi phát triển cục bộ hoặc muốn thử một commit cụ thể, hãy clone kho và cài từ các thư mục:

```sh
git clone --depth 1 https://github.com/Small-tailqwq/dsh-deep-whale
node <đường dẫn tuyệt đối tới bản clone>/.agents/skills/dsh-skin-install/scripts/stage-mutual-exclusion.mjs --profile web --target maid-atelier
dsh plugin --profile web add <đường dẫn tuyệt đối tới bản clone>/skin-manager
dsh plugin --profile web add <đường dẫn tuyệt đối tới bản clone>/maid-atelier
dsh plugin --profile web add <đường dẫn tuyệt đối tới bản clone>/orca-link
```

- Dòng `node` là tùy chọn. Nó chọn sẵn giao diện mặc định để lần khởi động đầu đã hiển thị giao diện đó; `--target` nhận `maid-atelier`, `orca-link` hoặc `official`. Bỏ qua thì lần đầu sẽ là giao diện chính thức, sau đó chuyển trong Quản lý giao diện.
- Nên dùng **đường dẫn tuyệt đối**. Trên Windows dùng dấu gạch chéo nào cũng được, ví dụ `C:/Users/<bạn>/code/dsh-deep-whale/maid-atelier`.
- Đừng chỉ ghi tên thư mục: `dsh plugin --profile web add maid-atelier` sẽ bị hiểu là tên package npm và báo lỗi 404. Đường dẫn tương đối phải bắt đầu bằng `./` hoặc `../` và được tính từ **thư mục nơi bạn chạy lệnh dsh**, không phải thư mục kho giao diện. Đường dẫn sai sẽ không báo lỗi, chỉ là giao diện không được tải.
- Thư mục cục bộ cài cùng tên package với nguồn npm và GitHub; lần `add` cuối cùng sẽ được dùng.

</details>

<details>
<summary><a name="mutual-exclusion"></a><b>Cơ chế loại trừ giao diện</b></summary>

Mỗi lúc chỉ bật được một giao diện. Trình quản lý không phải là giao diện và cần luôn được bật.

Công tắc bật/tắt của mỗi giao diện nằm trong hai tệp cấu hình: `~/.dsh/profiles/web/cordis.patch.yml` (lớp profile) và `~/.dsh/cordis.patch.yml` (lớp home, được ưu tiên hơn). Giao diện chưa có mục trong các tệp này mặc định là **bật**, nên cài cả hai mà chưa từng chuyển đổi thì chúng sẽ chạy cùng lúc và làm rối giao diện.

Trình quản lý sẽ xử lý việc này:

- Mỗi lần khởi động, nếu có từ hai giao diện trở lên đang bật, nó tắt tất cả và trở về mặc định chính thức. Nếu bạn đã chọn một giao diện thì giữ nguyên.
- Khi chuyển trong «Cài đặt → Quản lý giao diện», nó ghi công tắc vào cả hai tệp và áp dụng ngay.

Nếu không dùng được trình quản lý, hãy sửa tệp thủ công. Thêm nội dung sau vào **cả hai** tệp; đặt giao diện muốn dùng là `false`, giao diện còn lại là `true`:

```yaml
- id: ui-skin-maid-atelier
  disabled: false
- id: ui-skin-orca-link
  disabled: true
- id: ui-skin-deep-whale-manager
  disabled: false
```

Nếu tệp vẫn là mẫu mặc định của DSH (vài dòng chú thích cùng một dòng `[]`), hãy **thay** dòng `[]` bằng danh sách trên; để cả hai sẽ làm tệp không hợp lệ. Bạn cũng có thể chạy `stage-mutual-exclusion.mjs` ở mục trước để tự ghi, hoặc gỡ giao diện không dùng bằng `dsh plugin --profile web remove <tên package>`.

Thiết lập riêng của từng giao diện (ví dụ khung giờ của «chế độ bớt anime») được lưu trong trình duyệt hiện tại và do trình quản lý áp dụng.

</details>

<details>
<summary><b>Kiểm tra cài đặt</b></summary>

```sh
dsh plugin --profile web list          # phải thấy ba package @smalltailqwq/dsh-client-ui-skin-*
dsh --profile web --dump-config        # trình quản lý là disabled: false; đúng một trong hai giao diện là false
```

Ngay sau khi cài và trước khi khởi động lại, cả hai giao diện có thể hiển thị là đang bật. Điều đó bình thường; trình quản lý sẽ xử lý khi khởi động lại.

Sau khi khởi động lại, bạn có thể chạy dòng sau trong console trình duyệt để xác nhận trang đã thực sự tải script giao diện:

```js
document.documentElement.outerHTML.match(/\/plugins\/@smalltailqwq\/[^"'\s]+/g) ?? []
```

Kết quả phải có trình quản lý và giao diện đang bật; giao diện bị tắt không xuất hiện là bình thường.

</details>

<details>
<summary><a name="install-errors"></a><b>Các lỗi cài đặt thường gặp</b></summary>

| Triệu chứng | Nguyên nhân | Khắc phục |
|---|---|---|
| `ERR_PNPM_FETCH_404` | Sai tên package, không có mạng, hoặc chỉ ghi tên thư mục khi cài cục bộ | Sao chép tên package từ trang này; cài cục bộ thì dùng đường dẫn tuyệt đối |
| `The matching commit...` / không phân giải được ref | pnpm cũ hơn 9 không hỗ trợ `#path:` | Nâng cấp pnpm: `npm i -g pnpm@latest` |
| `ERR_PNPM_EXOTIC_SUBDEP` | Cài một package tổng hợp kéo thêm Git dependency (quy tắc an toàn của pnpm 11; kho này không có package như vậy) | Cài riêng ba package bằng lệnh trên trang này |
| `pnpm not found on PATH` | Chưa cài pnpm | `npm i -g pnpm` rồi thử lại |
| Đã cài nhưng trang không thay đổi | Giao diện đang tắt, hoặc trình duyệt chưa tải lại | Bật nó trong Quản lý giao diện rồi tải lại trang |
| Lệnh PowerShell bị cắt hoặc lỗi | Tên package không có dấu nháy, phần sau `#` bị coi là chú thích | Luôn bọc tên package trong dấu nháy đơn |

</details>

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
