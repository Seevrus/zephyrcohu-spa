<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

describe('Get Newsletter Recipients', function () {
    beforeEach(function () {
        resetGetNewsletterRecipientsTestData();
    });

    test('lists only pending eligible users, ordered by email', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/newsletters/1/recipients');

        $response->assertStatus(200)->assertExactJson(['data' => [
            ['id' => 3, 'email' => 'user002@example.com'],
            ['id' => 4, 'email' => 'user003@example.com'],
        ]]);
    });

    test('returns an empty array once every eligible user has received it', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/newsletters/2/recipients');

        $response->assertStatus(200)->assertExactJson(['data' => []]);
    });

    test('returns 404 for an unknown newsletter', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/newsletters/999/recipients');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->getJson('/api/admin/newsletters/1/recipients');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->getJson('/api/admin/newsletters/1/recipients');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetGetNewsletterRecipientsTestData(): void {
    DB::table('users')->insert([
        [
            'id' => 1,
            'email' => 'user001@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 1,
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
        [
            'id' => 3,
            'email' => 'user002@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 1,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ],
        [
            'id' => 4,
            'email' => 'user003@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 1,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ],
        [
            'id' => 5,
            'email' => 'user004@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 0,
            'newsletter' => 1,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ],
    ]);

    DB::table('user_admins')->insert([
        'user_id' => 2,
    ]);

    DB::table('newsletters')->insert([
        [
            'id' => 1,
            'subject' => 'A hírlevél',
            'content' => '<p>A tartalom</p>',
            'created_at' => '2026-02-08 21:31:00',
            'updated_at' => '2026-02-08 21:31:00',
        ],
        [
            'id' => 2,
            'subject' => 'B hírlevél',
            'content' => '<p>B tartalom</p>',
            'created_at' => '2026-02-08 21:31:30',
            'updated_at' => '2026-02-08 21:31:30',
        ],
    ]);

    DB::table('users_newsletters')->insert([
        // newsletter 1: only user 1 has received it, 3 and 4 remain pending
        ['user_id' => 1, 'newsletter_id' => 1],
        // newsletter 2: fully sent to every eligible (confirmed + opted in) user
        ['user_id' => 1, 'newsletter_id' => 2],
        ['user_id' => 3, 'newsletter_id' => 2],
        ['user_id' => 4, 'newsletter_id' => 2],
    ]);
}
