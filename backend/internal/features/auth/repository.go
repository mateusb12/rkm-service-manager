package auth

import (
	"rkm-service-manager/backend/internal/shared/config"
	"time"

	"gorm.io/gorm/clause"
)

func (module *Module) migrate() error {
	migrationError := module.database.AutoMigrate(
		&userModel{},
		&sessionModel{},
	)
	if migrationError != nil {
		return migrationError
	}

	return module.database.
		Model(&userModel{}).
		Where(
			"email = ? AND role = ?",
			"admin@rkm.com.br",
			"admin",
		).
		Update("name", "Osmar Lamarck").
		Error
}

func (module *Module) seedUsers() error {
	type seedUser struct {
		ID       string
		Email    string
		Name     string
		Role     string
		Password string
	}

	users := []seedUser{
		{
			ID:       "u5",
			Email:    "admin@rkm.com.br",
			Name:     "Osmar Lamarck",
			Role:     "admin",
			Password: config.Env("DUMMY_PASSWORD_ADMIN", "Rkm@123456"),
		},
		{
			ID:       "u1",
			Email:    "mecanico@rkm.com.br",
			Name:     "Carlos M.",
			Role:     "mechanic",
			Password: config.Env("DUMMY_PASSWORD_MECHANIC", "Rkm@123456"),
		},
		{
			ID:       "u4",
			Email:    "pcp@rkm.com.br",
			Name:     "PCP RKM",
			Role:     "pcp",
			Password: config.Env("DUMMY_PASSWORD_PCP", "Rkm@123456"),
		},
		{
			ID:       "u7",
			Email:    "comercial@rkm.com.br",
			Name:     "Comercial RKM",
			Role:     "commercial",
			Password: config.Env("DUMMY_PASSWORD_COMMERCIAL", "Rkm@123456"),
		},
	}

	for _, user := range users {
		passwordHash, hashError := hashPassword(user.Password)
		if hashError != nil {
			return hashError
		}

		storedUser := userModel{
			ID:           user.ID,
			Email:        user.Email,
			Name:         user.Name,
			Role:         user.Role,
			PasswordHash: passwordHash,
			Active:       true,
			CreatedAt:    time.Now().Unix(),
		}

		insertError := module.database.
			Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "email"}},
				DoNothing: true,
			}).
			Create(&storedUser).
			Error

		if insertError != nil {
			return insertError
		}
	}

	return nil
}

func (module *Module) findUser(
	email string,
) (authUser, string, bool) {
	var storedUser userModel

	queryError := module.database.
		Where("email = ? AND active = ?", email, true).
		First(&storedUser).
		Error

	if queryError != nil {
		return authUser{}, "", false
	}

	user, allowed := toAuthUser(storedUser)
	if !allowed {
		return authUser{}, "", false
	}

	return user, storedUser.PasswordHash, true
}

func (module *Module) findUserByID(
	userID string,
) (authUser, bool) {
	var storedUser userModel

	queryError := module.database.
		Where("id = ? AND active = ?", userID, true).
		First(&storedUser).
		Error

	if queryError != nil {
		return authUser{}, false
	}

	return toAuthUser(storedUser)
}
