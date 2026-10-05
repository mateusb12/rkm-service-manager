package auth

type authUser struct {
	ID          string   `json:"id"`
	Email       string   `json:"email"`
	Name        string   `json:"name"`
	Role        string   `json:"role"`
	RoleLabel   string   `json:"roleLabel"`
	Permissions []string `json:"permissions"`
}

type userModel struct {
	ID           string `gorm:"column:id;primaryKey"`
	Email        string `gorm:"column:email;not null;uniqueIndex:ux_users_email"`
	Name         string `gorm:"column:name;not null"`
	Role         string `gorm:"column:role;not null"`
	PasswordHash string `gorm:"column:password_hash;not null"`
	Active       bool   `gorm:"column:active;not null;default:true"`
	CreatedAt    int64  `gorm:"column:created_at;not null"`
}

func (userModel) TableName() string {
	return "users"
}

type sessionModel struct {
	ID                string     `gorm:"column:id;primaryKey"`
	UserID            string     `gorm:"column:user_id;not null;index"`
	AccessHash        string     `gorm:"column:access_hash;not null;uniqueIndex:ux_sessions_access"`
	RefreshHash       string     `gorm:"column:refresh_hash;not null;uniqueIndex:ux_sessions_refresh"`
	CreatedAt         int64      `gorm:"column:created_at;not null"`
	LastUsedAt        int64      `gorm:"column:last_used_at;not null"`
	AccessExpiresAt   int64      `gorm:"column:access_expires_at;not null"`
	ExpiresAt         int64      `gorm:"column:expires_at;not null"`
	AbsoluteExpiresAt int64      `gorm:"column:absolute_expires_at;not null"`
	RevokedAt         *int64     `gorm:"column:revoked_at"`
	User              *userModel `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
}

func (sessionModel) TableName() string {
	return "sessions"
}

func toAuthUser(storedUser userModel) (authUser, bool) {
	permissions, allowed := rolePermissions[storedUser.Role]
	if !allowed {
		return authUser{}, false
	}

	return authUser{
		ID:          storedUser.ID,
		Email:       storedUser.Email,
		Name:        storedUser.Name,
		Role:        storedUser.Role,
		RoleLabel:   roleLabels[storedUser.Role],
		Permissions: permissions,
	}, true
}
