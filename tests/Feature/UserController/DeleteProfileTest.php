<?php

use App\Mail\UserDeleted;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

describe('Delete Profile Controller', function () {
    beforeEach(function () {
        resetDeleteProfileTestData();

        $this->user = User::find(1);
    });

    test('should fail if user is not authenticated', function () {
        $response = $this->deleteJson('/api/users/profile');
        $response->assertStatus(401);
    });

    test('should delete the user profile', function () {
        Mail::fake();

        $response = $this
            ->actingAs($this->user)
            ->withHeaders(['Origin' => 'http://127.0.0.1:4200'])
            ->deleteJson('/api/users/profile');

        $response->assertStatus(204);

        $this->assertDatabaseMissing('users', [
            'id' => 1,
        ]);

        Mail::assertSent(UserDeleted::class, function ($mail) {
            return $mail->hasTo('user001@example.com');
        });
    });

    test('should fail if the request does not come from the UI', function () {
        $response = $this
            ->actingAs($this->user)
            ->withHeaders(['Origin' => 'https://google.com'])
            ->deleteJson('/api/users/profile');

        $response->assertStatus(400)->assertExactJson([
            'code' => 'Bad Request',
            'message' => 'The server cannot or will not process the request due to something that is perceived to be a client error.',
            'status' => 400,
        ]);
    });
});

function resetDeleteProfileTestData(): void {
    DB::table('users')->delete();
    DB::statement('ALTER TABLE users AUTO_INCREMENT = 1');

    DB::table('users')->insert([
        [
            'id' => 1,
            'email' => 'user001@example.com',
            'password' => Hash::make('password'),
            'confirmed' => 1,
            'newsletter' => 0,
            'cookies' => 1,
        ],
    ]);
}
