package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"

	"golang.org/x/crypto/argon2"
)

const (
	argonMemory  = 64 * 1024
	argonTime    = 3
	argonThreads = 2
	argonKeyLen  = 32

	maxArgonMemory     = 1024 * 1024
	maxArgonIterations = 10
	maxArgonThreads    = 64
	maxArgonHashLength = 128
)

func hashPassword(password string) (string, error) {
	salt := make([]byte, 16)

	if _, randomReadError := rand.Read(salt); randomReadError != nil {
		return "", randomReadError
	}

	hash := argon2.IDKey(
		[]byte(password),
		salt,
		argonTime,
		argonMemory,
		argonThreads,
		argonKeyLen,
	)

	return fmt.Sprintf(
		"argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
		argonMemory,
		argonTime,
		argonThreads,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(hash),
	), nil
}

func verifyPassword(
	encoded string,
	password string,
) bool {
	parts := strings.Split(encoded, "$")

	if len(parts) != 5 ||
		parts[0] != "argon2id" ||
		parts[1] != "v=19" {
		return false
	}

	parameters := strings.Split(parts[2], ",")
	if len(parameters) != 3 {
		return false
	}

	memory, memoryParseError := strconv.ParseUint(
		strings.TrimPrefix(parameters[0], "m="),
		10,
		32,
	)
	if memoryParseError != nil ||
		memory == 0 ||
		memory > maxArgonMemory {
		return false
	}

	iterations, iterationsParseError := strconv.ParseUint(
		strings.TrimPrefix(parameters[1], "t="),
		10,
		32,
	)
	if iterationsParseError != nil ||
		iterations == 0 ||
		iterations > maxArgonIterations {
		return false
	}

	threads, threadsParseError := strconv.ParseUint(
		strings.TrimPrefix(parameters[2], "p="),
		10,
		8,
	)
	if threadsParseError != nil ||
		threads == 0 ||
		threads > maxArgonThreads {
		return false
	}

	salt, saltDecodeError := base64.RawStdEncoding.
		DecodeString(parts[3])
	if saltDecodeError != nil || len(salt) == 0 {
		return false
	}

	expectedHash, hashDecodeError := base64.RawStdEncoding.
		DecodeString(parts[4])
	if hashDecodeError != nil ||
		len(expectedHash) == 0 ||
		len(expectedHash) > maxArgonHashLength {
		return false
	}

	actualHash := argon2.IDKey(
		[]byte(password),
		salt,
		uint32(iterations),
		uint32(memory),
		uint8(threads),
		uint32(len(expectedHash)),
	)

	return subtle.ConstantTimeCompare(
		actualHash,
		expectedHash,
	) == 1
}
