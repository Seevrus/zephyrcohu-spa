<?php

use Illuminate\Database\QueryException;

describe('Tag Unique Constraint', function () {
    test('the database rejects a second tag row with the same name', function () {
        DB::table('tags')->insert(['tag_name' => 'Onboarding']);

        expect(fn () => DB::table('tags')->insert(['tag_name' => 'Onboarding']))
            ->toThrow(QueryException::class);
    });
});
