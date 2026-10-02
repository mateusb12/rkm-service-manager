package auth

import (
	"rkm-service-manager/backend/internal/shared/config"
	"time"
)

func (module *Module) initDB() error {
	_, schemaError := module.db.Exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  access_hash TEXT NOT NULL UNIQUE,
  refresh_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL,
  access_expires_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  absolute_expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_sessions_access ON sessions(access_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh ON sessions(refresh_hash);
UPDATE users SET name='Osmar Lamarck' WHERE email='admin@rkm.com.br' AND role='admin';
`)
	return schemaError
}

func (module *Module) seedUsers() error {
	users := []struct{ id, email, name, role, password string }{
		{"u5", "admin@rkm.com.br", "Osmar Lamarck",
			"admin", config.Env("DUMMY_PASSWORD_ADMIN", "Rkm@123456")},
		{"u1", "mecanico@rkm.com.br", "Carlos M.",
			"mechanic", config.Env("DUMMY_PASSWORD_MECHANIC", "Rkm@123456")},
		{"u4", "pcp@rkm.com.br", "PCP RKM",
			"pcp", config.Env("DUMMY_PASSWORD_PCP", "Rkm@123456")},
		{"u7", "comercial@rkm.com.br", "Comercial RKM",
			"commercial", config.Env("DUMMY_PASSWORD_COMMERCIAL", "Rkm@123456")},
	}
	for _, user := range users {
		hash, hashError := hashPassword(user.password)
		if hashError != nil {
			return hashError
		}
		_, insertError := module.db.Exec(`INSERT INTO users(id,email,name,role,password_hash,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(email) DO NOTHING`, user.id, user.email, user.name, user.role, hash, time.Now().Unix())
		if insertError != nil {
			return insertError
		}
	}
	return nil
}

func (module *Module) findUser(email string) (authUser, string, bool) {
	var user authUser
	var hash string
	queryError := module.db.QueryRow(`SELECT id,email,name,role,password_hash FROM users WHERE email=? AND active=1`, email).Scan(&user.ID, &user.Email, &user.Name, &user.Role, &hash)
	if queryError != nil {
		return authUser{}, "", false
	}
	permissions, allowed := rolePermissions[user.Role]
	if !allowed {
		return authUser{}, "", false
	}
	user.RoleLabel = roleLabels[user.Role]
	user.Permissions = permissions
	return user, hash, true
}

func (module *Module) findUserByID(id string) (authUser, bool) {
	var user authUser
	queryError := module.db.QueryRow(`SELECT id,email,name,role FROM users WHERE id=? AND active=1`, id).Scan(&user.ID, &user.Email, &user.Name, &user.Role)
	if queryError != nil {
		return authUser{}, false
	}
	permissions, allowed := rolePermissions[user.Role]
	if !allowed {
		return authUser{}, false
	}
	user.RoleLabel = roleLabels[user.Role]
	user.Permissions = permissions
	return user, true
}
