<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Store Knowledgebase Item', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest');
        resetStoreKnowledgebaseTestData();
    });

    test('creates an article and returns 201 with the row', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/knowledgebase', [
            'audience' => 'P',
            'title' => 'New title',
            'mainContent' => '<p>Main content</p>',
            'additionalContent' => '<p>Additional content</p>',
            'publishedAt' => '2026-03-01 10:00:00',
            'tags' => [],
        ]);

        $response->assertStatus(201)->assertJson(['data' => [
            'audience' => 'P',
            'title' => 'New title',
            'mainContent' => '<p>Main content</p>',
            'additionalContent' => '<p>Additional content</p>',
            'tags' => [],
            'readerCount' => 0,
            'readers' => [],
        ]]);

        $this->assertDatabaseHas('knowledgebase', [
            'audience' => 'P',
            'title' => 'New title',
            'main_content' => '<p>Main content</p>',
            'additional_content' => '<p>Additional content</p>',
        ]);
    });

    test('accepts a missing tags array', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/knowledgebase', [
            'audience' => 'P',
            'title' => 'New title',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-01 10:00:00',
        ]);

        $response->assertStatus(201)->assertJson(['data' => ['tags' => []]]);
    });

    test('creates missing tags and attaches them', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/knowledgebase', [
            'audience' => 'P',
            'title' => 'New title',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-01 10:00:00',
            'tags' => ['INTEGRA', 'HR'],
        ]);

        $response->assertStatus(201);

        $tagNames = collect($response->json('data.tags'))->pluck('name')->sort()->values();

        expect($tagNames->all())->toBe(['HR', 'INTEGRA']);

        $this->assertDatabaseHas('tags', ['tag_name' => 'INTEGRA']);
        $this->assertDatabaseHas('tags', ['tag_name' => 'HR']);
        $this->assertDatabaseCount('tags', 2);
    });

    test('reuses an existing tag by name instead of duplicating it', function () {
        DB::table('tags')->insert(['id' => 1, 'tag_name' => 'INTEGRA']);

        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/knowledgebase', [
            'audience' => 'P',
            'title' => 'New title',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-01 10:00:00',
            'tags' => ['INTEGRA'],
        ]);

        $response->assertStatus(201)->assertJson(['data' => ['tags' => [
            ['id' => 1, 'name' => 'INTEGRA'],
        ]]]);

        $this->assertDatabaseCount('tags', 1);
    });

    test('two articles submitting the same new tag name end up sharing one tag row', function () {
        Sanctum::actingAs(User::find(2));

        $first = $this->postJson('/api/admin/knowledgebase', [
            'audience' => 'P',
            'title' => 'First',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-01 10:00:00',
            'tags' => ['INTEGRA'],
        ]);

        $second = $this->postJson('/api/admin/knowledgebase', [
            'audience' => 'P',
            'title' => 'Second',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-01 10:00:00',
            'tags' => ['INTEGRA'],
        ]);

        $first->assertStatus(201);
        $second->assertStatus(201);

        expect($first->json('data.tags.0.id'))->toBe($second->json('data.tags.0.id'));
        $this->assertDatabaseCount('tags', 1);
    });

    test('trims and de-duplicates tag names', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/knowledgebase', [
            'audience' => 'P',
            'title' => 'New title',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-01 10:00:00',
            'tags' => [' INTEGRA ', 'INTEGRA'],
        ]);

        $response->assertStatus(201)->assertJson(['data' => ['tags' => [
            ['name' => 'INTEGRA'],
        ]]]);

        $this->assertDatabaseCount('tags', 1);
    });

    test('rejects a missing title', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/knowledgebase', [
            'audience' => 'P',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-01 10:00:00',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['title']);
    });

    test('rejects an invalid audience', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/knowledgebase', [
            'audience' => 'X',
            'title' => 'New title',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-01 10:00:00',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['audience']);
    });

    test('returns 404 for a guest', function () {
        $response = $this->postJson('/api/admin/knowledgebase', [
            'audience' => 'P',
            'title' => 'New title',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-01 10:00:00',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->postJson('/api/admin/knowledgebase', [
            'audience' => 'P',
            'title' => 'New title',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-01 10:00:00',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetStoreKnowledgebaseTestData(): void {
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
}
