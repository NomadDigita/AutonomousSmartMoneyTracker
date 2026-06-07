import React from 'react'
import ReactDOM from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyProvider
      appId="cmq2qemhx030u0ckv73dkxri8"
      config={{
        loginMethods: ['wallet', 'google', 'email'],
        appearance: {
          theme: 'dark',
          accentColor: '#06b6d4',
          showWalletLoginFirst: true,
        },
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>,
)