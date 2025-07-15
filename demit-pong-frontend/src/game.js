import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

export const PACKAGE_ID = "0x078ccfaf1fdfbbb6020461d94e154f845fd5cf7aba114fba919a4067aa4c9145";
export const MARKETPLACE_ID = "0x4bddb21a7848224864c75f624a4af7f8be09e43bab95be79c968bd29672460b8"; 

let canvas, context;
let player, computer, ball;
let aspectRatio = 4 / 3;
let playerProfileId = null;
let gameLoopId = null; 

const winningScore = 5;

// --- KONTROL GAME STATE ---

export function startGameLoop() {
    console.log("Starting game loop...");
    document.getElementById('play-menu').classList.add('hidden');
    
    resetBall();
    player.score = 0;
    computer.score = 0;
    
    if (!gameLoopId) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

function stopGameLoop() {
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
        console.log("Game loop stopped.");
    }
}

function showGameOver(winnerText) {
    stopGameLoop();
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.font = `${canvas.width / 15}px 'Press Start 2P'`;
    context.textAlign = 'center';
    context.fillText(winnerText, canvas.width / 2, canvas.height / 2);

    document.getElementById('play-menu').classList.remove('hidden');
}


// --- LOGIKA INTI GAME ---

function gameLoop() {
    update();
    render();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function update() {
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    computer.y += (ball.y - (computer.y + computer.height / 2)) * 0.1;

    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.velocityY = -ball.velocityY;
    }

    if (ball.x - ball.radius < 0) {
        computer.score++;
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        player.score++;
        resetBall();
    }
    
    let targetPaddle = ball.velocityX < 0 ? player : computer;
    if (collision(ball, targetPaddle)) {
        let collidePoint = (ball.y - (targetPaddle.y + targetPaddle.height / 2));
        collidePoint = collidePoint / (targetPaddle.height / 2);
        let angleRad = (Math.PI / 4) * collidePoint;
        let direction = (ball.velocityX < 0) ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        ball.speed += 0.5;
    }
    
    if (player.score >= winningScore) {
        showGameOver("YOU WIN!");
    } else if (computer.score >= winningScore) {
        showGameOver("COMPUTER WINS");
    }
}

function render() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = `${canvas.width / 10}px 'Press Start 2P'`;
    context.textAlign = 'center';
    context.fillText(player.score, canvas.width / 4, canvas.height / 5);
    context.fillText(computer.score, 3 * canvas.width / 4, canvas.height / 5);
    context.fillStyle = player.color;
    context.fillRect(player.x, player.y, player.width, player.height);
    context.fillStyle = computer.color;
    context.fillRect(computer.x, computer.y, computer.width, computer.height);
    context.fillStyle = ball.color;
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, false);
    context.fill();
}

function resetBall(){
    if (!canvas) return;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = 7;
    ball.velocityX = -ball.velocityX || -5;
}

function collision(b, p){
    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;
    
    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;
    
    return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}

function movePaddle(evt) {
    if (!canvas) return;
    let rect = canvas.getBoundingClientRect();
    player.y = evt.clientY - rect.top - player.height / 2;
}


// --- INISIALISASI & FUNGSI ON-CHAIN ---

export function initializeGame() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    context = canvas.getContext('2d');
    
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', movePaddle);
    
    const paddleWidth = 15;
    const paddleHeight = 100;

    player = { x: 10, y: 0, width: paddleWidth, height: paddleHeight, color: 'white', score: 0 };
    computer = { x: 0, y: 0, width: paddleWidth, height: paddleHeight, color: 'white', score: 0 };
    ball = { x: 0, y: 0, radius: 10, speed: 7, velocityX: 5, velocityY: 5, color: 'white' };
    
    resizeCanvas();
    console.log("Game Canvas Initialized and Responsive.");
}

function resizeCanvas() {
    if (!canvas) return;
    const containerWidth = canvas.parentElement.clientWidth;
    const maxWidth = 800;
    let newWidth = Math.min(containerWidth, maxWidth) - 20;
    if (newWidth < 300) newWidth = 300; // Lebar minimum
    let newHeight = newWidth / aspectRatio;
    canvas.width = newWidth;
    canvas.height = newHeight;
    renderStatic();
}

function renderStatic() {
    if (!context || !player || !computer || !ball) return;
    
    player.y = canvas.height / 2 - player.height / 2;
    computer.x = canvas.width - computer.width - 10;
    computer.y = canvas.height / 2 - computer.height / 2;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;

    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = `${canvas.width / 10}px 'Press Start 2P'`;
    context.textAlign = 'center';
    context.fillText('0', canvas.width / 4, canvas.height / 5);
    context.fillText('0', 3 * canvas.width / 4, canvas.height / 5);
    context.fillStyle = player.color;
    context.fillRect(player.x, player.y, player.width, player.height);
    context.fillStyle = computer.color;
    context.fillRect(computer.x, computer.y, computer.width, computer.height);
    context.fillStyle = ball.color;
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, false);
    context.fill();
}

