# Hướng dẫn cấu hình OneDrive của công ty

## Bước 1: Tạo Azure App Registration

1. Đăng nhập vào [Azure Portal](https://portal.azure.com) với tài khoản admin của công ty
2. Vào **Azure Active Directory** > **App registrations** > **New registration**
3. Điền thông tin:
   - **Name**: Excel Import to Lark (hoặc tên khác)
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Web > http://localhost:3001/auth/onedrive/callback
4. Click **Register**

## Bước 2: Lấy thông tin cần thiết

Sau khi tạo app, lưu lại các thông tin sau:

### Client ID và Tenant ID
- **Application (client) ID**: Copy từ Overview
- **Directory (tenant) ID**: Copy từ Overview

### Tạo Client Secret
1. Vào **Certificates & secrets**
2. Click **New client secret**
3. Đặt description và chọn expiration
4. **Copy secret value** (chỉ hiển thị 1 lần)

## Bước 3: Cấu hình API Permissions

1. Vào **API permissions**
2. Click **Add a permission**
3. Chọn **Microsoft Graph** > **Application permissions**
4. Thêm các permissions:
   - `Files.ReadWrite.All`
   - `Sites.ReadWrite.All`
   - `User.Read.All`
5. Click **Grant admin consent**

## Bước 4: Lấy SharePoint Site ID

### Cách 1: Sử dụng Microsoft Graph Explorer
1. Vào [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
2. Đăng nhập với tài khoản công ty
3. Chạy query: `GET https://graph.microsoft.com/v1.0/sites`
4. Tìm site ID của SharePoint site bạn muốn upload file

### Cách 2: Sử dụng PowerShell
```powershell
Connect-PnPOnline -Url "https://yourcompany.sharepoint.com/sites/yoursite"
Get-PnPSite
```

## Bước 5: Lấy Folder ID

1. Vào SharePoint site của công ty
2. Tạo hoặc chọn thư mục muốn upload file
3. Copy URL của thư mục
4. Sử dụng Microsoft Graph API để lấy folder ID:
   ```
   GET https://graph.microsoft.com/v1.0/sites/{site-id}/drive/root:/CO File
   ```

## Bước 6: Cập nhật code

Thay thế các giá trị trong file:

### onedriveService.js
```javascript
const config = {
  auth: {
    clientId: 'YOUR_COMPANY_CLIENT_ID', // Thay bằng Client ID thực
    authority: 'https://login.microsoftonline.com/YOUR_COMPANY_TENANT_ID', // Thay bằng Tenant ID thực
    clientSecret: 'YOUR_COMPANY_CLIENT_SECRET', // Thay bằng Client Secret thực
  }
};

const DEFAULT_FOLDER_ID = 'YOUR_COMPANY_FOLDER_ID'; // Thay bằng Folder ID thực
```

### onedriveAuth.js
```javascript
const clientId = 'YOUR_COMPANY_CLIENT_ID'; // Thay bằng Client ID thực
const clientSecret = 'YOUR_COMPANY_CLIENT_SECRET'; // Thay bằng Client Secret thực
const tenantId = 'YOUR_COMPANY_TENANT_ID'; // Thay bằng Tenant ID thực
```

### server.js
```javascript
const uploadUrl = `https://graph.microsoft.com/v1.0/sites/YOUR_SITE_ID/drive/root:/CO File/${req.file.originalname}:/content`;
// Thay YOUR_SITE_ID bằng Site ID thực
```

## Bước 7: Test

1. Chạy server: `npm start`
2. Truy cập: http://localhost:3001/auth/onedrive
3. Đăng nhập với tài khoản công ty
4. Test upload file

## Lưu ý quan trọng

1. **Admin Consent**: Cần admin của công ty approve permissions
2. **Site Permissions**: Đảm bảo app có quyền truy cập SharePoint site
3. **Folder Permissions**: Đảm bảo thư mục đích có quyền write
4. **Security**: Không commit client secret vào git, sử dụng environment variables

## Troubleshooting

### Lỗi 403 Forbidden
- Kiểm tra API permissions đã được grant admin consent
- Kiểm tra site và folder permissions

### Lỗi 401 Unauthorized
- Kiểm tra client ID, tenant ID, client secret
- Kiểm tra redirect URI đúng

### Lỗi 404 Not Found
- Kiểm tra site ID và folder ID đúng
- Kiểm tra đường dẫn thư mục tồn tại 