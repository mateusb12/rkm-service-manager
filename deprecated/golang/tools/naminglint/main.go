package main

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"unicode/utf8"
)

type violation struct {
	position token.Position
	rule     string
	message  string
}

func main() {
	fileSet := token.NewFileSet()
	violations := []violation{}

	report := func(
		identifier *ast.Ident,
		rule string,
		message string,
	) {
		violations = append(violations, violation{
			position: fileSet.Position(identifier.Pos()),
			rule:     rule,
			message:  message,
		})
	}

	checkVariable := func(identifier *ast.Ident) {
		if identifier == nil || identifier.Name == "_" {
			return
		}

		if utf8.RuneCountInString(identifier.Name) != 1 {
			return
		}

		report(
			identifier,
			"RKM-GO-002",
			fmt.Sprintf(
				"variável '%s' possui apenas uma letra",
				identifier.Name,
			),
		)
	}

	checkFields := func(fields *ast.FieldList) {
		if fields == nil {
			return
		}

		for _, field := range fields.List {
			for _, identifier := range field.Names {
				checkVariable(identifier)
			}
		}
	}

	scanError := filepath.WalkDir(
		".",
		func(
			path string,
			entry fs.DirEntry,
			visitError error,
		) error {
			if visitError != nil {
				return visitError
			}

			if entry.IsDir() {
				switch entry.Name() {
				case "tmp", "vendor", ".git":
					return filepath.SkipDir
				}
				return nil
			}

			if filepath.Ext(path) != ".go" {
				return nil
			}

			parsed, parseError := parser.ParseFile(
				fileSet,
				path,
				nil,
				0,
			)
			if parseError != nil {
				return parseError
			}

			ast.Inspect(parsed, func(node ast.Node) bool {
				switch declaration := node.(type) {

				case *ast.Ident:
					// Regra existente: proibir err.
					if declaration.Name == "err" {
						report(
							declaration,
							"RKM-GO-001",
							"identificador 'err' proibido",
						)
					}

				case *ast.AssignStmt:
					// Exemplo: x := algumaCoisa()
					if declaration.Tok == token.DEFINE {
						for _, expression := range declaration.Lhs {
							if identifier, ok := expression.(*ast.Ident); ok {
								checkVariable(identifier)
							}
						}
					}

				case *ast.RangeStmt:
					// Exemplo: for k, v := range itens
					if declaration.Tok == token.DEFINE {
						if identifier, ok := declaration.Key.(*ast.Ident); ok {
							checkVariable(identifier)
						}
						if identifier, ok := declaration.Value.(*ast.Ident); ok {
							checkVariable(identifier)
						}
					}

				case *ast.GenDecl:
					// Exemplo: var x string
					if declaration.Tok == token.VAR {
						for _, specification := range declaration.Specs {
							values, ok := specification.(*ast.ValueSpec)
							if !ok {
								continue
							}
							for _, identifier := range values.Names {
								checkVariable(identifier)
							}
						}
					}

				case *ast.FuncDecl:
					// Receiver: func (s *Module) executar()
					checkFields(declaration.Recv)

				case *ast.FuncType:
					// Parâmetros e retornos nomeados.
					checkFields(declaration.Params)
					checkFields(declaration.Results)
				}

				return true
			})

			return nil
		},
	)

	if scanError != nil {
		fmt.Fprintln(os.Stderr, scanError)
		os.Exit(2)
	}

	sort.Slice(violations, func(first, second int) bool {
		left := violations[first]
		right := violations[second]

		if left.position.Filename != right.position.Filename {
			return left.position.Filename < right.position.Filename
		}

		return left.position.Offset < right.position.Offset
	})

	if len(violations) == 0 {
		fmt.Println("✅ RKM-GO-001: nenhum identificador proibido.")
		fmt.Println("✅ RKM-GO-002: nenhuma variável de uma letra.")
		return
	}

	counts := map[string]int{}

	for _, finding := range violations {
		counts[finding.rule]++
	}

	for index, finding := range violations {
		if index >= 40 {
			break
		}

		fmt.Fprintf(
			os.Stderr,
			"%s:%d:%d: %s: %s\n",
			finding.position.Filename,
			finding.position.Line,
			finding.position.Column,
			finding.rule,
			finding.message,
		)
	}

	fmt.Fprintf(
		os.Stderr,
		"\nRKM-GO-001: %d ocorrência(s)\n",
		counts["RKM-GO-001"],
	)
	fmt.Fprintf(
		os.Stderr,
		"RKM-GO-002: %d ocorrência(s)\n",
		counts["RKM-GO-002"],
	)

	if len(violations) > 40 {
		fmt.Fprintf(
			os.Stderr,
			"Exibindo as primeiras 40 de %d ocorrências.\n",
			len(violations),
		)
	}

	os.Exit(1)
}
