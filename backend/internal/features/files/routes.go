package files

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"rkm-service-manager/backend/internal/shared/httpx"
	"rkm-service-manager/backend/internal/shared/permissions"
	"strings"
	"time"
)

type Authorizer interface {
	RequirePermission(string, http.HandlerFunc) http.HandlerFunc
	CurrentUser(*http.Request) (string, string, bool)
}

type Module struct {
	storage    ObjectStorage
	authorizer Authorizer
}

func New(storage ObjectStorage, authorizer Authorizer) *Module {
	return &Module{storage: storage, authorizer: authorizer}
}

func (module *Module) Register(mux *http.ServeMux) {
	mux.HandleFunc(
		"GET /api/files/storage-health",
		module.authorizer.RequirePermission(
			permissions.FilesView,
			module.handleStorageHealth,
		),
	)

	mux.HandleFunc(
		"GET /api/files",
		module.authorizer.RequirePermission(
			permissions.FilesView,
			module.handleList,
		),
	)

	mux.HandleFunc(
		"POST /api/files",
		module.authorizer.RequirePermission(
			permissions.FilesManage,
			module.handleUpload,
		),
	)

	mux.HandleFunc(
		"GET /api/files/{key...}",
		module.authorizer.RequirePermission(
			permissions.FilesView,
			module.handleDownload,
		),
	)

	mux.HandleFunc(
		"DELETE /api/files/{key...}",
		module.authorizer.RequirePermission(
			permissions.FilesManage,
			module.handleDelete,
		),
	)
}

type fileResponse struct {
	Key          string    `json:"key"`
	Name         string    `json:"name"`
	Size         int64     `json:"size"`
	ETag         string    `json:"etag"`
	ContentType  string    `json:"contentType"`
	UploadedByID string    `json:"uploadedById"`
	UploadedBy   string    `json:"uploadedBy"`
	UploadedAt   time.Time `json:"uploadedAt"`
}

func (module *Module) handleList(writer http.ResponseWriter, request *http.Request) {
	requestContext, cancel := context.WithTimeout(request.Context(), 30*time.Second)
	defer cancel()

	objects, listError := module.storage.List(
		requestContext,
		request.URL.Query().Get("prefix"),
	)
	if listError != nil {
		writeStorageError(writer, "files_list_failed", listError)
		return
	}

	files := make([]fileResponse, 0, len(objects))
	for _, object := range objects {
		metadata, headError := module.storage.Head(requestContext, object.Key)
		if headError != nil {
			writeStorageError(writer, "file_metadata_failed", headError)
			return
		}

		files = append(files, fileResponseFromMetadata(metadata))
	}

	httpx.WriteJSON(writer, http.StatusOK, files)
}

func (module *Module) handleUpload(writer http.ResponseWriter, request *http.Request) {
	request.Body = http.MaxBytesReader(writer, request.Body, 100<<20)

	file, header, formError := request.FormFile("file")
	if formError != nil {
		httpx.WriteJSON(writer, http.StatusBadRequest, map[string]string{"error": "file_required"})
		return
	}
	defer file.Close()

	uploaderID, uploaderName, authenticated := module.authorizer.CurrentUser(request)
	if !authenticated {
		httpx.WriteJSON(writer, http.StatusUnauthorized, map[string]string{"error": "authentication_required"})
		return
	}

	key, keyError := newObjectKey(header)
	if keyError != nil {
		writeStorageError(writer, "file_key_generation_failed", keyError)
		return
	}

	uploadedAt := time.Now().UTC()
	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	metadata := map[string]string{
		"uploaded-by-id":   uploaderID,
		"uploaded-by-name": uploaderName,
		"uploaded-at":      uploadedAt.Format(time.RFC3339),
		"original-name":    filepath.Base(header.Filename),
	}

	uploadError := module.storage.Put(
		request.Context(),
		key,
		PutOptions{
			ContentType: contentType,
			Size:        header.Size,
			Metadata:    metadata,
		},
		file,
	)
	if uploadError != nil {
		writeStorageError(writer, "file_upload_failed", uploadError)
		return
	}

	storedFile, headError := module.storage.Head(request.Context(), key)
	if headError != nil {
		writeStorageError(writer, "file_metadata_failed", headError)
		return
	}

	httpx.WriteJSON(writer, http.StatusCreated, fileResponseFromMetadata(storedFile))
}

