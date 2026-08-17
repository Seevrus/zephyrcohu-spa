<?php

namespace Database\Seeders;

use App\DocumentCategory;
use App\Models\Document;
use Illuminate\Database\Seeder;

class DocumentSeeder extends Seeder {
    /**
     * Every category has exactly one committed sample file under storage/app, so all
     * seeded rows for a category point at that same file - only the metadata varies.
     *
     * @var array<string, array{path: string, displayName: string}>
     */
    private const array CATEGORY_FIXTURES = [
        'integra-flyer' => ['path' => 'integra/tajekoztato/test-flyer-01.pdf', 'displayName' => 'Flyer'],
        'integra-trial' => ['path' => 'integra/probaverzio/test-trial-01.zip', 'displayName' => 'Trial Version'],
        'integra-update' => ['path' => 'integra/programfrissites/test-update-01.zip', 'displayName' => 'Update'],
        'integra-documentation' => ['path' => 'integra/dokumentacio/test-documentation-01.pdf', 'displayName' => 'Documentation'],
        'integra-other' => ['path' => 'integra/egyeb/test-other-01.txt', 'displayName' => 'Other Document'],
    ];

    private const int ITEMS_PER_CATEGORY = 30;

    public function run(): void {
        foreach (DocumentCategory::cases() as $category) {
            $fixture = self::CATEGORY_FIXTURES[$category->value];

            for ($i = 1; $i <= self::ITEMS_PER_CATEGORY; $i++) {
                $version = sprintf('%d.%d', 2022 + intdiv($i - 1, 10), (($i - 1) % 10) + 1);

                Document::create([
                    'category' => $category,
                    'display_name' => sprintf('%s %s', $fixture['displayName'], $version),
                    'version' => $version,
                    'path' => $fixture['path'],
                    'published_at' => now()->subDays(random_int(0, 730))->subMinutes(random_int(0, 1440)),
                ]);
            }
        }
    }
}
