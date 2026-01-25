import React from 'react';
import './App.css';
import DefaultLayout from './components/Layout/DefaultLayout';
import { MessageProvider } from './contexts/MessageContext';
const App: React.FC = () => {

  return (
    <MessageProvider>
      <DefaultLayout />
    </MessageProvider>
  );
};

export default App;
