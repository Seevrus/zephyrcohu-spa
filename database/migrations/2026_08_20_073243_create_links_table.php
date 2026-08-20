<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('links', function (Blueprint $table) {
            $table->id();
            $table->string('title', 500);
            $table->foreignId('link_category_id')->constrained('link_categories')->cascadeOnUpdate()->cascadeOnDelete();
            $table->string('url', 500);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('links');
    }
};
