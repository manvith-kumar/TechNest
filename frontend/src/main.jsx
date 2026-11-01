import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import { CompareProvider } from './context/CompareContext.jsx';
import { ConfirmProvider } from './components/common/ConfirmationModal.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <CompareProvider>
              <ConfirmProvider>
                <App />
                <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontFamily: 'Inter, sans-serif', fontSize: '14px', borderRadius: '10px' } }} />
              </ConfirmProvider>
            </CompareProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
