<?php

namespace Database\Seeders;

use App\Models\Offer;
use Database\Seeders\Concerns\GeneratesArticleContent;
use Illuminate\Database\Seeder;

class OfferSeeder extends Seeder {
    use GeneratesArticleContent;

    private const int ITEM_COUNT = 100;

    private const int REGISTERED_ONLY_PERCENTAGE = 30;

    public function run(): void {
        $topics = [
            'Annual Subscription', 'Multi-User License', 'Early Renewal', 'Referral Program',
            'Bundle Package', 'Loyalty', 'New Customer', 'Upgrade', 'Black Friday', 'Spring',
            'Summer', 'Year-End', 'Partner Program', 'Educational License', 'Nonprofit License',
        ];

        $modifiers = [
            'Discount', 'Special Offer', 'Promotion', 'Deal', '10% Off', '15% Off', '20% Off',
            'Free Trial Extension', 'Bonus Credits', 'Limited Time Offer',
        ];

        for ($i = 1; $i <= self::ITEM_COUNT; $i++) {
            Offer::create([
                'audience' => random_int(1, 100) <= self::REGISTERED_ONLY_PERCENTAGE ? 'A' : 'P',
                'title' => sprintf('%s: %s', $topics[array_rand($topics)], $modifiers[array_rand($modifiers)]),
                'main_content' => $this->paragraph(3, 6),
                'additional_content' => random_int(1, 100) <= 80 ? $this->paragraph(2, 4) : null,
                'published_at' => now()->subDays(random_int(0, 730))->subMinutes(random_int(0, 1440)),
            ]);
        }
    }
}
