module demit_pong::marketplace {

    // Import yang lebih rapi
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::object::{UID};
    use std::string::String;

    use demit_pong::paddle;

    //================================================================
    // Error Codes
    //================================================================
    const EInvalidRarity: u64 = 0;
    const EIncorrectPayment: u64 = 1;
    const ESoldOut: u64 = 2;

    //================================================================
    // Structs
    //================================================================

    public struct AdminCap has key {
        id: UID
    }

    // === PERBAIKAN UTAMA DI SINI ===
    // Listing adalah data, bukan objek. Ia harus memiliki kemampuan 'store' dan 'drop'.
    // 'drop' dibutuhkan agar Listing bisa dihancurkan saat tidak lagi dipakai.
    public struct Listing has store, drop {
        price: u64,
        supply: u64,
        sold_count: u64,
    }

    public struct Marketplace has key {
        id: UID,
        treasury: address,
        legendary_listing: Listing,
        epic_listing: Listing,
        master_listing: Listing,
    }

    //================================================================
    // Inisialisasi
    //================================================================
    
    fun init(ctx: &mut TxContext) {
        transfer::transfer(AdminCap { id: object::new(ctx) }, tx_context::sender(ctx));
    }

    //================================================================
    // Fungsi Admin
    //================================================================

    public entry fun create_marketplace(
        _cap: &AdminCap,
        treasury_address: address,
        ctx: &mut TxContext
    ) {
        let marketplace = Marketplace {
            id: object::new(ctx),
            treasury: treasury_address,
            legendary_listing: Listing { price: 300_000_000, supply: 3, sold_count: 0 },
            epic_listing: Listing { price: 200_000_000, supply: 4, sold_count: 0 },
            master_listing: Listing { price: 100_000_000, supply: 6, sold_count: 0 },
        };
        transfer::share_object(marketplace);
    }

    //================================================================
    // Fungsi Publik (Pembelian)
    //================================================================

    public entry fun buy_paddle(
        marketplace: &mut Marketplace,
        payment: Coin<SUI>,
        rarity_str: String,
        ctx: &mut TxContext
    ) {
        let listing: &mut Listing;
        let rarity_bytes = rarity_str.as_bytes();

        if (rarity_bytes == b"Legendary") {
            listing = &mut marketplace.legendary_listing;
        } else if (rarity_bytes == b"Epic") {
            listing = &mut marketplace.epic_listing;
        } else if (rarity_bytes == b"Master") {
            listing = &mut marketplace.master_listing;
        } else {
            abort EInvalidRarity
        };

        assert!(listing.sold_count < listing.supply, ESoldOut);
        assert!(coin::value(&payment) >= listing.price, EIncorrectPayment);

        listing.sold_count = listing.sold_count + 1;

        transfer::public_transfer(payment, marketplace.treasury);

        if (rarity_bytes == b"Legendary") {
             paddle::mint_legendary(ctx);
        } else if (rarity_bytes == b"Epic") {
             paddle::mint_epic(ctx);
        } else { // Master
             paddle::mint_master(ctx);
        };
    }
}