<?php

use Illuminate\Support\Facades\Storage;

const ORIGIN = 'http://127.0.0.1:4200';

describe('CORS', function () {
    beforeEach(function () {
        config(['cors.allowed_origins' => [ORIGIN]]);
    });

    test('preflights allow every method the API routes use', function (string $method, string $path) {
        $response = $this->call('OPTIONS', $path, [], [], [], [
            'HTTP_ORIGIN' => ORIGIN,
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => $method,
        ]);

        $response->assertStatus(204);
        expect($response->headers->get('Access-Control-Allow-Methods'))->toContain($method);
    })->with([
        ['DELETE', '/api/admin/documents/1'],
        ['GET', '/api/admin/documents'],
        ['POST', '/api/admin/documents'],
        ['PUT', '/api/admin/news/1'],
    ]);

    test('exposes the download file name to the SPA', function () {
        Storage::fake('public');
        DB::table('documents')->insert([
            'id' => 1,
            'category' => 'tajekoztato',
            'display_name' => 'Flyer 2026',
            'version' => '2.0',
            'path' => 'documents/tajekoztato/flyer-2026.pdf',
            'published_at' => '2026-02-10 00:00:00',
            'created_at' => '2026-02-10 00:00:00',
            'updated_at' => '2026-02-10 00:00:00',
        ]);
        Storage::disk('public')->put('documents/tajekoztato/flyer-2026.pdf', 'flyer contents');

        $response = $this->get('/api/documents/integra/1/download', ['Origin' => ORIGIN]);

        $response->assertStatus(200);
        $response->assertDownload('flyer-2026.pdf');
        expect($response->headers->get('Access-Control-Expose-Headers'))
            ->toContain('Content-Disposition');
    });
});
