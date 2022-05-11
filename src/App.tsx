import Desktop from 'pages/Desktop';
import React, { FC } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

const App: FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Desktop />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
