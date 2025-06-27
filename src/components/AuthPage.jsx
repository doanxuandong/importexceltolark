// src/components/AuthPage.jsx
import React, { useState } from 'react';

const AuthPage = ({ onAuthenticated }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const VALID_CODE_MC = 'W+LgBJ29eY:3exC%+56';
  const VALID_CODE_IOB = 'W+LgBJ29eY:3exC%+83'; 

  const handleSubmit = () => {
    if (code === VALID_CODE_MC) {
      onAuthenticated('MC'); // Truyền loại mã code
    } else if (code === VALID_CODE_IOB) {
      onAuthenticated('IOB'); // Truyền loại mã code
    } else {
      setError('Mã xác thực không đúng');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">Nhập mã xác thực</h2>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Mã xác thực"
          className="w-full mb-4 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Xác nhận
        </button>
        {error && <div className="mt-2 text-red-600 text-sm text-center">{error}</div>}
      </div>
    </div>
  );
};

export default AuthPage;
