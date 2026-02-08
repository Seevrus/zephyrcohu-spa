<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class NewsCollection extends ResourceCollection {
    private int $total;

    public function __construct($resource, int $total) {
        parent::__construct($resource);
        $this->total = $total;
    }

    public function paginationInformation(Request $request, array $paginated, array $default): array {
        return [
            'meta' => [
                'count' => $default['meta']['total'],
                'total' => $this->total,
            ],
        ];
    }
}
