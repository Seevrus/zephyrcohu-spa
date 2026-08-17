<?php

namespace Database\Seeders;

use App\Models\Tag;
use Database\Seeders\Concerns\HasWeightedTagPool;
use Illuminate\Database\Seeder;

class TagSeeder extends Seeder {
    use HasWeightedTagPool;

    public function run(): void {
        foreach (array_keys($this->weightedTagPool()) as $tagName) {
            Tag::create(['tag_name' => $tagName]);
        }
    }
}
