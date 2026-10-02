package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"golang.org/x/crypto/argon2"
	"strconv"
	"strings"
)

const argonMemory, argonTime, argonThreads, argonKeyLen = 64 * 1024, 3, 2, 32

func hashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	if _, randomReadError := rand.Read(salt); randomReadError != nil {
		return "", randomReadError
	}
	hash := argon2.IDKey([]byte(password), salt, argonTime, argonMemory, argonThreads, argonKeyLen)
	return fmt.Sprintf("argon2id$v=19$m=%d,t=%d,p=%d$%s$%s", argonMemory, argonTime, argonThreads, base64.RawStdEncoding.EncodeToString(salt), base64.RawStdEncoding.EncodeToString(hash)), nil
}

func verifyPassword(encoded, password string) bool {
	parts := strings.Split(encoded, "$")
	if len(parts) != 5 {
		return false
	}
	params := strings.Split(parts[2], ",")
	if len(params) != 3 {
		return false
	}
	memory, _ := strconv.ParseUint(strings.TrimPrefix(params[0], "m="), 10, 32)
	iterations, _ := strconv.ParseUint(strings.TrimPrefix(params[1], "t="), 10, 32)
	threads, _ := strconv.ParseUint(strings.TrimPrefix(params[2], "p="), 10, 8)
	salt, err1 := base64.RawStdEncoding.DecodeString(parts[3])
	expected, err2 := base64.RawStdEncoding.DecodeString(parts[4])
	if err1 != nil || err2 != nil {
		return false
	}
	actual := argon2.IDKey([]byte(password), salt, uint32(iterations), uint32(memory), uint8(threads), uint32(len(expected)))
	return subtle.ConstantTimeCompare(actual, expected) == 1
}
