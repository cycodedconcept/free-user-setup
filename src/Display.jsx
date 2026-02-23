import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Signup from './components/auth/Signup';
import AuthWelcome from './components/auth/AuthWelcome';
import Login from './components/auth/Login';
import OnlineStore from './pages/online/OnlineStore'
import OnlineStoreSingle from './pages/online/OnlineStoreSingle'
import ViewStore from './pages/online/ViewStore';

const Display = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Signup />}/>
        <Route path='welcome' element={<AuthWelcome />}/>
        <Route path='login' element={<Login />}/>
        <Route path='store' element={<OnlineStore />}/>
        <Route path='store-set-up' element={<OnlineStoreSingle />}/>
        <Route path='my-store' element={<ViewStore />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default Display