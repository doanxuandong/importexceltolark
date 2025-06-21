// File cấu hình mẫu cho OneDrive của công ty
// Copy file này thành config.js và điền thông tin thực

export const onedriveConfig = {
  // Thông tin Azure App Registration
  clientId: 'YOUR_COMPANY_CLIENT_ID', // Application (client) ID từ Azure Portal
  clientSecret: 'YOUR_COMPANY_CLIENT_SECRET', // Client Secret từ Azure Portal
  tenantId: 'YOUR_COMPANY_TENANT_ID', // Directory (tenant) ID từ Azure Portal
  
  // Thông tin SharePoint Site
  siteId: 'YOUR_SHAREPOINT_SITE_ID', // Site ID từ Microsoft Graph API
  siteUrl: 'https://yourcompany.sharepoint.com/sites/yoursite', // URL của SharePoint site
  
  // Thông tin thư mục đích
  folderName: 'CO File', // Tên thư mục trong SharePoint
  folderId: 'YOUR_FOLDER_ID', // Folder ID (optional, có thể để trống)
  
  // Redirect URI cho OAuth
  redirectUri: 'http://localhost:3001/auth/onedrive/callback'
};

// Cách lấy thông tin:
// 1. Client ID, Client Secret, Tenant ID: Từ Azure Portal > App registrations
// 2. Site ID: Chạy script getSharePointInfo.js
// 3. Folder ID: Chạy script getSharePointInfo.js hoặc để trống (sẽ tự động tạo thư mục)

// Lưu ý: Không commit file config.js vào git, chỉ commit file example này 