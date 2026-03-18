import React, { useEffect } from 'react';
import Display from './Display';
import { applyAppTheme, getStoredAppTheme } from './utils/appTheme';

function App() {
  useEffect(() => {
    applyAppTheme(getStoredAppTheme());
  }, []);

  return (
    <>
      <Display />
    </>
  )
}

export default App
