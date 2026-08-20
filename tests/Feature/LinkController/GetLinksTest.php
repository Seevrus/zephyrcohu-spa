<?php

describe('Get Links', function () {
    beforeEach(function () {
        resetGetLinksTestData();
    });

    test('retrieves all links ordered by category name then title', function () {
        $response = $this->getJson('/api/knowledgebase/links');

        $response->assertStatus(200)->assertExactJson(['data' => [
            [
                'id' => 3,
                'title' => 'GitHub',
                'url' => 'https://github.com',
                'category' => 'Community',
            ],
            [
                'id' => 1,
                'title' => 'Stack Overflow',
                'url' => 'https://stackoverflow.com',
                'category' => 'Community',
            ],
            [
                'id' => 4,
                'title' => 'Laravel Documentation',
                'url' => 'https://laravel.com/docs',
                'category' => 'Documentation',
            ],
            [
                'id' => 2,
                'title' => 'PHP Manual',
                'url' => 'https://www.php.net/manual/en/',
                'category' => 'Documentation',
            ],
        ]]);
    });
});

function resetGetLinksTestData(): void {
    DB::table('link_categories')->insert([
        ['id' => 1, 'category_name' => 'Documentation'],
        ['id' => 2, 'category_name' => 'Community'],
    ]);

    DB::table('links')->insert([
        [
            'id' => 1,
            'title' => 'Stack Overflow',
            'link_category_id' => 2,
            'url' => 'https://stackoverflow.com',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'id' => 2,
            'title' => 'PHP Manual',
            'link_category_id' => 1,
            'url' => 'https://www.php.net/manual/en/',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'id' => 3,
            'title' => 'GitHub',
            'link_category_id' => 2,
            'url' => 'https://github.com',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'id' => 4,
            'title' => 'Laravel Documentation',
            'link_category_id' => 1,
            'url' => 'https://laravel.com/docs',
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);
}
