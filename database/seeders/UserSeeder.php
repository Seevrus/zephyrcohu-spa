<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserAdmin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder {
    private const int ADMIN_COUNT = 2;

    private const string SEEDED_PASSWORD = 'password';

    private const int USER_COUNT = 30;

    /**
     * Seed test users. Skips the registration/email-change/password-reset/login-attempt
     * tables on purpose - they only matter for those in-progress flows, not for a
     * ready-to-use local dataset.
     */
    public function run(): void {
        $hashedPassword = Hash::make(self::SEEDED_PASSWORD);

        for ($i = 1; $i <= self::USER_COUNT; $i++) {
            $isAdmin = $i <= self::ADMIN_COUNT;

            // forceCreate: confirmed/ip_address/last_active are intentionally not
            // mass-assignable outside of seeding/admin scripts.
            $user = User::forceCreate([
                'email' => $isAdmin
                    ? sprintf('admin%d@example.com', $i)
                    : sprintf('user%d@example.com', $i - self::ADMIN_COUNT),
                'password' => $hashedPassword,
                'password_set_at' => now()->subDays(random_int(1, 400)),
                'confirmed' => true,
                'newsletter' => (bool) random_int(0, 1),
                'ip_address' => sprintf('192.168.%d.%d', random_int(0, 255), random_int(1, 254)),
                'last_active' => now()->subMinutes(random_int(5, 60 * 24 * 30)),
            ]);

            if ($isAdmin) {
                UserAdmin::query()->insert(['user_id' => $user->id]);
            }
        }
    }
}
