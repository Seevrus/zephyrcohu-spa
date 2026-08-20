<?php

namespace Database\Seeders;

use App\Models\LinkCategory;
use Illuminate\Database\Seeder;

class LinkCategorySeeder extends Seeder {
    /**
     * @var array<int, string>
     */
    private const array CATEGORIES = [
        'Tools',
        'Documentation',
        'Community',
    ];

    public function run(): void {
        foreach (self::CATEGORIES as $categoryName) {
            LinkCategory::create([
                'category_name' => $categoryName,
            ]);
        }
    }
}
