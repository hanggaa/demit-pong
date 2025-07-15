module demit_pong::game_logic {
    use sui::coin::{Coin};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{TxContext};

    // Impor definisi koin kita
    use demit_pong::demit_pong_coin::{Self, DEMIT_PONG_COIN};

    // Bayar dengan SUI, kirim ke alamat treasury
    public entry fun pay_to_play_with_sui(payment: Coin<SUI>, treasury: address) {
        transfer::public_transfer(payment, treasury);
    }
    
    // Bayar dengan $DP, bakar dengan mengirim ke 0x0
    public entry fun pay_to_play_with_dp(payment: Coin<DEMIT_PONG_COIN>) {
        transfer::public_transfer(payment, @0x0);
    }

    // Fungsi Admin untuk memberi hadiah
    public entry fun grant_winnings(
        treasury_cap: &mut sui::coin::TreasuryCap<DEMIT_PONG_COIN>,
        winner_address: address,
        ctx: &mut TxContext
    ) {
        let reward_amount = 300_000; // 0.3 $DP
        
        // === PERBAIKAN DI SINI ===
        // Panggil fungsi 'mint' dari modul 'demit_pong_coin' yang sudah kita impor.
        demit_pong_coin::mint(treasury_cap, reward_amount, winner_address, ctx);
    }
}