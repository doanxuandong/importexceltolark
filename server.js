import express from 'express';
import cors from 'cors';
import { Client } from '@larksuiteoapi/node-sdk';
import multer from 'multer';
import XLSX from 'xlsx';
import { uploadFileToOneDrive } from './onedriveService.js';
import axios from 'axios';
import path from 'path';

const app = express();
app.use(cors());
const upload = multer();

const config = {
  // APP_ID: 'cli_a8c9a62f3678502f',
  // APP_SECRET: 'FOX9CMtmIjuy43gV6jhoXbZhzODTofzN',
  // BASE_ID: 'IMNnbLyLiaECmrsZghzluiPZgcg',
  // TABLE_ID: 'tblN0tBGAH8eKxwD', // Table MC
  // TABLE_ID_IOB: 'tblnIlyyUueUcncn', // Table IOB
  // LOG_TABLE_ID: 'tbl9rN0qFHIDH7Ni' // ID bảng QL_Upload_CO
  APP_ID: 'cli_a8d1d3d6fab9502f',
  APP_SECRET: 'dJcelL8Hytv2WZJ2qxHV6gJDL88iuByQ',
  BASE_ID: 'DYiQb5CKVa5fmKsklj8l6eHQgag',
  TABLE_ID: 'tblxMAklt5S0uYZ0',
  TABLE_ID_IOB: 'tblOX7VzZ3jRz4wn',
  LOG_TABLE_ID: 'tblVzecxglJ9QArO',
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
    const projectCode = req.body.projectCode || '';
    const codeType = req.body.codeType || 'MC'; // Lấy loại mã code từ frontend
    const originalFileName = req.file.originalname || 'Unknown';

    // Xác định table ID dựa trên codeType
    const targetTableId = codeType === 'IOB' ? config.TABLE_ID_IOB : config.TABLE_ID;
    console.log(`Using table for ${codeType}: ${targetTableId}`);

    // Tạo tên file với timestamp để tránh trùng tên trên OneDrive
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${day}${month}${year}${hours}${minutes}`;
    
    const fileExtension = path.extname(originalFileName);
    const fileNameWithoutExt = path.basename(originalFileName, fileExtension);
    const fileName = `${fileNameWithoutExt} ${timestamp}${fileExtension}`;

    let oneDriveLink = '';
    try {
      console.log('Uploading to OneDrive Business...');
      const { uploadFileToOneDrive } = await import('./onedriveService.js');
      const oneDriveResult = await uploadFileToOneDrive(req.file.buffer, fileName);
      oneDriveLink = oneDriveResult.webUrl;
      console.log('✅ File uploaded to OneDrive Business:', oneDriveLink);
    } catch (err) {
      console.error('Lỗi upload OneDrive Business:', err.message);
      // Tiếp tục thực thi ngay cả khi upload lỗi, oneDriveLink sẽ là chuỗi rỗng
    }
    
    
    // 1. Tạo một bản ghi duy nhất trong bảng Log
    console.log('Creating log entry...');
    const logRecordRes = await client.bitable.appTableRecord.create({
        path: {
            app_token: config.BASE_ID,
            table_id: config.LOG_TABLE_ID,
        },
        data: {
            fields: {
                'Tên người upload': importedBy,
                'Tên file': fileName, 
                'Link File': oneDriveLink,
                'Mã dự án': projectCode,
            }
        }
    });

    const logRecordId = logRecordRes.data.record.record_id;
    console.log(`✅ Created log entry with record ID: ${logRecordId}`);

    // Thêm kiểm tra để đảm bảo có logRecordId
    if (!logRecordId) {
        throw new Error('Failed to create log entry or retrieve its ID.');
    }

    // 2. Chuẩn bị dữ liệu để thêm hàng loạt vào bảng chính
    const fieldsRes = await client.bitable.appTableField.list({
      path: {
        app_token: config.BASE_ID,
        table_id: targetTableId, // Sử dụng table ID tương ứng
      },
    });

    const tableFields = fieldsRes.data.items;
    const numberFields = ['Số lượng 1', 'Số lượng 2', 'Đơn giá'];
    
    // Ánh xạ các hàng từ Excel sang định dạng bản ghi của Lark
    const recordsToCreate = jsonData.map(excelRow => {
        const fields = {};
        // Trường liên kết: truyền mảng record_id
        fields['Mã dự án'] = [logRecordId];

        // 2. Xử lý các trường còn lại từ file Excel
        for (const excelHeader in excelRow) {
            // Tìm trường tương ứng trong bảng Lark (không phân biệt chữ hoa/thường)
            const larkField = tableFields.find(f => f.field_name.toLowerCase() === excelHeader.toLowerCase());

            // Nếu tìm thấy trường tương ứng và đó không phải là trường liên kết
            if (larkField && larkField.field_name !== 'Mã dự án') {
                let value = excelRow[excelHeader];

                // Chuyển đổi kiểu dữ liệu nếu cần
                if (numberFields.includes(larkField.field_name)) {
                    if (typeof value === 'string') {
                        value = value.replace(/[^0-9.\\-]/g, '').trim();
                    }
                    value = isNaN(value) || value === '' ? null : Number(value);
                } else {
                    value = value !== undefined && value !== null ? String(value) : '';
                }
                
                fields[larkField.field_name] = value;
            }
        }
        return { fields };
    });


    // 3. Thêm hàng loạt bản ghi vào bảng tương ứng
    if (recordsToCreate.length > 0) {
        console.log(`Batch creating ${recordsToCreate.length} records to ${codeType} table...`);
        console.log('Sample record being sent:', JSON.stringify(recordsToCreate[0], null, 2)); // Thêm log để debug
        await client.bitable.appTableRecord.batchCreate({
            path: {
                app_token: config.BASE_ID,
                table_id: targetTableId, // Sử dụng table ID tương ứng
            },
            data: {
                records: recordsToCreate,
            }
        });
        console.log(`✅ Batch create successful to ${codeType} table.`);
    }

    res.json({ success: true, message: `Imported ${recordsToCreate.length} records to ${codeType} table.` });
    
  } catch (err) {
    console.error('❌ Error in /import:', err);
    if (err.response && err.response.data) {
        console.error('Lark API error response:', JSON.stringify(err.response.data, null, 2));
        res.status(500).json({ error: err.message, details: err.response.data });
    } else {
        res.status(500).json({ error: err.message });
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 