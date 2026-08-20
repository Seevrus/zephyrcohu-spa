<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder {
    /**
     * Every table this seeder touches, truncated before reseeding so runs are
     * repeatable and ids always restart from 1.
     *
     * @var array<int, string>
     */
    private const array TABLES_TO_TRUNCATE = [
        'personal_access_tokens',
        'users_login_attempts',
        'users_new_passwords',
        'users_new_emails',
        'users_new',
        'user_admins',
        'users_knowledgebase',
        'users_news',
        'knowledgebase_tags',
        'knowledgebase',
        'tags',
        'news',
        'offers',
        'documents',
        'links',
        'link_categories',
        'users',
    ];

    /**
     * Seed the application's database with local development test data.
     */
    public function run(): void {
        Schema::disableForeignKeyConstraints();

        foreach (self::TABLES_TO_TRUNCATE as $table) {
            DB::table($table)->truncate();
        }

        Schema::enableForeignKeyConstraints();

        $this->call([
            UserSeeder::class,
            TagSeeder::class,
            KnowledgebaseSeeder::class,
            NewsSeeder::class,
            OfferSeeder::class,
            DocumentSeeder::class,
            LinkCategorySeeder::class,
            LinkSeeder::class,
        ]);
    }
}
