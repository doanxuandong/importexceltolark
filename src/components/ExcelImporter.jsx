import React, { useState, useRef } from 'react';
import { DownloadOutlined } from '@ant-design/icons';

const ExcelImporter = ({ codeType }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [importedBy, setImportedBy] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid Excel file (.xlsx)');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    if (!importedBy.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!projectCode.trim()) {
      setError('Vui lòng nhập mã dự án');
      return;
    }

    setImporting(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('importedBy', importedBy.trim());
      formData.append('projectCode', projectCode.trim());
      formData.append('codeType', codeType);

      const response = await fetch('http://localhost:3001/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Import failed');
      }

      setSuccess(true);
      setFile(null);
      setImportedBy('');
      setProjectCode('');
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    } catch (error) {
      setError('Failed to import data: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-3xl font-bold text-blue-600 mb-4 text-center">
                  UPLOAD CO - {codeType}
                </h1>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Trưởng dự án
                    </label>
                    <input
                      type="text"
                      value={importedBy}
                      onChange={(e) => setImportedBy(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter your name"
                      disabled={importing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mã dự án
                    </label>
                    <input
                      type="text"
                      value={projectCode}
                      onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Nhập mã dự án"
                      disabled={importing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Template CO
                    </label>
                    <div className="flex items-center mb-2 mt-1">
                      <a
                        href="/Template.xlsx"
                        download
                        className="flex items-center text-blue-600 hover:underline font-medium text-sm"
                      >
                        <DownloadOutlined className="text-lg mr-1" />
                        Template
                      </a>
                      <span className="ml-2 text-gray-400 text-xs">(Tải file mẫu, điền nội dung theo file mẫu rồi import)</span>
                    </div>
                    <input
                      type="file"
                      accept=".xlsx"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="mt-1 block w-full"
                      disabled={importing}
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="text-green-600 text-sm">
                      Import completed successfully!
                    </div>
                  )}

                  {importing && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full animate-pulse"
                        style={{ width: `100%` }}
                      ></div>
                    </div>
                  )}

                  <button
                    onClick={handleImport}
                    disabled={!file || importing}
                    className={`w-full px-4 py-2 rounded-lg text-white ${
                      !file || importing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {importing ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelImporter; 