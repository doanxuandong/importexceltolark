import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import streamifier from 'streamifier';
import 'isomorphic-fetch';

// Cấu hình cho OneDrive API của công ty
const config = {
  auth: {
    
    clientId: 'f7e88b82-1130-499f-b55c-935067992775',
    
    authority: 'https://login.microsoftonline.com/f044de3f-d27a-4246-a5b6-4b03edebb3ef',
    
    clientSecret: '8vA8Q~ffDjry5C1RUY-LtA-9GL.0A3hZLI47Qddu',
  }
};
const SCOPES = ['https://graph.microsoft.com/.default'];

const SITE_ID = 'quangcaomc.sharepoint.com,7ed3cd28-aa48-48a5-84af-1390ed66a340,0f4b298e-c258-45a0-9b1c-94a4981dcd16'; // <-- SITE ID 
const FOLDER_ID = '01OHPCP2OVD2K5BV6R5VG2MELHBZURQNCJ'; // <-- FOLDER ID
const TENANT_ID_TO_CHECK = '7ed3cd28-aa48-48a5-84af-1390ed66a340';

async function getAccessToken() {
  const cca = new ConfidentialClientApplication(config);
  const result = await cca.acquireTokenByClientCredential({ scopes: SCOPES });
  console.log("Access token:", result.accessToken);
  return result.accessToken;
}

async function checkSiteTenant() {
  console.log(`Checking if SITE_ID ${SITE_ID} belongs to TENANT_ID ${TENANT_ID_TO_CHECK}...`);
  try {
    const accessToken = await getAccessToken();
    const client = Client.init({ authProvider: (done) => done(null, accessToken) });

    const site = await client.api(`/sites/${SITE_ID}`).get();
    
    const siteTenantId = site.id.split(',')[1];
    
    if (siteTenantId === TENANT_ID_TO_CHECK) {
      console.log('✅ Site belongs to the correct tenant.');
    } else {
      console.error(`❌ Site belongs to a different tenant: ${siteTenantId}`);
      throw new Error('Site does not belong to the correct tenant.');
    }
  } catch (error) {
    console.error('❌ Could not verify site. Error:', error.message);
    throw error;
  }
}

async function uploadFileToOneDrive(buffer, fileName) {
  try {
    const accessToken = await getAccessToken();
    
    const fileExtension = fileName.split('.').pop().toLowerCase();
    let contentType = 'application/octet-stream'; // Default
    if (fileExtension === 'xlsx') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (fileExtension === 'xls') {
      contentType = 'application/vnd.ms-excel';
    }

    // Upload vào thư mục bằng Folder ID trong Site SharePoint chung
    const uploadPath = `/sites/${SITE_ID}/drive/items/${FOLDER_ID}:/${fileName}:/content`;
    const fullUrl = `https://graph.microsoft.com/v1.0${uploadPath}`;
    console.log(`Attempting to upload to: ${fullUrl} with Content-Type: ${contentType}`);
    
    const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': contentType
        },
        body: buffer
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.error("CHI TIẾT LỖI TỪ GRAPH API:", JSON.stringify(responseData, null, 2));
        throw new Error(`Graph API upload failed with status: ${response.status} ${response.statusText}`);
    }
    
    // responseData.webUrl là link xem file trên OneDrive
    return responseData;
  } catch (error) {
    // Avoid re-stringifying an already stringified error
    if (error.message.includes('Graph API upload failed')) {
        throw error;
    }
    console.error("CHI TIẾT LỖI:", JSON.stringify(error, null, 2));
    throw error;
  }
}

export { checkSiteTenant, uploadFileToOneDrive }; 