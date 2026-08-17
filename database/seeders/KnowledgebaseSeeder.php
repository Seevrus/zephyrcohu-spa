<?php

namespace Database\Seeders;

use App\Models\Knowledgebase;
use App\Models\Tag;
use Database\Seeders\Concerns\GeneratesArticleContent;
use Database\Seeders\Concerns\HasWeightedTagPool;
use Illuminate\Database\Seeder;

class KnowledgebaseSeeder extends Seeder {
    use GeneratesArticleContent;
    use HasWeightedTagPool;

    private const int ITEM_COUNT = 100;

    private const int MAX_TAGS_PER_ARTICLE = 5;

    private const int MIN_TAGS_PER_ARTICLE = 3;

    private const int REGISTERED_ONLY_PERCENTAGE = 30;

    public function run(): void {
        $topics = [
            'How to Create an Invoice', 'Setting Up Multi-Currency', 'Configuring Tax Rates',
            'Exporting Reports to Excel', 'Managing User Permissions', 'Connecting the Mobile App',
            'Troubleshooting Login Issues', 'Setting Up Automatic Backups', 'Customizing Invoice Templates',
            'Integrating with Accounting Software', 'Resetting Your Password', 'Understanding Billing Cycles',
            'Bulk Importing Customers', 'Setting Up Notifications', 'API Authentication Guide',
            'Migrating Data from a Previous System', 'Understanding Audit Logs', 'Setting Up Recurring Invoices',
            'Managing Subscriptions', 'Frequently Asked Questions About Refunds',
        ];

        /** @var array<string, int> tag_name => id */
        $tagIdsByName = Tag::query()->pluck('id', 'tag_name')->all();
        $weightedTagNames = $this->weightedTagNamePool();

        for ($i = 1; $i <= self::ITEM_COUNT; $i++) {
            $knowledgebase = Knowledgebase::create([
                'audience' => random_int(1, 100) <= self::REGISTERED_ONLY_PERCENTAGE ? 'A' : 'P',
                'title' => $topics[array_rand($topics)],
                'main_content' => $this->paragraph(3, 6),
                'additional_content' => random_int(1, 100) <= 80 ? $this->paragraph(2, 4) : null,
                'published_at' => now()->subDays(random_int(0, 730))->subMinutes(random_int(0, 1440)),
            ]);

            $tagCount = random_int(self::MIN_TAGS_PER_ARTICLE, self::MAX_TAGS_PER_ARTICLE);
            $tagNames = $this->pickWeightedTags($weightedTagNames, $tagCount);
            $tagIds = array_map(static fn (string $name) => $tagIdsByName[$name], $tagNames);

            $knowledgebase->tags()->attach($tagIds);
        }
    }
}
