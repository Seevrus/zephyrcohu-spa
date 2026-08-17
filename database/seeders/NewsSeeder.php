<?php

namespace Database\Seeders;

use App\Models\News;
use Database\Seeders\Concerns\GeneratesArticleContent;
use Illuminate\Database\Seeder;

class NewsSeeder extends Seeder {
    use GeneratesArticleContent;

    private const int ITEM_COUNT = 100;

    private const int REGISTERED_ONLY_PERCENTAGE = 30;

    public function run(): void {
        $topics = [
            'System Maintenance', 'New Feature Release', 'Tax Rule Update', 'Mobile App Update',
            'Security Advisory', 'Performance Improvements', 'API Changes', 'Data Center Migration',
            'Holiday Schedule', 'Customer Support Hours', 'Partner Integration', 'Pricing Update',
            'Compliance Notice', 'Product Roadmap', 'Bug Fixes',
        ];

        $modifiers = [
            'Now Live', 'Coming Soon', 'Scheduled for Next Week', 'Rolled Out', 'Now Available',
            'Update', 'Announcement', 'Details Inside', 'What You Need to Know', 'Summary',
        ];

        for ($i = 1; $i <= self::ITEM_COUNT; $i++) {
            News::create([
                'audience' => random_int(1, 100) <= self::REGISTERED_ONLY_PERCENTAGE ? 'A' : 'P',
                'title' => sprintf('%s: %s', $topics[array_rand($topics)], $modifiers[array_rand($modifiers)]),
                'main_content' => $this->paragraph(3, 6),
                'additional_content' => random_int(1, 100) <= 80 ? $this->paragraph(2, 4) : null,
                'published_at' => now()->subDays(random_int(0, 730))->subMinutes(random_int(0, 1440)),
            ]);
        }
    }
}
