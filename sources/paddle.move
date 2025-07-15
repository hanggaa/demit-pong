module demit_pong::paddle {

    // Import yang lebih rapi untuk Move 2024
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};

    //================================================================
    // Definisi Objek NFT (Struct)
    //================================================================

    // === PERBAIKAN UTAMA DI SINI ===
    // Menambahkan 'public' untuk membuat struct ini dapat diakses dari luar modul.
    public struct Paddle has key, store {
        id: UID,
        rarity: String,
        speed_bonus: u64,
        color_hex: String,
    }

    //================================================================
    // Konstanta
    //================================================================
    const LEGENDARY: vector<u8> = b"Legendary";
    const EPIC: vector<u8> = b"Epic";
    const MASTER: vector<u8> = b"Master";

    //================================================================
    // Fungsi Minting
    //================================================================

    public entry fun mint_legendary(ctx: &mut TxContext) {
        let paddle = Paddle {
            id: object::new(ctx),
            rarity: string::utf8(LEGENDARY),
            speed_bonus: 10,
            color_hex: string::utf8(b"purple")
        };
        transfer::public_transfer(paddle, tx_context::sender(ctx));
    }

    public entry fun mint_epic(ctx: &mut TxContext) {
        let paddle = Paddle {
            id: object::new(ctx),
            rarity: string::utf8(EPIC),
            speed_bonus: 5,
            color_hex: string::utf8(b"red")
        };
        transfer::public_transfer(paddle, tx_context::sender(ctx));
    }

    public entry fun mint_master(ctx: &mut TxContext) {
        let paddle = Paddle {
            id: object::new(ctx),
            rarity: string::utf8(MASTER),
            speed_bonus: 2,
            color_hex: string::utf8(b"pink")
        };
        transfer::public_transfer(paddle, tx_context::sender(ctx));
    }

    //================================================================
    // Fungsi Getter (Read-Only)
    //================================================================

    public fun rarity(paddle: &Paddle): String {
        paddle.rarity
    }

    public fun speed_bonus(paddle: &Paddle): u64 {
        paddle.speed_bonus
    }

    public fun color_hex(paddle: &Paddle): String {
        paddle.color_hex
    }
}