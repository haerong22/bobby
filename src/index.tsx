import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { DragDropContext } from 'react-beautiful-dnd';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <React.StrictMode>
    <DragDropContext onDragEnd={() => console.log('test')}>
      <App />
    </DragDropContext>
  </React.StrictMode>,
);
