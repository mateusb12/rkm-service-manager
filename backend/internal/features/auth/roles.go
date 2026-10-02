package auth

var rolePermissions = map[string][]string{
	"admin": {"*"},
	"mechanic": {
		"service.view_assigned",
		"service.edit_assigned",
		"authorization.request",
		"dashboard.mybench",
	},
	"pcp": {
		"service.view_status",
		"service.close_administrative",
		"dashboard.pcp",
	},
	"commercial": {"dashboard.view"},
}

var roleLabels = map[string]string{
	"admin":      "Admin",
	"mechanic":   "Mecânico",
	"pcp":        "PCP",
	"commercial": "Comercial",
}
