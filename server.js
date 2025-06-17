import express from 'express';
import cors from 'cors';
import { Client } from '@larksuiteoapi/node-sdk';
import multer from 'multer';
import XLSX from 'xlsx';

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
});

app.post('/import', upload.single('file'), async (req, res) => {
  console.log('Received import request');
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Lấy fields của bảng
    const fieldsRes = await client.bitable.appTableField.list({
      path: {
        app_token: config.BASE_ID,
        table_id: config.TABLE_ID,
      },
    });
    const tableFields = fieldsRes.data.items;
    const numberFields = ['Số lượng 1', 'Số lượng 2', 'Đơn giá'];
    // Import từng dòng
    for (const record of jsonData) {
      const fields = {};
      for (const field of tableFields) {
        const excelColumn = Object.keys(record).find(
          key => key.toLowerCase() === field.field_name.toLowerCase()
        );
        if (excelColumn) {
          let value = record[excelColumn];
          // Nếu là trường số, ép kiểu number
          if (numberFields.includes(field.field_name)) {
            const rawValue = value;
            if (value !== undefined && value !== null && value !== '') {
              if (typeof value === 'string') value = value.replace(/[^0-9.\-]/g, '').trim();
              value = isNaN(value) || value === '' ? null : Number(value);
            } else {
              value = null;
            }
            console.log(`DEBUG: field ${field.field_name}, raw:`, rawValue, '| after:', value, '| type:', typeof value);
          } else {
            // Trường còn lại, ép kiểu string
            value = value !== undefined && value !== null ? String(value) : '';
          }
          fields[field.field_name] = value;
        }
      }
      console.log('Importing record:', fields);
      try {
        const result = await client.bitable.appTableRecord.create({
          path: {
            app_token: config.BASE_ID,
            table_id: config.TABLE_ID,
          },
          data: { fields },
        });
        console.log('Full API response:', JSON.stringify(result, null, 2));
      } catch (err) {
        if (err.response) {
          console.error('Error importing record:', fields, '\nResponse data:', JSON.stringify(err.response.data, null, 2));
        } else {
          console.error('Error importing record:', fields, '\nError:', err.message, err);
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error in /import:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
}); 
