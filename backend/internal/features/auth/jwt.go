package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type accessClaims struct {
	Email       string   `json:"email"`
	Name        string   `json:"name"`
	Role        string   `json:"role"`
	RoleLabel   string   `json:"roleLabel"`
	Permissions []string `json:"permissions"`
	jwt.RegisteredClaims
}

func (module *Module) issueAccessToken(user authUser, expiresAt time.Time) (string, error) {
	claims := accessClaims{
		Email:       user.Email,
		Name:        user.Name,
		Role:        user.Role,
		RoleLabel:   user.RoleLabel,
		Permissions: user.Permissions,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "rkm-service-manager",
			Subject:   user.ID,
			Audience:  []string{"rkm-api"},
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			ID:        fmt.Sprintf("%s-%d", user.ID, time.Now().UnixNano()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(module.jwtSecret))
}

func (module *Module) parseAccessToken(value string) (*accessClaims, error) {
	token, parseError := jwt.ParseWithClaims(
		value,
		&accessClaims{},
		func(token *jwt.Token) (any, error) {
			if token.Method != jwt.SigningMethodHS256 {
				return nil, fmt.Errorf("unexpected jwt signing method")
			}

			return []byte(module.jwtSecret), nil
		},
		jwt.WithAudience("rkm-api"),
		jwt.WithIssuer("rkm-service-manager"),
	)
	if parseError != nil {
		return nil, parseError
	}

	claims, claimsValid := token.Claims.(*accessClaims)
	if !claimsValid || !token.Valid || claims.Subject == "" {
		return nil, fmt.Errorf("invalid jwt claims")
	}

	return claims, nil
}
