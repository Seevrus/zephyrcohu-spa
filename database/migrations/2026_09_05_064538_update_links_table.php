<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::table('links', function (Blueprint $table) {
            $table->dropForeign(['link_category_id']);
            $table->foreignId('link_category_id')->nullable()->change();
            $table->foreign('link_category_id')
                ->references('id')->on('link_categories')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     *
     * Lossy: a NOT NULL constraint cannot be restored without a category to put
     * uncategorised links into, so this deletes any link left with a null
     * category before recreating the original cascade-on-delete foreign key.
     */
    public function down(): void {
        Schema::table('links', function (Blueprint $table) {
            $table->dropForeign(['link_category_id']);
        });

        DB::table('links')->whereNull('link_category_id')->delete();

        Schema::table('links', function (Blueprint $table) {
            $table->foreignId('link_category_id')->nullable(false)->change();
            $table->foreign('link_category_id')
                ->references('id')->on('link_categories')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }
};
