<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('password');
            $table->tinyInteger('confirmed')->unsigned()->default(0);
            $table->tinyInteger('newsletter')->unsigned()->default(0);
            $table->tinyInteger('cookies')->unsigned()->default(0);
            $table->ipAddress()->nullable();
            $table->timestamp('last_active')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('users');
    }
};
