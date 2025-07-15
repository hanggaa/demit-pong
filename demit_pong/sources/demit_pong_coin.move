module demit_pong::demit_pong_coin {

    // Import yang lebih rapi dan bersih
    use std::option;
    use sui::coin::{Self, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    public struct DEMIT_PONG_COIN has drop {}

    //================================================================
    // Inisialisasi
    //================================================================

    fun init(witness: DEMIT_PONG_COIN, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            6,
            b"DP",
            b"Demit Pong",
            b"In-game currency for Demit Pong.",
            option::none(),
            ctx
        );
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
        transfer::public_transfer(metadata, tx_context::sender(ctx));
    }

    //================================================================
    // Fungsi Admin
    //================================================================

    public entry fun mint(
        // === PERBAIKAN UTAMA DI SINI ===
        // Memperbaiki kesalahan ketik dari 'TreasuryuryCap' menjadi 'TreasuryCap'.
        treasury_cap: &mut TreasuryCap<DEMIT_PONG_COIN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        coin::mint_and_transfer(treasury_cap, amount, recipient, ctx);
    }
}