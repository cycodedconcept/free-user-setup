import React, { useEffect } from 'react';
import Display from './Display';
import { applyAppTheme, getStoredAppTheme } from './utils/appTheme';

function App() {
  useEffect(() => {
    applyAppTheme(getStoredAppTheme());
  }, []);

  useEffect(() => {
    function handleMetaMessage(event) {
      if (event.origin !== 'https://www.facebook.com') return;

      try {
        const data = JSON.parse(event.data);

        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.event === 'FINISH') {
            const { waba_id, phone_number_id } = data.data;
            window.dispatchEvent(
              new CustomEvent('whatsapp_signup_complete', {
                detail: { waba_id, phone_number_id }
              })
            );
          }
          if (data.event === 'CANCEL') {
            window.dispatchEvent(
              new CustomEvent('whatsapp_signup_cancelled')
            );
          }
          if (data.event === 'ERROR') {
            window.dispatchEvent(
              new CustomEvent('whatsapp_signup_error')
            );
          }
        }
      } catch (e) {}
    }

    window.addEventListener('message', handleMetaMessage);
    return () => window.removeEventListener('message', handleMetaMessage);
  }, []);

  return (
    <>
      <Display />
    </>
  )
}

export default App
