<?php

namespace App\Http\Controllers;

class AdminPingController extends Controller {
    public function ping() {
        return response()->json(['data' => 'ok']);
    }
}
