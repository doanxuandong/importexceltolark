import React, { useState } from 'react';
import AuthPage from './components/AuthPage';
import ExcelImporter from './components/ExcelImporter';

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [codeType, setCodeType] = useState(null);

  const handleAuthenticated = (type) => {
    setCodeType(type);
    setAuthenticated(true);
  };

  return (
    <>
      {authenticated ? (
        <ExcelImporter codeType={codeType} />
      ) : (
        <AuthPage onAuthenticated={handleAuthenticated} />
      )}
    </>
  );
};

export default App;
