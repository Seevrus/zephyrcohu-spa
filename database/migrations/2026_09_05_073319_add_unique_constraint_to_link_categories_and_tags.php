<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::table('link_categories', function (Blueprint $table) {
            $table->unique('category_name');
        });

        Schema::table('tags', function (Blueprint $table) {
            $table->unique('tag_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::table('link_categories', function (Blueprint $table) {
            $table->dropUnique(['category_name']);
        });

        Schema::table('tags', function (Blueprint $table) {
            $table->dropUnique(['tag_name']);
        });
    }
};
