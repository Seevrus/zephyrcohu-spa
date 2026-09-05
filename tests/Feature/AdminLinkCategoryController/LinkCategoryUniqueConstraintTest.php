<?php

use Illuminate\Database\QueryException;

describe('Link Category Unique Constraint', function () {
    test('the database rejects a second category row with the same name', function () {
        DB::table('link_categories')->insert(['category_name' => 'Community']);

        expect(fn () => DB::table('link_categories')->insert(['category_name' => 'Community']))
            ->toThrow(QueryException::class);
    });
});
