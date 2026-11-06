package files

import (
	"context"
	"io"
	"time"
)

type ObjectMetadata struct {
	Key          string
	Size         int64
	ETag         string
	ContentType  string
	LastModified time.Time
	Metadata     map[string]string
}

type PutOptions struct {
	ContentType string
	Size        int64
	Metadata    map[string]string
}

type ObjectStorage interface {
	Health(context.Context) error
	Put(context.Context, string, PutOptions, io.Reader) error
	Get(context.Context, string) (io.ReadCloser, error)
	Delete(context.Context, string) error
	Head(context.Context, string) (ObjectMetadata, error)
	List(context.Context, string) ([]ObjectMetadata, error)
}
