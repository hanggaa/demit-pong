import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SuiClientProvider, WalletProvider, ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';
import { getFullnodeUrl } from '@mysten/sui/client';

import './style.css';
// Impor SEMUA fungsi yang kita butuhkan dari game.js
import { 
    initializeGame, 
    fetchAndDisplayData, 
    resetOnChainData, 
    fetchMarketplaceData 
} from './game.js';

const queryClient = new QueryClient();

const networks = {
	testnet: { url: getFullnodeUrl('testnet') },
};

function App() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  // State untuk memastikan inisialisasi hanya berjalan sekali
  const [isInitialized, setIsInitialized] = useState(false);

  const handleEquip = (profileId, paddleId, packageId) => {
    // ... (kode handleEquip tetap sama persis) ...
    console.log(`Preparing to equip paddle ${paddleId} on profile ${profileId}`);
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::profile::equip_paddle`,
      arguments: [ tx.object(profileId), tx.object(paddleId) ],
    });

    signAndExecute({ transaction: tx }, {
        onSuccess: (result) => {
          console.log("Equip transaction successful! Digest:", result.digest);
          alert("Paddle equipped successfully! Refreshing data...");
          if (account) {
            setTimeout(() => { fetchAndDisplayData(account.address); }, 2000);
          }
        },
        onError: (error) => {
          console.error("Equip transaction failed", error);
          alert("Equip failed: " + error.message);
        },
      }
    );
  };

  // === PERBAIKAN UTAMA ADA DI SINI ===
  useEffect(() => {
    // 1. Inisialisasi game dan marketplace HANYA SEKALI saat komponen pertama kali dimuat
    if (!isInitialized) {
      initializeGame();
      fetchMarketplaceData();
      setIsInitialized(true); // Tandai bahwa inisialisasi sudah selesai
    }

    // 2. Setup "jembatan" ke window
    window.handleEquip = handleEquip;

    // 3. Logika untuk fetch data inventory berdasarkan status koneksi dompet
    if (account) {
      fetchAndDisplayData(account.address);
    } else {
      resetOnChainData();
    }
    
    // Bergantung pada 'account' dan 'isInitialized'
  }, [account, isInitialized]);

  return <ConnectButton />;
}

// --- Kode render utama (tidak berubah) ---
const connectorContainer = document.querySelector('#wallet-connector');
if (connectorContainer) {
    const root = createRoot(connectorContainer);
    root.render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <SuiClientProvider networks={networks} defaultNetwork="testnet">
                    <WalletProvider>
                        <App />
                    </WalletProvider>
                </SuiClientProvider>
            </QueryClientProvider>
        </React.StrictMode>
    );
}