package main

import "testing"

func TestPasswordHash(t *testing.T) {
	hash, err := hashPassword("Rkm@123456")
	if err != nil {
		t.Fatal(err)
	}
	if !verifyPassword(hash, "Rkm@123456") {
		t.Fatal("expected password to verify")
	}
	if verifyPassword(hash, "wrong") {
		t.Fatal("expected wrong password to fail")
	}
}
