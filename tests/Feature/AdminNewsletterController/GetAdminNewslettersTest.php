<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Get Admin Newsletters', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest');
        resetGetAdminNewslettersTestData();
    });

    test('lists newsletters newest first with recipient/sent counters', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/newsletters');

        $response->assertStatus(200)->assertExactJson(['data' => [
            [
                'id' => 2,
                'subject' => 'B hírlevél',
                'createdAt' => '2026-02-08T20:31:30.000000Z',
                'recipientCount' => 3,
                'sentCount' => 3,
                'isSentToEveryone' => true,
            ],
            [
                'id' => 1,
                'subject' => 'A hírlevél',
                'createdAt' => '2026-02-08T20:31:00.000000Z',
                'recipientCount' => 3,
                'sentCount' => 1,
                'isSentToEveryone' => false,
            ],
        ]]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->getJson('/api/admin/newsletters');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->getJson('/api/admin/newsletters');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

describe('Get Admin Newsletter', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest');
        resetGetAdminNewslettersTestData();
    });

    test('returns a single newsletter including its content', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/newsletters/1');

        $response->assertStatus(200)->assertExactJson(['data' => [
            'id' => 1,
            'subject' => 'A hírlevél',
            'content' => '<p>A tartalom</p>',
            'createdAt' => '2026-02-08T20:31:00.000000Z',
            'recipientCount' => 3,
            'sentCount' => 1,
            'isSentToEveryone' => false,
        ]]);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/newsletters/999');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->getJson('/api/admin/newsletters/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->getJson('/api/admin/newsletters/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetGetAdminNewslettersTestData(): void {
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
            'confirmed' => 1,
            'newsletter' => 0,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ],
        [
            'id' => 6,
            'email' => 'user005@example.com',
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
        ['user_id' => 1, 'newsletter_id' => 1],
        ['user_id' => 1, 'newsletter_id' => 2],
        ['user_id' => 3, 'newsletter_id' => 2],
        ['user_id' => 4, 'newsletter_id' => 2],
    ]);
}
