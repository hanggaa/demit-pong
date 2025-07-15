import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SuiClientProvider, WalletProvider, ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';
import { getFullnodeUrl } from '@mysten/sui/client';

import './style.css';
import { 
    initializeGame, 
    startGameLoop,
    fetchAndDisplayData, 
    resetOnChainData, 
    fetchMarketplaceData,
    MARKETPLACE_ID,
    PACKAGE_ID 
} from './game.js';

const queryClient = new QueryClient();
const networks = { testnet: { url: getFullnodeUrl('testnet') } };

function App() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [isInitialized, setIsInitialized] = useState(false);

  const handleEquip = (profileId, paddleId) => {
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::profile::equip_paddle`,
      arguments: [ tx.object(profileId), tx.object(paddleId) ],
    });
    signAndExecute({ transaction: tx }, {
        onSuccess: () => {
          alert("Paddle equipped successfully! Refreshing data...");
          if (account) setTimeout(() => { fetchAndDisplayData(account.address); }, 2000);
        },
        onError: (error) => alert("Equip failed: " + error.message),
      }
    );
  };

  const handleBuy = async (rarity, priceSUI) => {
    if (!account) return alert("Please connect your wallet first.");
    const priceMIST = BigInt(priceSUI * 1_000_000_000);
    try {
      const tx = new Transaction();
      const paymentCoin = tx.splitCoins(tx.gas, [tx.pure.u64(priceMIST)]);
      tx.moveCall({
        target: `${PACKAGE_ID}::marketplace::buy_paddle`,
        arguments: [ tx.object(MARKETPLACE_ID), paymentCoin, tx.pure.string(rarity) ],
      });
      signAndExecute({ transaction: tx }, {
          onSuccess: () => {
            alert(`${rarity} paddle purchased successfully! Data will refresh.`);
            setTimeout(() => {
              fetchAndDisplayData(account.address);
              fetchMarketplaceData();
            }, 2000);
          },
          onError: (error) => alert("Buy failed: " + error.message),
        }
      );
    } catch (error) {
      alert("Error preparing transaction: " + error.message);
    }
  };
  
  const handleCreateProfile = () => {
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::profile::create_profile`,
      arguments: [],
    });
    signAndExecute({ transaction: tx }, {
        onSuccess: () => {
          alert("Profile created successfully! Welcome to the game!");
          if (account) setTimeout(() => { fetchAndDisplayData(account.address); }, 2000);
        },
        onError: (error) => alert("Profile creation failed: " + error.message),
      }
    );
  };

  const handlePayToPlay = async (paymentType) => {
    if (!account) return alert("Please connect your wallet first.");

    const tx = new Transaction();
    const treasuryAddress = "0x399b1a8685d397bdd4debfb3182079ef4e9ab7931595ce756eb69500dd3d8c11"; // Alamat treasury Anda

    try {
        if (paymentType === 'SUI') {
            const sui_fee = BigInt(20_000_000); // 0.02 SUI
            const paymentCoin = tx.splitCoins(tx.gas, [tx.pure.u64(sui_fee)]);
            tx.moveCall({
                target: `${PACKAGE_ID}::game_logic::pay_to_play_with_sui`,
                arguments: [paymentCoin, tx.pure.address(treasuryAddress)],
            });
        } else if (paymentType === 'DP') {
            const dp_fee = BigInt(100_000); // 0.1 DP
            const dpCoinType = `${PACKAGE_ID}::demit_pong_coin::DEMIT_PONG_COIN`;
            
            const { data: dpCoins } = await suiClient.getCoins({ owner: account.address, coinType: dpCoinType });
            if (dpCoins.length === 0 || BigInt(dpCoins.reduce((acc, coin) => acc + parseInt(coin.balance), 0)) < dp_fee) {
                return alert("You don't have enough $DP coin to pay.");
            }

            const [primaryCoin, ...otherCoins] = dpCoins.map(c => c.coinObjectId);
            const paymentCoin = tx.splitCoins(tx.object(primaryCoin), [tx.pure.u64(dp_fee)]);

            if (otherCoins.length > 0) {
                tx.mergeCoins(tx.object(primaryCoin), otherCoins.map(c => tx.object(c)));
            }
            
            tx.moveCall({
                target: `${PACKAGE_ID}::game_logic::pay_to_play_with_dp`,
                arguments: [paymentCoin],
            });
        } else {
            return; // Tipe pembayaran tidak valid
        }

        signAndExecute({ transaction: tx }, {
            onSuccess: () => {
              console.log("Payment successful! Starting game...");
              startGameLoop();
            },
            onError: (error) => alert("Payment failed: " + error.message),
        });
    } catch(e) {
        alert(`An error occurred: ${e.message}`)
    }
  };

  useEffect(() => {
    if (!isInitialized) {
      initializeGame();
      fetchMarketplaceData();
      setIsInitialized(true);
    }

    const createBtn = document.getElementById('create-profile-btn');
    const suiPlayBtn = document.getElementById('play-with-sui-btn');
    const dpPlayBtn = document.getElementById('play-with-dp-btn');

    if (createBtn) createBtn.addEventListener('click', handleCreateProfile);
    if (suiPlayBtn) suiPlayBtn.addEventListener('click', () => handlePayToPlay('SUI'));
    if (dpPlayBtn) dpPlayBtn.addEventListener('click', () => handlePayToPlay('DP'));

    window.handleEquip = handleEquip;
    window.handleBuy = handleBuy;

    if (account) {
      fetchAndDisplayData(account.address);
    } else {
      resetOnChainData();
    }
    
    return () => {
        if (createBtn) createBtn.removeEventListener('click', handleCreateProfile);
        if (suiPlayBtn) suiPlayBtn.removeEventListener('click', () => handlePayToPlay('SUI'));
        if (dpPlayBtn) dpPlayBtn.removeEventListener('click', () => handlePayToPlay('DP'));
    };
  }, [account, isInitialized]);

  return <ConnectButton />;
}

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