// ... (Sisa fungsi on-chain tidak berubah dari versi sebelumnya)
export async function fetchAndDisplayData(address) {
    const profileCreatorDiv = document.getElementById('profile-creator');
    const onchainInfoDiv = document.getElementById('onchain-info');
    const inventoryDiv = document.getElementById('inventory-display');
    const balanceDiv = document.getElementById('dp-balance');
    inventoryDiv.innerHTML = '<em>Fetching inventory...</em>';
    balanceDiv.innerHTML = '<em>Fetching balance...</em>';
    const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
    try {
        const ownedObjects = await suiClient.getOwnedObjects({ owner: address, options: { showContent: true } });
        const paddles = ownedObjects.data.filter(obj => obj.data?.content?.type === `${PACKAGE_ID}::paddle::Paddle`);
        const playerProfile = ownedObjects.data.find(obj => obj.data?.content?.type === `${PACKAGE_ID}::profile::PlayerProfile`);
        if (!playerProfile) {
            onchainInfoDiv.classList.add('hidden');
            profileCreatorDiv.classList.remove('hidden');
        } else {
            playerProfileId = playerProfile.data.objectId;
            onchainInfoDiv.classList.remove('hidden');
            profileCreatorDiv.classList.add('hidden');
            displayPaddles(paddles, playerProfile);
            addInventoryClickListener();
        }
        const dpCoinType = `${PACKAGE_ID}::demit_pong_coin::DEMIT_PONG_COIN`;
        const balance = await suiClient.getBalance({ owner: address, coinType: dpCoinType });
        const actualBalance = parseInt(balance.totalBalance) / 1_000_000;
        balanceDiv.innerHTML = `<strong>$DP Balance:</strong> ${actualBalance.toFixed(2)}`;
    } catch (error) {
        console.error("Failed to fetch on-chain data:", error);
        inventoryDiv.innerHTML = 'Error fetching assets.';
        balanceDiv.innerHTML = 'Error fetching balance.';
    }
}

function displayPaddles(paddles, profile) {
    const inventoryDiv = document.getElementById('inventory-display');
    if (paddles.length === 0) {
        inventoryDiv.innerHTML = 'You have no paddles. Visit the marketplace!';
        return;
    }
    inventoryDiv.innerHTML = '';
    const equippedId = profile ? profile.data.content.fields.equipped_paddle : null;
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

function addInventoryClickListener() {
    const inventoryDiv = document.getElementById('inventory-display');
    inventoryDiv.replaceWith(inventoryDiv.cloneNode(true));
    document.getElementById('inventory-display').addEventListener('click', (event) => {
        if (event.target && event.target.classList.contains('equip-btn')) {
            const paddleId = event.target.dataset.id;
            if (!playerProfileId) {
                alert("Player profile not found! Cannot equip.");
                return;
            }
            window.handleEquip(playerProfileId, paddleId);
        }
    });
}

export function resetOnChainData() {
    document.getElementById('inventory-display').innerHTML = 'Connect your wallet to see your paddles.';
    document.getElementById('dp-balance').innerHTML = 'Connect wallet to see balance...';
    document.getElementById('profile-creator').classList.add('hidden');
    document.getElementById('onchain-info').classList.remove('hidden');
}

export async function fetchMarketplaceData() {
    const marketplaceDiv = document.getElementById('marketplace-display');
    marketplaceDiv.innerHTML = '<em>Loading store items...</em>';
    const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
    try {
        const marketplaceObject = await suiClient.getObject({ id: MARKETPLACE_ID, options: { showContent: true } });
        if (marketplaceObject.data) {
            displayMarketplaceItems(marketplaceObject.data.content.fields);
            addMarketplaceClickListener();
        } else {
            marketplaceDiv.innerHTML = 'Could not find marketplace object.';
        }
    } catch (error) {
        console.error("Failed to fetch marketplace data:", error);
        marketplaceDiv.innerHTML = 'Error loading store. Check console (F12).';
    }
}

function displayMarketplaceItems(listings) {
    const marketplaceDiv = document.getElementById('marketplace-display');
    marketplaceDiv.innerHTML = '';
    const items = [
        { name: "Legendary", data: listings.legendary_listing },
        { name: "Epic", data: listings.epic_listing },
        { name: "Master", data: listings.master_listing },
    ];
    items.forEach(item => {
        const fields = item.data.fields;
        const priceInSUI = fields.price / 1_000_000_000;
        const remaining = fields.supply - fields.sold_count;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'market-item';
        itemDiv.innerHTML = `
            <h4>${item.name} Paddle</h4>
            <p>Price: ${priceInSUI.toFixed(1)} SUI</p>
            <p>Stock: ${remaining} / ${fields.supply}</p>
            <button class="buy-btn" data-rarity="${item.name}" data-price="${priceInSUI}" ${remaining === 0 ? 'disabled' : ''}>
                ${remaining === 0 ? 'Sold Out' : 'Buy'}
            </button>
        `;
        marketplaceDiv.appendChild(itemDiv);
    });
}

function addMarketplaceClickListener() {
    const marketplaceDiv = document.getElementById('marketplace-display');
    marketplaceDiv.replaceWith(marketplaceDiv.cloneNode(true));
    document.getElementById('marketplace-display').addEventListener('click', (event) => {
        if (event.target && event.target.classList.contains('buy-btn')) {
            const rarity = event.target.dataset.rarity;
            const priceSUI = parseFloat(event.target.dataset.price);
            if (confirm(`Are you sure you want to buy the ${rarity} paddle for ${priceSUI} SUI?`)) {
                window.handleBuy(rarity, priceSUI);
            }
        }
    });
}