module demit_pong::profile {

    // Import yang lebih rapi
    use sui::object::{ID, UID};
    use sui::transfer;
    use sui::tx_context::TxContext;
    use std::option::{Self, Option};

    // Impor definisi Paddle dari modul kita yang lain
    use demit_pong::paddle::Paddle;

    //================================================================
    // Definisi Objek PlayerProfile (Struct)
    //================================================================

    // === PERBAIKAN UTAMA DI SINI ===
    // Menambahkan 'store' agar objek ini bisa ditransfer dan dimiliki.
    public struct PlayerProfile has key, store {
        id: UID,
        equipped_paddle: Option<ID>,
    }

    //================================================================
    // Fungsi Utama
    //================================================================

    public entry fun create_profile(ctx: &mut TxContext) {
        let profile = PlayerProfile {
            id: object::new(ctx),
            equipped_paddle: option::none(),
        };
        transfer::public_transfer(profile, tx_context::sender(ctx));
    }

    public entry fun equip_paddle(
        profile: &mut PlayerProfile,
        paddle: &Paddle,
        _ctx: &mut TxContext
    ) {
        profile.equipped_paddle = option::some(object::id(paddle));
    }

    public entry fun unequip_paddle(
        profile: &mut PlayerProfile,
        _ctx: &mut TxContext
    ) {
        profile.equipped_paddle = option::none();
    }

    //================================================================
    // Fungsi Getter (Read-Only)
    //================================================================

    public fun equipped_paddle_id(profile: &PlayerProfile): Option<ID> {
        profile.equipped_paddle
    }
}