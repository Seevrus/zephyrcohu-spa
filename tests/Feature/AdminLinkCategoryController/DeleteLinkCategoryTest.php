<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

describe('Delete Link Category', function () {
    beforeEach(function () {
        resetDeleteLinkCategoryTestData();
    });

    test('deletes the category and its links survive with a null category, reading back as "Egyéb"', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/link_categories/1');

        $response->assertStatus(204)->assertNoContent();

        $this->assertDatabaseMissing('link_categories', ['id' => 1]);
        $this->assertDatabaseHas('links', ['id' => 1, 'link_category_id' => null]);

        $publicResponse = $this->getJson('/api/knowledgebase/links');

        $publicResponse->assertStatus(200)->assertJsonFragment([
            'id' => 1,
            'category' => 'Egyéb',
        ]);
    });

    test('leaves other categories\' links untouched', function () {
        Sanctum::actingAs(User::find(2));

        $this->deleteJson('/api/admin/link_categories/1');

        $this->assertDatabaseHas('links', ['id' => 2, 'link_category_id' => 2]);
        $this->assertDatabaseHas('link_categories', ['id' => 2]);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/link_categories/999');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->deleteJson('/api/admin/link_categories/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->deleteJson('/api/admin/link_categories/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetDeleteLinkCategoryTestData(): void {
    DB::table('users')->insert([
        [
            'id' => 1,
            'email' => 'user001@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 0,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ],
        [
            'id' => 2,
            'email' => 'admin001@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 0,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ],
    ]);

    DB::table('user_admins')->insert([
        'user_id' => 2,
    ]);

    DB::table('link_categories')->insert([
        ['id' => 1, 'category_name' => 'Documentation'],
        ['id' => 2, 'category_name' => 'Community'],
    ]);

    DB::table('links')->insert([
        [
            'id' => 1,
            'title' => 'Laravel Documentation',
            'link_category_id' => 1,
            'url' => 'https://laravel.com/docs',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'id' => 2,
            'title' => 'Stack Overflow',
            'link_category_id' => 2,
            'url' => 'https://stackoverflow.com',
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);
}
