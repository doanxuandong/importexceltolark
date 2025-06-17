import { Client } from '@larksuiteoapi/node-sdk';
import { config } from '../config';

const client = new Client({
  appId: config.APP_ID,
  appSecret: config.APP_SECRET,
});

export const getTableFields = async () => {
  try {
    const response = await client.bitable.appTableField.list({
      path: {
        app_token: config.BASE_ID,
        table_id: config.TABLE_ID,
      },
    });
    return response.data.items;
  } catch (error) {
    console.error('Error getting table fields:', error);
    throw error;
  }
};

export const createRecord = async (fields) => {
  try {
    const response = await client.bitable.appTableRecord.create({
      path: {
        app_token: config.BASE_ID,
        table_id: config.TABLE_ID,
      },
      data: {
        fields,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating record:', error);
    throw error;
  }
}; 