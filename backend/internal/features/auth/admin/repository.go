package admin

import "gorm.io/gorm"

type userRecord struct {
	ID          string `gorm:"column:id;primaryKey"`
	Email       string `gorm:"column:email"`
	Name        string `gorm:"column:name"`
	Role        string `gorm:"column:role"`
	Active      bool   `gorm:"column:active"`
	CreatedAt   int64  `gorm:"column:created_at"`
	LastLoginAt *int64 `gorm:"column:last_login_at"`
}

func (userRecord) TableName() string {
	return "users"
}

type userRepository struct {
	database *gorm.DB
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
