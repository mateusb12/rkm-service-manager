package admin

import (
	"errors"
	"strings"

	"gorm.io/gorm"
)

var (
	userNotFound   = errors.New("user not found")
	userEmailTaken = errors.New("user email already exists")
)

type userRecord struct {
	ID           string `gorm:"column:id;primaryKey"`
	Email        string `gorm:"column:email"`
	Name         string `gorm:"column:name"`
	Role         string `gorm:"column:role"`
	PasswordHash string `gorm:"column:password_hash"`
	Active       bool   `gorm:"column:active"`
	CreatedAt    int64  `gorm:"column:created_at"`
	LastLoginAt  *int64 `gorm:"column:last_login_at"`
}

func (userRecord) TableName() string {
	return "users"
}

type userRepository struct {
	database *gorm.DB
}

type sessionRecord struct {
	ID string `gorm:"column:id;primaryKey"`
}

func (sessionRecord) TableName() string {
	return "sessions"
}

func newUserRepository(database *gorm.DB) *userRepository {
	return &userRepository{database: database}
}

func (repository *userRepository) list() ([]userRecord, error) {
	var records []userRecord
	if queryError := repository.database.Order("name ASC").Find(&records).Error; queryError != nil {
		return nil, queryError
	}

	return records, nil
}

func (repository *userRepository) find(id string) (userRecord, error) {
	var record userRecord
	queryError := repository.database.Where("id = ?", id).First(&record).Error
	if errors.Is(queryError, gorm.ErrRecordNotFound) {
		return userRecord{}, userNotFound
	}
	return record, queryError
}

func (repository *userRepository) create(record userRecord) error {
	var count int64
	if queryError := repository.database.
		Model(&userRecord{}).
		Where("LOWER(email) = ?", strings.ToLower(record.Email)).
		Count(&count).Error; queryError != nil {
		return queryError
	}
	if count > 0 {
		return userEmailTaken
	}
	return repository.database.Create(&record).Error
}

func (repository *userRepository) update(
	id string,
	changes map[string]any,
) (userRecord, error) {
	if _, findError := repository.find(id); findError != nil {
		return userRecord{}, findError
	}

	if email, changed := changes["email"].(string); changed {
		var count int64
		queryError := repository.database.
			Model(&userRecord{}).
			Where("LOWER(email) = ? AND id <> ?", strings.ToLower(email), id).
			Count(&count).Error
		if queryError != nil {
			return userRecord{}, queryError
		}
		if count > 0 {
			return userRecord{}, userEmailTaken
		}
	}

	if updateError := repository.database.
		Model(&userRecord{}).
		Where("id = ?", id).
		Updates(changes).Error; updateError != nil {
		return userRecord{}, updateError
	}

	return repository.find(id)
}

func (repository *userRepository) deactivate(id string) (userRecord, error) {
	if updateResult := repository.database.
		Model(&userRecord{}).
		Where("id = ?", id).
		Update("active", false); updateResult.Error != nil {
		return userRecord{}, updateResult.Error
	} else if updateResult.RowsAffected == 0 {
		return userRecord{}, userNotFound
	}

	return repository.find(id)
}

func (repository *userRepository) hardDelete(id string) error {
	return repository.database.Transaction(func(transaction *gorm.DB) error {
		var user userRecord
		if queryError := transaction.Where("id = ?", id).First(&user).Error; queryError != nil {
			if errors.Is(queryError, gorm.ErrRecordNotFound) {
				return userNotFound
			}
			return queryError
		}

		if deleteSessionsError := transaction.
			Where("user_id = ?", id).
			Delete(&sessionRecord{}).Error; deleteSessionsError != nil {
			return deleteSessionsError
		}

		return transaction.Delete(&user).Error
	})
}
