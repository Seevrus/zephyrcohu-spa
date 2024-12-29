<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('users_new_emails', function (Blueprint $table) {
            $table->foreignIdFor(User::class)
                ->primary()
                ->constrained('users', 'id')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->string('new_email')->unique();
            $table->integer('email_code')->unsigned();
            $table->timestamp('issued_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('users_new_emails');
    }
};
