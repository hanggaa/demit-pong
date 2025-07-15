import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { SuiClientProvider, WalletProvider, ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';

// === PERBAIKAN DI SINI ===
// Impor getFullnodeUrl saja, kita tidak butuh testnetConnection
import { getFullnodeUrl } from '@mysten/sui/client';

import './style.css';
import { initializeGame, fetchAndDisplayData, resetOnChainData } from './game.js';

const queryClient = new QueryClient();

const networks = {
	testnet: { url: getFullnodeUrl('testnet') },
};


function App() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const handleEquip = (profileId, paddleId, packageId) => {
    console.log(`Preparing to equip paddle ${paddleId} on profile ${profileId}`);
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::profile::equip_paddle`,
      arguments: [ tx.object(profileId), tx.object(paddleId) ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.log("Equip transaction successful! Digest:", result.digest);
          alert("Paddle equipped successfully! Refreshing data...");
          if (account) {
            setTimeout(() => {
                fetchAndDisplayData(account.address);
            }, 2000);
          }
        },
        onError: (error) => {
          console.error("Equip transaction failed", error);
          alert("Equip failed: " + error.message);
        },
      }
    );
  };

  useEffect(() => {
    window.handleEquip = handleEquip;

    if (account) {
      fetchAndDisplayData(account.address);
    } else {
      resetOnChainData();
    }
  }, [account]);

  return <ConnectButton />;
}


// --- Kode render utama ---
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

initializeGame();