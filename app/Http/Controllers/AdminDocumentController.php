<?php

namespace App\Http\Controllers;

use App\DocumentCategory;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\UpdateDocumentRequest;
use App\Http\Resources\AdminDocumentResource;
use App\Models\Document;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class AdminDocumentController extends Controller {
    public function getDocuments() {
        try {
            $documents = Document::orderBy('category')->orderBy('display_name')->get();

            return AdminDocumentResource::collection($documents);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function getDocument(Document $document) {
        try {
            return new AdminDocumentResource($document);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function storeDocument(StoreDocumentRequest $request) {
        try {
            $category = DocumentCategory::from($request->validated('category'));
            $disk = $this->diskFor($category);
            $file = $request->file('file');
            $directory = "integra/{$category->value}";
            $fileName = $this->slugifyFileName($file);
            $path = "{$directory}/{$fileName}";

            if (Storage::disk($disk)->exists($path)) {
                throw ValidationException::withMessages([
                    'file' => 'Ez a fájl korábban már feltöltésre került!',
                ]);
            }

            $file->storeAs($directory, $fileName, $disk);

            try {
                $document = Document::create([
                    'category' => $category,
                    'display_name' => $request->validated('displayName'),
                    'version' => $request->validated('version'),
                    'path' => $path,
                    'published_at' => $request->validated('publishedAt'),
                ]);
            } catch (Throwable $e) {
                Storage::disk($disk)->delete($path);

                throw $e;
            }

            return (new AdminDocumentResource($document))->response()->setStatusCode(201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function updateDocument(UpdateDocumentRequest $request, Document $document) {
        try {
            $newCategory = DocumentCategory::from($request->validated('category'));
            $oldCategory = $document->category;
            $oldDisk = $this->diskFor($oldCategory);
            $oldPath = $document->path;
            $file = $request->file('file');
            $attributes = [
                'display_name' => $request->validated('displayName'),
                'version' => $request->validated('version'),
                'published_at' => $request->validated('publishedAt'),
            ];

            if ($file !== null) {
                $this->replaceFile($document, $file, $newCategory, $oldDisk, $oldPath, $attributes);
            } elseif ($newCategory !== $oldCategory) {
                $this->moveFile($document, $newCategory, $oldDisk, $oldPath, $attributes);
            } else {
                $document->update($attributes);
            }

            return new AdminDocumentResource($document);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function deleteDocument(Document $document) {
        try {
            $disk = $this->diskFor($document->category);

            if (! Storage::disk($disk)->delete($document->path)) {
                Log::warning('Admin document delete: file was already missing from disk.', [
                    'document_id' => $document->id,
                    'disk' => $disk,
                    'path' => $document->path,
                ]);
            }

            $document->delete();

            return response(null, 204);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function replaceFile(
        Document $document,
        UploadedFile $file,
        DocumentCategory $newCategory,
        string $oldDisk,
        string $oldPath,
        array $attributes,
    ): void {
        $newDisk = $this->diskFor($newCategory);
        $directory = "integra/{$newCategory->value}";
        $fileName = $this->slugifyFileName($file);
        $newPath = "{$directory}/{$fileName}";

        if ($newPath !== $oldPath && Storage::disk($newDisk)->exists($newPath)) {
            throw ValidationException::withMessages([
                'file' => 'Ez a fájl korábban már feltöltésre került!',
            ]);
        }

        $file->storeAs($directory, $fileName, $newDisk);

        try {
            $document->update([...$attributes, 'category' => $newCategory, 'path' => $newPath]);
        } catch (Throwable $e) {
            Storage::disk($newDisk)->delete($newPath);

            throw $e;
        }

        Storage::disk($oldDisk)->delete($oldPath);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function moveFile(
        Document $document,
        DocumentCategory $newCategory,
        string $oldDisk,
        string $oldPath,
        array $attributes,
    ): void {
        $newDisk = $this->diskFor($newCategory);
        $newPath = "integra/{$newCategory->value}/".basename($oldPath);

        if (Storage::disk($newDisk)->exists($newPath)) {
            throw ValidationException::withMessages([
                'category' => 'Az új kategóriában ilyen nevű fájl már létezik.',
            ]);
        }

        Storage::disk($newDisk)->put($newPath, Storage::disk($oldDisk)->get($oldPath));

        try {
            $document->update([...$attributes, 'category' => $newCategory, 'path' => $newPath]);
        } catch (Throwable $e) {
            Storage::disk($newDisk)->delete($newPath);

            throw $e;
        }

        Storage::disk($oldDisk)->delete($oldPath);
    }

    private function diskFor(DocumentCategory $category): string {
        return (new Document(['category' => $category]))->disk();
    }

    private function slugifyFileName(UploadedFile $file): string {
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $baseName = Str::slug(pathinfo($originalName, PATHINFO_FILENAME));

        return $extension !== '' ? "{$baseName}.{$extension}" : $baseName;
    }
}
