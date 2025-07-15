import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

const PACKAGE_ID = "0x5ac0b359d04b9688c848f0bf04d13230b8e24f7b2c726e26a627d631c3dcd9bf";

let canvas, context;
let player, computer, ball;
// Di src/game.js, di bagian atas
let playerProfileId = null; // Variabel untuk menyimpan ID profil

export function initializeGame() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    context = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    const paddleWidth = 15;
    const paddleHeight = 100;

    player = { x: 10, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: 'white', score: 0 };
    computer = { x: canvas.width - paddleWidth - 10, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: 'white', score: 0 };
    ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 10, speed: 7, velocityX: 5, velocityY: 5, color: 'white' };
    
    renderStatic();
    console.log("Game Canvas Initialized.");
}

function renderStatic() {
    // ... (kode render tetap sama)
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = player.color;
    context.fillRect(player.x, player.y, player.width, player.height);
    context.fillStyle = computer.color;
    context.fillRect(computer.x, computer.y, computer.width, computer.height);
    context.fillStyle = ball.color;
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, false);
    context.fill();
}

// --- FUNGSI ON-CHAIN DENGAN DEBUGGING LOG ---

export async function fetchAndDisplayData(address) {
    console.log("--- Starting fetchAndDisplayData ---");
    const inventoryDiv = document.getElementById('inventory-display');
    const balanceDiv = document.getElementById('dp-balance');
    inventoryDiv.innerHTML = '<em>(1/5) Fetching your assets...</em>';
    balanceDiv.innerHTML = '<em>(1/5) Fetching balance...</em>';

    const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

    try {
        console.log("(2/5) Calling suiClient.getOwnedObjects for address:", address);
        const ownedObjects = await suiClient.getOwnedObjects({ 
            owner: address, 
            options: { showContent: true, showType: true } // Minta lebih banyak detail
        });
        console.log("(3/5) Successfully fetched ownedObjects:", ownedObjects);

        const paddles = ownedObjects.data.filter(obj => obj.data?.content?.type === `${PACKAGE_ID}::paddle::Paddle`);
        console.log("(4/5) Filtered paddles:", paddles);

        const playerProfile = ownedObjects.data.find(obj => obj.data?.content?.type === `${PACKAGE_ID}::profile::PlayerProfile`);
        console.log("(5/5) Found player profile:", playerProfile);

        // Di dalam fetchAndDisplayData, setelah baris 'const playerProfile = ...'
        if (playerProfile) {
            playerProfileId = playerProfile.data.objectId; // Simpan ID profilnya
            console.log("Player profile ID stored:", playerProfileId);
        }

        // Tampilkan Paddles
        // ... (kode display tetap sama) ...
        if (paddles.length === 0) {
            inventoryDiv.innerHTML = 'You have no paddles. Visit the marketplace!';
        } else {
            inventoryDiv.innerHTML = '';
            const equippedId = playerProfile ? playerProfile.data.content.fields.equipped_paddle : null;
            paddles.forEach(paddle => {
                const fields = paddle.data.content.fields;
                const paddleId = paddle.data.objectId;
                const isEquipped = paddleId === equippedId;
                const paddleDiv = document.createElement('div');
                paddleDiv.className = 'paddle-item' + (isEquipped ? ' equipped' : '');
                paddleDiv.innerHTML = `
                    <p style="background-color:${fields.color_hex}; color: white; padding: 2px 4px; display:inline-block; border: 1px solid white;"><strong>${fields.rarity}</strong></p>
                    <p>Bonus: +${fields.speed_bonus} speed</p>
                    ${isEquipped ? '<strong>(Equipped)</strong>' : `<button class="equip-btn" data-id="${paddleId}">Equip</button>`}
                `;
                inventoryDiv.appendChild(paddleDiv);
            });
        }

        // Tampilkan Saldo $DP
        const dpCoinType = `${PACKAGE_ID}::demit_pong_coin::DEMIT_PONG_COIN`;
        const balance = await suiClient.getBalance({ owner: address, coinType: dpCoinType });
        const actualBalance = parseInt(balance.totalBalance) / 1_000_000;
        balanceDiv.innerHTML = `<strong>$DP Balance:</strong> ${actualBalance.toFixed(2)}`;
        // Tambahkan event listener ke seluruh kontainer inventory
        addInventoryClickListener();


    } catch (error) {
        // INI BAGIAN PALING PENTING
        console.error("--- ERROR inside fetchAndDisplayData ---", error);
        inventoryDiv.innerHTML = 'Error fetching assets. Check console (F12).';
        balanceDiv.innerHTML = 'Error fetching balance. Check console (F12).';
    }
    // Buat fungsi baru di luar fetchAndDisplayData
    function addInventoryClickListener() {
        const inventoryDiv = document.getElementById('inventory-display');
        // Hapus listener lama untuk menghindari duplikasi
        inventoryDiv.replaceWith(inventoryDiv.cloneNode(true));
        document.getElementById('inventory-display').addEventListener('click', (event) => {
            // Cek apakah yang diklik adalah tombol equip
            if (event.target && event.target.classList.contains('equip-btn')) {
                const paddleId = event.target.dataset.id;
                if (!playerProfileId) {
                    alert("Player profile not found! Cannot equip.");
                    return;
                }
                
                // Panggil fungsi "jembatan" yang kita buat di main.jsx
                window.handleEquip(playerProfileId, paddleId, PACKAGE_ID);
            }
        });
    }
}

export function resetOnChainData() {
    document.getElementById('inventory-display').innerHTML = 'Connect your wallet to see your paddles.';
    document.getElementById('dp-balance').innerHTML = 'Connect wallet to see balance...';
}