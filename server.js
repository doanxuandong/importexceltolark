import express from 'express';
import cors from 'cors';
import { Client } from '@larksuiteoapi/node-sdk';
import multer from 'multer';
import XLSX from 'xlsx';
import { uploadFileToOneDrive } from './onedriveService.js';
import axios from 'axios';

const app = express();
app.use(cors());
const upload = multer();

const config = {
  APP_ID: 'cli_a8c9a62f3678502f',
  APP_SECRET: 'FOX9CMtmIjuy43gV6jhoXbZhzODTofzN',
  BASE_ID: 'IMNnbLyLiaECmrsZghzluiPZgcg',
  TABLE_ID: 'tblN0tBGAH8eKxwD'
};

const client = new Client({
  appId: config.APP_ID,
  appSecret: config.APP_SECRET,
  domain: 'https://open.feishu.cn'
});

app.post('/import', upload.single('file'), async (req, res) => {
  console.log('Received import request');
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const importedBy = req.body.importedBy || 'Unknown';
    const fileName = req.file.originalname || 'Unknown';

    // Upload file lên OneDrive của công ty trực tiếp
    let oneDriveResult = null;
    let oneDriveLink = '';
    try {
      console.log('Uploading to OneDrive Business using application permissions...');
      
      // Thêm code kiểm tra site trước khi upload
      try {
        const { checkSiteTenant, uploadFileToOneDrive } = await import('./onedriveService.js');
        
        // Kiểm tra site trước
        await checkSiteTenant();

        oneDriveResult = await uploadFileToOneDrive(req.file.buffer, fileName);
        oneDriveLink = oneDriveResult.webUrl;
        console.log('✅ File uploaded to OneDrive Business:', oneDriveLink);
      } catch (err) {
        console.error('Lỗi upload OneDrive Business:', err.message);
        // Trả về lỗi cho client nếu cần
      }

      const fieldsRes = await client.bitable.appTableField.list({
        path: {
          app_token: config.BASE_ID,
          table_id: config.TABLE_ID,
        },
      });

      const tableFields = fieldsRes.data.items;
      const numberFields = ['Số lượng 1', 'Số lượng 2', 'Đơn giá'];

      for (const record of jsonData) {
        const fields = {};
        fields['Người push'] = importedBy;
        fields['Tên file'] = fileName;
        if (oneDriveLink) fields['Link file'] = oneDriveLink;

        for (const field of tableFields) {
          const excelColumn = Object.keys(record).find(
            key => key.toLowerCase() === field.field_name.toLowerCase()
          );

          if (excelColumn) {
            let value = record[excelColumn];

            if (numberFields.includes(field.field_name)) {
              const rawValue = value;
              if (typeof value === 'string') value = value.replace(/[^0-9.\-]/g, '').trim();
              value = isNaN(value) || value === '' ? null : Number(value);
              console.log(`DEBUG: ${field.field_name} | raw: ${rawValue} | parsed: ${value}`);
            } else {
              value = value !== undefined && value !== null ? String(value) : '';
            }

            fields[field.field_name] = value;
          }
        }

        try {
          const result = await client.bitable.appTableRecord.create({
            path: {
              app_token: config.BASE_ID,
              table_id: config.TABLE_ID,
            },
            data: { fields },
          });
          if (result && result.data && result.data.record_id) {
            console.log('Record added:', result.data.record_id);
          } else {
            console.log('Record added, but no record_id returned:', result);
          }
        } catch (err) {
          console.error('Error adding record:', fields);
          if (err.response) {
            console.error('Lark API error response:', JSON.stringify(err.response.data, null, 2));
          } else {
            console.error('Lark API error:', err);
          }
        }
      }

      res.json({ success: true, oneDrive: oneDriveResult });
    } catch (err) {
      console.error('❌ Error in /import:', err);
      res.status(500).json({ error: err.message });
    }
  } catch (err) {
    console.error('❌ Error in /import:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 