func (module *Module) handleDownload(writer http.ResponseWriter, request *http.Request) {
	key := request.PathValue("key")
	if key == "" {
		httpx.WriteJSON(writer, http.StatusBadRequest, map[string]string{"error": "file_key_required"})
		return
	}

	requestContext, cancel := context.WithTimeout(request.Context(), 30*time.Second)
	defer cancel()

	metadata, headError := module.storage.Head(requestContext, key)
	if headError != nil {
		writeStorageError(writer, "file_metadata_failed", headError)
		return
	}

	body, getError := module.storage.Get(requestContext, key)
	if getError != nil {
		writeStorageError(writer, "file_download_failed", getError)
		return
	}
	defer body.Close()

	contentType := metadata.ContentType
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	writer.Header().Set("Content-Type", contentType)
	if request.URL.Query().Get("download") == "1" {
		writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", originalName(metadata)))
	} else {
		writer.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=%q", originalName(metadata)))
	}

	if metadata.Size >= 0 {
		writer.Header().Set("Content-Length", fmt.Sprint(metadata.Size))
	}

	if _, copyError := io.Copy(writer, body); copyError != nil {
		log.Printf("files download failed after headers: %v", copyError)
	}
}

func (module *Module) handleDelete(writer http.ResponseWriter, request *http.Request) {
	key := request.PathValue("key")
	if key == "" {
		httpx.WriteJSON(writer, http.StatusBadRequest, map[string]string{"error": "file_key_required"})
		return
	}

	if deleteError := module.storage.Delete(request.Context(), key); deleteError != nil {
		writeStorageError(writer, "file_delete_failed", deleteError)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func fileResponseFromMetadata(metadata ObjectMetadata) fileResponse {
	uploadedAt := metadata.LastModified
	if value := metadataValue(metadata.Metadata, "uploaded-at"); value != "" {
		if parsed, parseError := time.Parse(time.RFC3339, value); parseError == nil {
			uploadedAt = parsed
		}
	}

	return fileResponse{
		Key:          metadata.Key,
		Name:         originalName(metadata),
		Size:         metadata.Size,
		ETag:         metadata.ETag,
		ContentType:  metadata.ContentType,
		UploadedByID: metadataValue(metadata.Metadata, "uploaded-by-id"),
		UploadedBy:   metadataValue(metadata.Metadata, "uploaded-by-name"),
		UploadedAt:   uploadedAt,
	}
}

func originalName(metadata ObjectMetadata) string {
	if name := metadataValue(metadata.Metadata, "original-name"); name != "" {
		return filepath.Base(name)
	}
	return filepath.Base(metadata.Key)
}

func metadataValue(metadata map[string]string, key string) string {
	for metadataKey, value := range metadata {
		if strings.EqualFold(metadataKey, key) {
			return value
		}
	}
	return ""
}

func newObjectKey(header *multipart.FileHeader) (string, error) {
	randomBytes := make([]byte, 12)
	if _, randomError := rand.Read(randomBytes); randomError != nil {
		return "", randomError
	}

	return fmt.Sprintf("files/%s-%s", hex.EncodeToString(randomBytes), filepath.Base(header.Filename)), nil
}

func writeStorageError(writer http.ResponseWriter, code string, storageError error) {
	log.Printf("%s: %v", code, storageError)
	httpx.WriteJSON(writer, http.StatusBadGateway, map[string]string{"error": code})
}

func (module *Module) handleStorageHealth(
	writer http.ResponseWriter,
	request *http.Request,
) {
	requestContext, cancel := context.WithTimeout(request.Context(), 5*time.Second)
	defer cancel()

	if healthError := module.storage.Health(requestContext); healthError != nil {
		log.Printf("files storage health failed: %v", healthError)
		httpx.WriteJSON(
			writer,
			http.StatusServiceUnavailable,
			map[string]string{
				"status": "unhealthy",
				"error":  "object_storage_unavailable",
			},
		)
		return
	}

	httpx.WriteJSON(
		writer,
		http.StatusOK,
		map[string]string{
			"status":   "healthy",
			"provider": "garage",
		},
	)
}
