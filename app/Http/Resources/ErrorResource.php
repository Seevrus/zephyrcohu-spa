<?php

namespace App\Http\Resources;

use App\Http\Requests\ErrorCode;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ErrorResource extends JsonResource {
    public static $wrap = null;

    public function __construct(
        private readonly int $status,
        private readonly ErrorCode $errorCode,
        private readonly ?string $message = null,
    ) {
        parent::__construct(null);
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array {
        $resource = [
            'status' => $this->status,
            'code' => $this->errorCode,
        ];

        if ($this->message) {
            $resource['message'] = $this->message;
        }

        return $resource;
    }
}
