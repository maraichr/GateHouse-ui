package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/maraichr/GateHouse-ui/internal/parity"
)

func main() {
	reactPath := flag.String("react-renderer", "runtime/src/renderer.tsx", "Path to React renderer map file")
	flutterPath := flag.String("flutter-renderer", "flutter_runtime/lib/renderer/renderer.dart", "Path to Flutter renderer map file")
	jsonOut := flag.String("json-out", "", "Optional output path for JSON report")
	strict := flag.Bool("strict", false, "Exit non-zero if any runtime misses engine kinds")
	flag.Parse()

	report, err := parity.BuildReport(*reactPath, *flutterPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "parity check failed: %v\n", err)
		os.Exit(1)
	}

	out, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "marshal report: %v\n", err)
		os.Exit(1)
	}

	if *jsonOut != "" {
		if err := os.WriteFile(*jsonOut, out, 0o644); err != nil {
			fmt.Fprintf(os.Stderr, "write json-out: %v\n", err)
			os.Exit(1)
		}
	} else {
		fmt.Println(string(out))
	}

	if *strict {
		for name, runtime := range report.Runtimes {
			if len(runtime.Missing) > 0 {
				fmt.Fprintf(os.Stderr, "%s runtime is missing %d engine kinds\n", name, len(runtime.Missing))
				os.Exit(2)
			}
		}
	}
}
