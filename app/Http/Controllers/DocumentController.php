<?php

namespace App\Http\Controllers;

use App\DocumentCategory;
use App\ErrorCode;
use App\Http\Resources\DocumentResource;
use App\Http\Resources\ErrorResource;
use App\Models\Document;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Throwable;

class DocumentController extends Controller {
    public function getDocuments(DocumentCategory $category) {
        try {
            $canView = Gate::inspect('viewCategory', [Document::class, $category]);

            if ($canView->denied()) {
                return response(
                    new ErrorResource($canView->status(), ErrorCode::from($canView->message())),
                    $canView->status()
                );
            }

            $documents = Document::where('category', $category->value)
                ->orderBy('published_at', 'desc')
                ->get();

            return DocumentResource::collection($documents);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function downloadDocument(Document $document) {
        $canDownload = Gate::inspect('download', $document);

        if ($canDownload->denied()) {
            return response(
                new ErrorResource($canDownload->status(), ErrorCode::from($canDownload->message())),
                $canDownload->status()
            );
        }

        return Storage::disk($document->disk())->download($document->path, basename($document->path));
    }
}
