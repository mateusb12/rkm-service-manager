package clients

import (
	"strings"
	"unicode/utf8"
)

type Client struct {
	ID           uint64 `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	CNPJ         string `json:"cnpj" gorm:"column:cnpj;size:14;not null;uniqueIndex:ux_clients_cnpj"`
	RazaoSocial  string `json:"razaoSocial" gorm:"column:razao_social;size:160;not null;index:idx_clients_razao_social"`
	NomeFantasia string `json:"nomeFantasia" gorm:"column:nome_fantasia;size:120;not null;index:idx_clients_nome_fantasia"`
}

func (Client) TableName() string {
	return "clients"
}

type clientInput struct {
	CNPJ         string `json:"cnpj"`
	RazaoSocial  string `json:"razaoSocial"`
	NomeFantasia string `json:"nomeFantasia"`
}

var portugueseAccentReplacer = strings.NewReplacer(
	"á", "a",
	"à", "a",
	"â", "a",
	"ã", "a",
	"ä", "a",
	"é", "e",
	"è", "e",
	"ê", "e",
	"ë", "e",
	"í", "i",
	"ì", "i",
	"î", "i",
	"ï", "i",
	"ó", "o",
	"ò", "o",
	"ô", "o",
	"õ", "o",
	"ö", "o",
	"ú", "u",
	"ù", "u",
	"û", "u",
	"ü", "u",
	"ç", "c",
)

func normalizeClientInput(
	input clientInput,
) (clientInput, map[string]string) {
	rawCNPJ := strings.TrimSpace(input.CNPJ)

	normalized := clientInput{
		CNPJ:         onlyDigits(rawCNPJ),
		RazaoSocial:  strings.TrimSpace(input.RazaoSocial),
		NomeFantasia: strings.TrimSpace(input.NomeFantasia),
	}

	validationErrors := map[string]string{}

	if rawCNPJ == "" {
		validationErrors["cnpj"] = "Informe o CNPJ."
	} else if !hasOnlyCNPJFormattingCharacters(rawCNPJ) {
		validationErrors["cnpj"] =
			"O CNPJ deve conter apenas números e os caracteres de formatação . / -."
	} else if len(normalized.CNPJ) != 14 {
		validationErrors["cnpj"] =
			"O CNPJ deve conter 14 dígitos."
	}

	if normalized.RazaoSocial == "" {
		validationErrors["razaoSocial"] =
			"Informe a razão social."
	} else if utf8.RuneCountInString(
		normalized.RazaoSocial,
	) > 160 {
		validationErrors["razaoSocial"] =
			"A razão social deve ter no máximo 160 caracteres."
	}

	if normalized.NomeFantasia == "" {
		validationErrors["nomeFantasia"] =
			"Informe o nome fantasia."
	} else if utf8.RuneCountInString(
		normalized.NomeFantasia,
	) > 120 {
		validationErrors["nomeFantasia"] =
			"O nome fantasia deve ter no máximo 120 caracteres."
	}

	return normalized, validationErrors
}

func onlyDigits(value string) string {
	var builder strings.Builder

	for position := 0; position < len(value); position++ {
		character := value[position]

		if character >= '0' && character <= '9' {
			builder.WriteByte(character)
		}
	}

	return builder.String()
}

func normalizeSearchText(value string) string {
	value = strings.ToLower(
		strings.TrimSpace(value),
	)

	return portugueseAccentReplacer.Replace(value)
}

func hasOnlyCNPJFormattingCharacters(value string) bool {
	trimmed := strings.TrimSpace(value)

	if trimmed == "" {
		return false
	}

	for position := 0; position < len(trimmed); position++ {
		character := trimmed[position]

		if character >= '0' &&
			character <= '9' {
			continue
		}

		switch character {
		case ' ', '.', '/', '-':
			continue
		default:
			return false
		}
	}

	return true
}
