package clients

import (
	"errors"
	"strings"

	"gorm.io/gorm"
)

var (
	clientNotFoundError = errors.New(
		"client not found",
	)
	duplicateCNPJError = errors.New(
		"client cnpj already exists",
	)
)

func (module *Module) listClients(
	search string,
) ([]Client, error) {
	storedClients := make([]Client, 0)

	queryError := module.database.
		Order("razao_social COLLATE NOCASE ASC").
		Find(&storedClients).
		Error

	if queryError != nil {
		return nil, queryError
	}

	search = strings.TrimSpace(search)

	if search == "" {
		return storedClients, nil
	}

	normalizedSearch := normalizeSearchText(search)

	cnpjSearch := ""
	if hasOnlyCNPJFormattingCharacters(search) {
		cnpjSearch = onlyDigits(search)
	}

	filteredClients := make([]Client, 0)

	for _, client := range storedClients {
		nameMatches :=
			strings.Contains(
				normalizeSearchText(client.RazaoSocial),
				normalizedSearch,
			) ||
				strings.Contains(
					normalizeSearchText(client.NomeFantasia),
					normalizedSearch,
				)

		cnpjMatches :=
			cnpjSearch != "" &&
				strings.Contains(
					client.CNPJ,
					cnpjSearch,
				)

		if nameMatches || cnpjMatches {
			filteredClients = append(
				filteredClients,
				client,
			)
		}
	}

	return filteredClients, nil
}

func (module *Module) findClient(
	clientID uint64,
) (Client, error) {
	var client Client

	queryError := module.database.
		First(&client, clientID).
		Error

	if errors.Is(
		queryError,
		gorm.ErrRecordNotFound,
	) {
		return Client{}, clientNotFoundError
	}

	if queryError != nil {
		return Client{}, queryError
	}

	return client, nil
}

func (module *Module) createClient(
	input clientInput,
) (Client, error) {
	client := Client{
		CNPJ:         input.CNPJ,
		RazaoSocial:  input.RazaoSocial,
		NomeFantasia: input.NomeFantasia,
	}

	createError := module.database.
		Create(&client).
		Error

	if errors.Is(
		createError,
		gorm.ErrDuplicatedKey,
	) {
		return Client{}, duplicateCNPJError
	}

	if createError != nil {
		return Client{}, createError
	}

	return client, nil
}

func (module *Module) updateClient(
	clientID uint64,
	input clientInput,
) (Client, error) {
	client, findError := module.findClient(clientID)
	if findError != nil {
		return Client{}, findError
	}

	client.CNPJ = input.CNPJ
	client.RazaoSocial = input.RazaoSocial
	client.NomeFantasia = input.NomeFantasia

	updateError := module.database.
		Save(&client).
		Error

	if errors.Is(
		updateError,
		gorm.ErrDuplicatedKey,
	) {
		return Client{}, duplicateCNPJError
	}

	if updateError != nil {
		return Client{}, updateError
	}

	return client, nil
}

func (module *Module) deleteClient(
	clientID uint64,
) error {
	deleteResult := module.database.
		Delete(&Client{}, clientID)

	if deleteResult.Error != nil {
		return deleteResult.Error
	}

	if deleteResult.RowsAffected == 0 {
		return clientNotFoundError
	}

	return nil
}
