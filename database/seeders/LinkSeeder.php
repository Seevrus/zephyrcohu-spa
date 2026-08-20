<?php

namespace Database\Seeders;

use App\Models\Link;
use App\Models\LinkCategory;
use Illuminate\Database\Seeder;

class LinkSeeder extends Seeder {
    /**
     * @var array<string, array<int, array{title: string, url: string}>>
     */
    private const array LINKS_BY_CATEGORY = [
        'Tools' => [
            ['title' => 'Figma', 'url' => 'https://www.figma.com'],
            ['title' => 'GitHub', 'url' => 'https://github.com'],
            ['title' => 'Postman', 'url' => 'https://www.postman.com'],
            ['title' => 'Slack', 'url' => 'https://slack.com'],
            ['title' => 'Trello', 'url' => 'https://trello.com'],
            ['title' => 'Visual Studio Code', 'url' => 'https://code.visualstudio.com'],
        ],
        'Documentation' => [
            ['title' => 'Laravel Documentation', 'url' => 'https://laravel.com/docs'],
            ['title' => 'MDN Web Docs', 'url' => 'https://developer.mozilla.org'],
            ['title' => 'PHP Manual', 'url' => 'https://www.php.net/manual/en/'],
            ['title' => 'Angular Documentation', 'url' => 'https://angular.dev'],
            ['title' => 'PostgreSQL Documentation', 'url' => 'https://www.postgresql.org/docs/'],
            ['title' => 'TypeScript Handbook', 'url' => 'https://www.typescriptlang.org/docs/'],
            ['title' => 'Pest Documentation', 'url' => 'https://pestphp.com/docs'],
        ],
        'Community' => [
            ['title' => 'Laravel Forums', 'url' => 'https://laracasts.com/discuss'],
            ['title' => 'Laravel News', 'url' => 'https://laravel-news.com'],
            ['title' => 'Reddit r/laravel', 'url' => 'https://www.reddit.com/r/laravel/'],
            ['title' => 'Stack Overflow', 'url' => 'https://stackoverflow.com'],
            ['title' => 'Angular Discord', 'url' => 'https://discord.gg/angular'],
            ['title' => 'Dev.to', 'url' => 'https://dev.to'],
            ['title' => 'Hacker News', 'url' => 'https://news.ycombinator.com'],
            ['title' => 'Awesome Laravel', 'url' => 'https://github.com/chiraggude/awesome-laravel'],
        ],
    ];

    public function run(): void {
        foreach (self::LINKS_BY_CATEGORY as $categoryName => $links) {
            $category = LinkCategory::where('category_name', $categoryName)->firstOrFail();

            foreach ($links as $link) {
                Link::create([
                    'title' => $link['title'],
                    'link_category_id' => $category->id,
                    'url' => $link['url'],
                ]);
            }
        }
    }
}
