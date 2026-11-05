package files

import (
	"context"
	"errors"
	"io"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var objectStorageNotConfiguredError = errors.New("object storage is not configured")

type GarageConfig struct {
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
	Bucket          string
	Region          string
}

func GarageConfigFromEnv() GarageConfig {
	return GarageConfig{
		Endpoint:        os.Getenv("GARAGE_S3_API_URL"),
		AccessKeyID:     os.Getenv("GARAGE_S3_ACCESS_KEY_ID"),
		SecretAccessKey: os.Getenv("GARAGE_S3_SECRET_ACCESS_KEY"),
		Bucket:          os.Getenv("GARAGE_S3_BUCKET"),
		Region:          os.Getenv("GARAGE_S3_REGION"),
	}
}

type GarageObjectStorage struct {
	client *s3.Client
	bucket string
	ready  bool
}

func NewGarageObjectStorage(config GarageConfig) *GarageObjectStorage {
	if config.Region == "" {
		config.Region = "us-east-1"
	}

	if config.Endpoint == "" ||
		config.AccessKeyID == "" ||
		config.SecretAccessKey == "" ||
		config.Bucket == "" {
		return &GarageObjectStorage{bucket: config.Bucket}
	}

	awsConfig := aws.Config{
		Region: config.Region,
		Credentials: credentials.NewStaticCredentialsProvider(
			config.AccessKeyID,
			config.SecretAccessKey,
			"",
		),
	}

	client := s3.NewFromConfig(
		awsConfig,
		func(options *s3.Options) {
			options.BaseEndpoint = aws.String(config.Endpoint)
			options.UsePathStyle = true
		},
	)

	return &GarageObjectStorage{
		client: client,
		bucket: config.Bucket,
		ready:  true,
	}
}

func (storage *GarageObjectStorage) Health(
	requestContext context.Context,
) error {
	if !storage.ready {
		return objectStorageNotConfiguredError
	}

	_, listObjectsError := storage.client.ListObjectsV2(
		requestContext,
		&s3.ListObjectsV2Input{
			Bucket:  aws.String(storage.bucket),
			MaxKeys: aws.Int32(1),
		},
	)

	return listObjectsError
}

func (storage *GarageObjectStorage) Put(
	requestContext context.Context,
	key string,
	options PutOptions,
	body io.Reader,
) error {
	if !storage.ready {
		return objectStorageNotConfiguredError
	}

	_, putError := storage.client.PutObject(
		requestContext,
		&s3.PutObjectInput{
			Bucket:        aws.String(storage.bucket),
			Key:           aws.String(key),
			Body:          body,
			ContentLength: aws.Int64(options.Size),
			ContentType:   aws.String(options.ContentType),
			Metadata:      options.Metadata,
		},
	)

	return putError
}

func (storage *GarageObjectStorage) Head(
	requestContext context.Context,
	key string,
) (ObjectMetadata, error) {
	if !storage.ready {
		return ObjectMetadata{}, objectStorageNotConfiguredError
	}

	object, headError := storage.client.HeadObject(
		requestContext,
		&s3.HeadObjectInput{
			Bucket: aws.String(storage.bucket),
			Key:    aws.String(key),
		},
	)
	if headError != nil {
		return ObjectMetadata{}, headError
	}

	return ObjectMetadata{
		Key:          key,
		Size:         aws.ToInt64(object.ContentLength),
		ETag:         aws.ToString(object.ETag),
		ContentType:  aws.ToString(object.ContentType),
		LastModified: aws.ToTime(object.LastModified),
		Metadata:     object.Metadata,
	}, nil
}

func (storage *GarageObjectStorage) List(
	requestContext context.Context,
	prefix string,
) ([]ObjectMetadata, error) {
	if !storage.ready {
		return nil, objectStorageNotConfiguredError
	}

	var objects []ObjectMetadata
	var continuationToken *string

	for {
		page, listError := storage.client.ListObjectsV2(
			requestContext,
			&s3.ListObjectsV2Input{
				Bucket:            aws.String(storage.bucket),
				Prefix:            aws.String(prefix),
				ContinuationToken: continuationToken,
			},
		)
		if listError != nil {
			return nil, listError
		}

		for _, object := range page.Contents {
			objects = append(objects, ObjectMetadata{
				Key:          aws.ToString(object.Key),
				Size:         aws.ToInt64(object.Size),
				ETag:         aws.ToString(object.ETag),
				LastModified: aws.ToTime(object.LastModified),
			})
		}

		if !aws.ToBool(page.IsTruncated) || page.NextContinuationToken == nil {
			return objects, nil
		}

		continuationToken = page.NextContinuationToken
	}
}

func (storage *GarageObjectStorage) Get(
	requestContext context.Context,
	key string,
) (io.ReadCloser, error) {
	if !storage.ready {
		return nil, objectStorageNotConfiguredError
	}

	object, getError := storage.client.GetObject(
		requestContext,
		&s3.GetObjectInput{
			Bucket: aws.String(storage.bucket),
			Key:    aws.String(key),
		},
	)
	if getError != nil {
		return nil, getError
	}

	return object.Body, nil
}

func (storage *GarageObjectStorage) Delete(
	requestContext context.Context,
	key string,
) error {
	if !storage.ready {
		return objectStorageNotConfiguredError
	}

	_, deleteError := storage.client.DeleteObject(
		requestContext,
		&s3.DeleteObjectInput{
			Bucket: aws.String(storage.bucket),
			Key:    aws.String(key),
		},
	)

	return deleteError
}
