import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { SuiClientProvider, WalletProvider, ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';

// Import CSS dan fungsi-fungsi game kita
import './style.css';
import { initializeGame, fetchAndDisplayData, resetOnChainData } from './game.js';

const queryClient = new QueryClient();

// Ini adalah komponen jembatan kita
function App() {
  // 1. Gunakan hook resmi untuk mendapatkan status akun saat ini
  const account = useCurrentAccount();

  // 2. Gunakan useEffect untuk bereaksi setiap kali 'account' berubah
  useEffect(() => {
    if (account) {
      // Jika ada akun, panggil fungsi fetch data kita dari game.js
      console.log("Wallet connected! Fetching data for:", account.address);
      fetchAndDisplayData(account.address);
    } else {
      // Jika tidak ada akun (terputus), panggil fungsi reset
      console.log("Wallet disconnected.");
      resetOnChainData();
    }
  }, [account]); // Array ini memastikan kode di atas hanya berjalan saat 'account' berubah

  // Komponen ini hanya merender tombolnya
  return <ConnectButton />;
}


// --- Kode render utama ---
const connectorContainer = document.querySelector('#wallet-connector');
if (connectorContainer) {
    const root = createRoot(connectorContainer);
    root.render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <SuiClientProvider>
                    <WalletProvider>
                        <App />
                    </WalletProvider>
                </SuiClientProvider>
            </QueryClientProvider>
        </React.StrictMode>
    );
}

// Inisialisasi kanvas game kita, terpisah dari logika dompet
initializeGame();