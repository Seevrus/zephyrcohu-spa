<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::table('users_new_passwords', function (Blueprint $table) {
            $table->string('password_code')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::table('users_new_passwords', function (Blueprint $table) {
            $table->integer('password_code')->unsigned()->change();
        });
    }
};
